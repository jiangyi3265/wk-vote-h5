<template>
	<view class="page">
		<view v-if="loading" class="tip">加载中…</view>

		<block v-else>
			<!-- 头部信息 + 票数进度 -->
			<view class="topbar">
				<view class="act-title">{{ activity.title }}</view>
				<view class="quota">
					<view class="quota-text">
						已用 <text class="used">{{ used }}</text> / {{ max }} 票
					</view>
					<view class="quota-track">
						<view class="quota-fill" :style="{ width: (max ? used / max * 100 : 0) + '%' }"></view>
					</view>
				</view>
			</view>

			<!-- 姓名 -->
			<view class="name-box" v-if="requireName">
				<text class="name-label">你的名字</text>
				<input class="name-input" v-model="voterName" placeholder="请输入你的名字" maxlength="20" />
			</view>

			<!-- 维度图例 -->
			<view class="legend">
				<text class="legend-tip">每个项目只能选择 1 位候选人，点同项目其他人会自动改选</text>
			</view>

			<!-- 候选人列表 -->
			<view class="clist">
				<view class="ccard" v-for="(c, idx) in candidates" :key="c.candidateId">
					<view class="ccard-head">
						<view class="avatar" :style="{ background: avatarColor(idx) }">
							<image v-if="c.avatar" :src="c.avatar" class="avatar-img" mode="aspectFill"></image>
							<text v-else>{{ shortName(c.name) }}</text>
						</view>
						<view class="cinfo">
							<view class="cname"><text class="cno">{{ c.no }}</text>{{ c.name }}</view>
							<view class="cdesc">{{ c.description || '这位同学很神秘~' }}</view>
						</view>
						<view class="cbadge" v-if="candVotes(c.candidateId) > 0">+{{ candVotes(c.candidateId) }}</view>
					</view>
					<view class="chips">
						<view
							v-for="o in options"
							:key="o.optionId"
							class="chip"
							:class="{ active: isSel(c.candidateId, o.optionId) }"
							:style="chipStyle(c.candidateId, o.optionId, o.color)"
							@click="toggle(c.candidateId, o.optionId)">
							<text class="chip-icon">{{ o.icon }}</text>
							<text>{{ o.name }}</text>
						</view>
					</view>
				</view>
			</view>

			<view class="bottom-pad"></view>

			<!-- 底部提交栏 -->
			<view class="submit-bar">
				<view class="sb-left">
					<text class="sb-num">{{ used }}</text>
					<text class="sb-unit">/ {{ max }} 票</text>
				</view>
				<button class="sb-btn" :disabled="used === 0 || submitting" @click="submit">
					{{ submitting ? '提交中…' : '提交投票' }}
				</button>
			</view>
		</block>
	</view>
</template>

<script>
	import { getActivityDetail, submitVote, getClientId } from '@/common/api.js'

	const AVATAR_COLORS = ['#6a5acd', '#ec4899', '#f59e0b', '#22c55e', '#06b6d4', '#a855f7', '#ef4444', '#3b82f6']

	export default {
		data() {
			return {
				activityId: null,
				loading: true,
				submitting: false,
				activity: {},
				candidates: [],
				options: [],
				voterName: '',
				selected: []   // ['candId_optId', ...]
			}
		},
		computed: {
			used() {
				return this.selected.length
			},
			max() {
				const voteLimit = this.activity.votesPerPerson || 8
				return this.options.length ? Math.min(voteLimit, this.options.length) : voteLimit
			},
			requireName() {
				return this.activity.requireName === '1'
			}
		},
		onLoad(opt) {
			this.activityId = opt.activityId
			this.load()
		},
		methods: {
			load() {
				this.loading = true
				getActivityDetail(this.activityId).then(res => {
					this.activity = res.data.activity || {}
					this.candidates = res.data.candidates || []
					this.options = res.data.options || []
				}).catch(err => {
					uni.showToast({ title: err.message, icon: 'none' })
				}).finally(() => {
					this.loading = false
				})
			},
			key(cid, oid) {
				return cid + '_' + oid
			},
			isSel(cid, oid) {
				return this.selected.indexOf(this.key(cid, oid)) > -1
			},
			candVotes(cid) {
				return this.selected.filter(k => k.indexOf(cid + '_') === 0).length
			},
			optionIndex(oid) {
				return this.selected.findIndex(k => Number(k.split('_')[1]) === Number(oid))
			},
			toggle(cid, oid) {
				const k = this.key(cid, oid)
				const i = this.selected.indexOf(k)
				if (i > -1) {
					this.selected.splice(i, 1)
				} else {
					const oi = this.optionIndex(oid)
					if (oi > -1) {
						this.selected.splice(oi, 1, k)
						return
					}
					if (this.used >= this.max) {
						uni.showToast({ title: '票数已用完（' + this.max + '票）', icon: 'none' })
						return
					}
					this.selected.push(k)
				}
			},
			shortName(name) {
				if (!name) return '?'
				return name.length > 2 ? name.slice(-2) : name
			},
			avatarColor(idx) {
				return AVATAR_COLORS[idx % AVATAR_COLORS.length]
			},
			chipStyle(cid, oid, color) {
				if (this.isSel(cid, oid)) {
					return 'background:' + (color || '#6a5acd') + ';border-color:' + (color || '#6a5acd') + ';color:#fff;'
				}
				return ''
			},
			submit() {
				if (this.used === 0) return
				if (this.requireName && !this.voterName.trim()) {
					uni.showToast({ title: '请先填写你的名字', icon: 'none' })
					return
				}
				const ballots = this.selected.map(k => {
					const p = k.split('_')
					return { candidateId: Number(p[0]), optionId: Number(p[1]) }
				})
				const optionIds = ballots.map(b => b.optionId)
				if (new Set(optionIds).size !== optionIds.length) {
					uni.showToast({ title: '每个项目只能选择 1 位候选人', icon: 'none' })
					return
				}
				this.submitting = true
				submitVote({
					activityId: Number(this.activityId),
					voterName: this.voterName.trim(),
					clientId: getClientId(),
					ballots: ballots
				}).then(res => {
					uni.showToast({ title: res.msg || '投票成功', icon: 'success' })
					setTimeout(() => {
						uni.redirectTo({ url: '/pages/result/result?activityId=' + this.activityId })
					}, 900)
				}).catch(err => {
					uni.showModal({
						title: '提示',
						content: err.message,
						confirmText: '看结果',
						cancelText: '知道了',
						success: (r) => {
							if (r.confirm) {
								uni.redirectTo({ url: '/pages/result/result?activityId=' + this.activityId })
							}
						}
					})
				}).finally(() => {
					this.submitting = false
				})
			}
		}
	}
</script>

<style scoped>
	.page {
		min-height: 100vh;
		padding-bottom: 20rpx;
	}

	.tip {
		text-align: center;
		color: #999;
		padding: 120rpx 0;
	}

	.topbar {
		background: linear-gradient(135deg, #6a5acd 0%, #b06ab3 100%);
		padding: 30rpx 36rpx 40rpx;
		color: #fff;
	}

	.act-title {
		font-size: 34rpx;
		font-weight: 700;
	}

	.quota {
		margin-top: 22rpx;
	}

	.quota-text {
		font-size: 26rpx;
		opacity: 0.95;
	}

	.used {
		font-size: 36rpx;
		font-weight: 700;
	}

	.quota-track {
		height: 14rpx;
		background: rgba(255, 255, 255, 0.3);
		border-radius: 100rpx;
		margin-top: 12rpx;
		overflow: hidden;
	}

	.quota-fill {
		height: 100%;
		background: #fff;
		border-radius: 100rpx;
		transition: width 0.25s;
	}

	.name-box {
		background: #fff;
		margin: 24rpx 24rpx 0;
		border-radius: 18rpx;
		padding: 24rpx 28rpx;
		display: flex;
		align-items: center;
	}

	.name-label {
		font-size: 28rpx;
		font-weight: 600;
		color: #444;
		margin-right: 20rpx;
	}

	.name-input {
		flex: 1;
		font-size: 28rpx;
	}

	.legend {
		padding: 22rpx 30rpx 6rpx;
	}

	.legend-tip {
		font-size: 24rpx;
		color: #9a97ad;
	}

	.clist {
		padding: 10rpx 24rpx;
	}

	.ccard {
		background: #fff;
		border-radius: 22rpx;
		padding: 26rpx;
		margin-bottom: 22rpx;
		box-shadow: 0 6rpx 20rpx rgba(106, 90, 205, 0.07);
	}

	.ccard-head {
		display: flex;
		align-items: center;
	}

	.avatar {
		width: 92rpx;
		height: 92rpx;
		border-radius: 50%;
		color: #fff;
		font-size: 30rpx;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		flex-shrink: 0;
	}

	.avatar-img {
		width: 100%;
		height: 100%;
	}

	.cinfo {
		flex: 1;
		margin-left: 22rpx;
	}

	.cname {
		font-size: 32rpx;
		font-weight: 700;
		color: #2c2c3a;
	}

	.cno {
		display: inline-block;
		font-size: 22rpx;
		color: #6a5acd;
		background: #efe9fb;
		border-radius: 8rpx;
		padding: 2rpx 12rpx;
		margin-right: 12rpx;
		font-weight: 600;
	}

	.cdesc {
		font-size: 24rpx;
		color: #9a97ad;
		margin-top: 8rpx;
	}

	.cbadge {
		background: linear-gradient(135deg, #6a5acd, #b06ab3);
		color: #fff;
		font-size: 24rpx;
		font-weight: 700;
		padding: 6rpx 18rpx;
		border-radius: 100rpx;
		flex-shrink: 0;
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		margin-top: 20rpx;
	}

	.chip {
		display: flex;
		align-items: center;
		font-size: 26rpx;
		color: #555;
		background: #f4f2fb;
		border: 2rpx solid #e8e4f6;
		border-radius: 100rpx;
		padding: 12rpx 24rpx;
		margin: 0 16rpx 16rpx 0;
		transition: all 0.15s;
	}

	.chip-icon {
		margin-right: 8rpx;
		font-size: 28rpx;
	}

	.chip.active {
		font-weight: 700;
		box-shadow: 0 4rpx 12rpx rgba(106, 90, 205, 0.25);
	}

	.bottom-pad {
		height: 140rpx;
	}

	.submit-bar {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		background: #fff;
		box-shadow: 0 -6rpx 24rpx rgba(0, 0, 0, 0.06);
		display: flex;
		align-items: center;
		padding: 18rpx 30rpx;
		padding-bottom: calc(18rpx + constant(safe-area-inset-bottom));
		padding-bottom: calc(18rpx + env(safe-area-inset-bottom));
	}

	.sb-left {
		flex: 1;
	}

	.sb-num {
		font-size: 44rpx;
		font-weight: 800;
		color: #6a5acd;
	}

	.sb-unit {
		font-size: 26rpx;
		color: #999;
		margin-left: 6rpx;
	}

	.sb-btn {
		width: 320rpx;
		height: 88rpx;
		line-height: 88rpx;
		border-radius: 100rpx;
		background: linear-gradient(135deg, #6a5acd, #b06ab3);
		color: #fff;
		font-size: 30rpx;
		font-weight: 700;
		border: none;
	}

	.sb-btn::after {
		border: none;
	}

	.sb-btn[disabled] {
		opacity: 0.5;
	}
</style>
