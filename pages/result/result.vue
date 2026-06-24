<template>
	<view class="page">
		<view v-if="loading" class="tip">加载中…</view>

		<block v-else>
			<!-- 头部 -->
			<view class="hero">
				<view class="hero-title">{{ data.activity.title }}</view>
				<view class="stats">
					<view class="stat">
						<text class="stat-num">{{ summary.voterCount }}</text>
						<text class="stat-label">参与人数</text>
					</view>
					<view class="stat">
						<text class="stat-num">{{ summary.totalBallots }}</text>
						<text class="stat-label">总票数</text>
					</view>
					<view class="stat">
						<text class="stat-num">{{ summary.candidateCount }}</text>
						<text class="stat-label">候选人</text>
					</view>
				</view>
			</view>

			<!-- 各维度冠军 -->
			<view class="block">
				<view class="block-title">🏆 各维度冠军</view>
				<view class="champ-grid">
					<view class="champ" v-for="o in data.options" :key="o.optionId" :style="{ borderColor: o.color }">
						<view class="champ-dim">{{ o.icon }} {{ o.name }}</view>
						<block v-if="o.winner">
							<view class="champ-avatar" :style="{ background: o.color }">{{ shortName(o.winner.name) }}</view>
							<view class="champ-name">{{ o.winner.name }}</view>
							<view class="champ-votes" :style="{ color: o.color }">{{ o.winner.votes }} 票</view>
						</block>
						<view v-else class="champ-empty">暂无</view>
					</view>
				</view>
			</view>

			<!-- 排行榜 -->
			<view class="block">
				<view class="block-title">📊 排行榜</view>
				<scroll-view class="tabs" scroll-x>
					<view class="tab" :class="{ on: curTab === 'all' }" @click="curTab = 'all'">总人气榜</view>
					<view class="tab" :class="{ on: curTab === o.optionId }" v-for="o in data.options" :key="o.optionId" @click="curTab = o.optionId">
						{{ o.icon }} {{ o.name }}
					</view>
				</scroll-view>

				<view class="rank-list">
					<view class="rank-empty" v-if="curList.length === 0 || maxVotes === 0">暂无投票数据</view>
					<view class="rank-item" v-else v-for="(item, i) in curList" :key="item.candidateId">
						<view class="rank-no" :class="'medal-' + (i + 1)">{{ medal(i) }}</view>
						<view class="rank-main">
							<view class="rank-row">
								<text class="rank-name">{{ item.name }}</text>
								<text class="rank-votes">{{ item.votes }} 票</text>
							</view>
							<view class="rank-track">
								<view class="rank-fill" :style="{ width: barWidth(item.votes), background: barColor }"></view>
							</view>
						</view>
					</view>
				</view>
			</view>

			<view style="height: 40rpx"></view>
			<button class="vote-again" @click="goVote">我也要投票 →</button>
			<view style="height: 50rpx"></view>
		</block>
	</view>
</template>

<script>
	import { getResult } from '@/common/api.js'

	export default {
		data() {
			return {
				activityId: null,
				loading: true,
				data: { activity: {}, summary: {}, options: [], overall: [] },
				curTab: 'all'
			}
		},
		computed: {
			summary() {
				return this.data.summary || {}
			},
			curList() {
				if (this.curTab === 'all') return this.data.overall || []
				const o = (this.data.options || []).find(x => x.optionId === this.curTab)
				return (o && o.ranking) || []
			},
			maxVotes() {
				let m = 0
				this.curList.forEach(x => { if (x.votes > m) m = x.votes })
				return m
			},
			barColor() {
				if (this.curTab === 'all') return 'linear-gradient(90deg,#6a5acd,#b06ab3)'
				const o = (this.data.options || []).find(x => x.optionId === this.curTab)
				return (o && o.color) || '#6a5acd'
			}
		},
		onLoad(opt) {
			this.activityId = opt.activityId
			this.load()
		},
		onPullDownRefresh() {
			this.load(true)
		},
		methods: {
			load(fromPull) {
				this.loading = true
				getResult(this.activityId).then(res => {
					this.data = res.data
				}).catch(err => {
					uni.showToast({ title: err.message, icon: 'none' })
				}).finally(() => {
					this.loading = false
					if (fromPull) uni.stopPullDownRefresh()
				})
			},
			shortName(name) {
				if (!name) return '?'
				return name.length > 2 ? name.slice(-2) : name
			},
			medal(i) {
				return ['🥇', '🥈', '🥉'][i] || (i + 1)
			},
			barWidth(v) {
				if (!this.maxVotes) return '0%'
				return Math.max(6, v / this.maxVotes * 100) + '%'
			},
			goVote() {
				uni.redirectTo({ url: '/pages/vote/vote?activityId=' + this.activityId })
			}
		}
	}
</script>

<style scoped>
	.page {
		min-height: 100vh;
	}

	.tip {
		text-align: center;
		color: #999;
		padding: 120rpx 0;
	}

	.hero {
		background: linear-gradient(135deg, #6a5acd 0%, #b06ab3 100%);
		padding: 36rpx 36rpx 44rpx;
		color: #fff;
		border-bottom-left-radius: 32rpx;
		border-bottom-right-radius: 32rpx;
	}

	.hero-title {
		font-size: 34rpx;
		font-weight: 700;
		text-align: center;
	}

	.stats {
		display: flex;
		margin-top: 28rpx;
	}

	.stat {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.stat-num {
		font-size: 44rpx;
		font-weight: 800;
	}

	.stat-label {
		font-size: 24rpx;
		opacity: 0.9;
		margin-top: 6rpx;
	}

	.block {
		margin: 28rpx 24rpx 0;
		background: #fff;
		border-radius: 22rpx;
		padding: 28rpx;
		box-shadow: 0 6rpx 20rpx rgba(106, 90, 205, 0.07);
	}

	.block-title {
		font-size: 30rpx;
		font-weight: 700;
		margin-bottom: 22rpx;
	}

	.champ-grid {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
	}

	.champ {
		width: 31%;
		box-sizing: border-box;
		border: 3rpx solid #6a5acd;
		border-radius: 18rpx;
		padding: 18rpx 8rpx;
		text-align: center;
		margin-bottom: 18rpx;
	}

	.champ-dim {
		font-size: 24rpx;
		font-weight: 600;
		color: #444;
	}

	.champ-avatar {
		width: 72rpx;
		height: 72rpx;
		border-radius: 50%;
		color: #fff;
		font-weight: 700;
		font-size: 26rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 14rpx auto 8rpx;
	}

	.champ-name {
		font-size: 26rpx;
		font-weight: 700;
	}

	.champ-votes {
		font-size: 24rpx;
		font-weight: 700;
		margin-top: 4rpx;
	}

	.champ-empty {
		color: #bbb;
		font-size: 24rpx;
		padding: 30rpx 0;
	}

	.tabs {
		white-space: nowrap;
		margin-bottom: 20rpx;
	}

	.tab {
		display: inline-block;
		font-size: 26rpx;
		color: #666;
		background: #f3f1fb;
		border-radius: 100rpx;
		padding: 12rpx 28rpx;
		margin-right: 16rpx;
	}

	.tab.on {
		background: linear-gradient(135deg, #6a5acd, #b06ab3);
		color: #fff;
		font-weight: 700;
	}

	.rank-empty {
		text-align: center;
		color: #bbb;
		padding: 40rpx 0;
		font-size: 26rpx;
	}

	.rank-item {
		display: flex;
		align-items: center;
		padding: 18rpx 0;
		border-bottom: 1rpx solid #f2f0f8;
	}

	.rank-item:last-child {
		border-bottom: none;
	}

	.rank-no {
		width: 60rpx;
		text-align: center;
		font-size: 30rpx;
		font-weight: 700;
		color: #999;
		flex-shrink: 0;
	}

	.medal-1, .medal-2, .medal-3 {
		font-size: 36rpx;
	}

	.rank-main {
		flex: 1;
		margin-left: 12rpx;
	}

	.rank-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.rank-name {
		font-size: 28rpx;
		font-weight: 600;
		color: #2c2c3a;
	}

	.rank-votes {
		font-size: 26rpx;
		color: #6a5acd;
		font-weight: 700;
	}

	.rank-track {
		height: 14rpx;
		background: #f0eef8;
		border-radius: 100rpx;
		margin-top: 10rpx;
		overflow: hidden;
	}

	.rank-fill {
		height: 100%;
		border-radius: 100rpx;
		transition: width 0.3s;
	}

	.vote-again {
		margin: 0 24rpx;
		height: 88rpx;
		line-height: 88rpx;
		border-radius: 100rpx;
		background: linear-gradient(135deg, #6a5acd, #b06ab3);
		color: #fff;
		font-size: 30rpx;
		font-weight: 700;
		border: none;
	}

	.vote-again::after {
		border: none;
	}
</style>
