<template>
	<view class="page">
		<!-- 顶部横幅 -->
		<view class="hero">
			<view class="hero-emoji">🏆</view>
			<view class="hero-title">校园之星 · 评选投票</view>
			<view class="hero-sub">每人 8 张票，投给 8 位不同候选人</view>
		</view>

		<view class="body">
			<view class="section-title">
				<text class="bar"></text>
				<text>投票活动</text>
			</view>

			<!-- 加载中 -->
			<view v-if="loading" class="tip">加载中…</view>

			<!-- 空状态 -->
			<view v-else-if="activities.length === 0" class="empty">
				<view class="empty-emoji">📭</view>
				<view class="empty-text">暂无可参与的投票活动</view>
				<view class="empty-hint">请联系管理员在后台开启活动</view>
			</view>

			<!-- 活动卡片 -->
			<view v-else>
				<view class="card" v-for="a in activities" :key="a.activityId">
					<view class="card-top">
						<view class="card-title">{{ a.title }}</view>
						<view class="status" :class="'st-' + a.status">{{ statusText(a.status) }}</view>
					</view>
					<view class="card-desc">{{ a.description }}</view>
					<view class="card-meta">
						<view class="meta-item">
							<text class="meta-num">{{ Number(a.votesPerPerson) || 8 }}</text>
							<text class="meta-label">每人票数</text>
						</view>
						<view class="meta-divider"></view>
						<view class="meta-item">
							<text class="meta-num">{{ timeShort(a.endTime) }}</text>
							<text class="meta-label">截止日期</text>
						</view>
					</view>
					<view class="card-btns">
						<button class="btn btn-ghost" @click="goResult(a.activityId)">看结果</button>
						<button class="btn btn-grad" :disabled="a.status !== '1'" @click="goVote(a)">
							{{ a.status === '1' ? '去投票' : '未开放' }}
						</button>
					</view>
				</view>
			</view>

			<view class="footer-tip">提示：每位用户每个活动仅能投一次哦</view>
		</view>
	</view>
</template>

<script>
	import { listActivities } from '@/common/api.js'

	export default {
		data() {
			return {
				loading: true,
				activities: []
			}
		},
		onShow() {
			this.load()
		},
		onPullDownRefresh() {
			this.load(true)
		},
		methods: {
			load(fromPull) {
				this.loading = true
				listActivities().then(res => {
					this.activities = res.data || []
				}).catch(err => {
					uni.showToast({ title: err.message, icon: 'none' })
				}).finally(() => {
					this.loading = false
					if (fromPull) uni.stopPullDownRefresh()
				})
			},
			statusText(s) {
				return s === '1' ? '进行中' : (s === '2' ? '已结束' : '未开始')
			},
			timeShort(t) {
				if (!t) return '不限'
				return String(t).slice(5, 10)
			},
			goVote(a) {
				if (a.status !== '1') return
				uni.navigateTo({ url: '/pages/vote/vote?activityId=' + a.activityId })
			},
			goResult(id) {
				uni.navigateTo({ url: '/pages/result/result?activityId=' + id })
			}
		}
	}
</script>

<style scoped>
	.page {
		min-height: 100vh;
	}

	.hero {
		background: linear-gradient(135deg, #6a5acd 0%, #b06ab3 100%);
		padding: 40rpx 40rpx 80rpx;
		text-align: center;
		color: #fff;
		border-bottom-left-radius: 36rpx;
		border-bottom-right-radius: 36rpx;
	}

	.hero-emoji {
		font-size: 80rpx;
	}

	.hero-title {
		font-size: 44rpx;
		font-weight: 700;
		margin-top: 8rpx;
	}

	.hero-sub {
		font-size: 26rpx;
		opacity: 0.9;
		margin-top: 12rpx;
	}

	.body {
		padding: 34rpx 30rpx 30rpx;
		margin-top: 0;
	}

	.section-title {
		display: flex;
		align-items: center;
		font-size: 32rpx;
		font-weight: 700;
		margin-bottom: 24rpx;
		color: #2c2c3a;
	}

	.bar {
		width: 8rpx;
		height: 30rpx;
		background: #6a5acd;
		border-radius: 4rpx;
		margin-right: 14rpx;
	}

	.tip {
		text-align: center;
		color: #999;
		padding: 60rpx 0;
	}

	.empty {
		text-align: center;
		padding: 100rpx 0;
	}

	.empty-emoji {
		font-size: 90rpx;
	}

	.empty-text {
		font-size: 30rpx;
		color: #666;
		margin-top: 16rpx;
	}

	.empty-hint {
		font-size: 24rpx;
		color: #aaa;
		margin-top: 8rpx;
	}

	.card {
		background: #fff;
		border-radius: 24rpx;
		padding: 30rpx;
		margin-bottom: 26rpx;
		box-shadow: 0 8rpx 30rpx rgba(106, 90, 205, 0.10);
	}

	.card-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.card-title {
		font-size: 32rpx;
		font-weight: 700;
		flex: 1;
		margin-right: 16rpx;
	}

	.status {
		font-size: 22rpx;
		padding: 6rpx 18rpx;
		border-radius: 100rpx;
		color: #fff;
		flex-shrink: 0;
	}

	.st-1 { background: #22c55e; }
	.st-2 { background: #9ca3af; }
	.st-0 { background: #f59e0b; }

	.card-desc {
		font-size: 26rpx;
		color: #777;
		margin-top: 16rpx;
		line-height: 1.6;
	}

	.card-meta {
		display: flex;
		align-items: center;
		background: #f6f4fd;
		border-radius: 16rpx;
		padding: 20rpx;
		margin-top: 24rpx;
	}

	.meta-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.meta-num {
		font-size: 34rpx;
		font-weight: 700;
		color: #6a5acd;
	}

	.meta-label {
		font-size: 22rpx;
		color: #999;
		margin-top: 6rpx;
	}

	.meta-divider {
		width: 1rpx;
		height: 50rpx;
		background: #e5e1f5;
	}

	.card-btns {
		display: flex;
		margin-top: 26rpx;
	}

	.btn {
		flex: 1;
		height: 80rpx;
		line-height: 80rpx;
		border-radius: 100rpx;
		font-size: 28rpx;
		margin: 0 10rpx;
		border: none;
	}

	.btn::after {
		border: none;
	}

	.btn-ghost {
		background: #f0edfb;
		color: #6a5acd;
	}

	.btn-grad {
		background: linear-gradient(135deg, #6a5acd, #b06ab3);
		color: #fff;
	}

	.btn[disabled] {
		opacity: 0.5;
	}

	.footer-tip {
		text-align: center;
		font-size: 22rpx;
		color: #b3b0c4;
		margin-top: 20rpx;
	}
</style>
