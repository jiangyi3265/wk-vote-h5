import { BASE_URL } from './config.js'

// 统一请求封装：解析 RuoYi 标准返回 {code,msg,data,rows,total}
function request(url, method, data) {
  return new Promise((resolve, reject) => {
    uni.request({
      url: BASE_URL + url,
      method: method || 'GET',
      data: data || {},
      header: { 'Content-Type': 'application/json' },
      timeout: 15000,
      success: (res) => {
        const body = res.data || {}
        if (body.code === 200) {
          resolve(body)
        } else {
          reject(new Error(body.msg || ('请求失败(' + res.statusCode + ')')))
        }
      },
      fail: (err) => {
        reject(new Error('网络异常，请检查后端服务是否已启动'))
      }
    })
  })
}

// 客户端唯一标识（防重复投票）
export function getClientId() {
  let cid = uni.getStorageSync('vote_client_id')
  if (!cid) {
    cid = 'c_' + Date.now() + '_' + Math.floor(Math.random() * 1e6)
    uni.setStorageSync('vote_client_id', cid)
  }
  return cid
}

// 活动列表
export function listActivities() {
  return request('/vote/public/activities', 'GET')
}

// 活动详情（候选人 + 维度）
export function getActivityDetail(activityId) {
  return request('/vote/public/activity/' + activityId, 'GET')
}

// 提交投票
export function submitVote(payload) {
  return request('/vote/public/submit', 'POST', payload)
}

// 结果统计
export function getResult(activityId) {
  return request('/vote/public/result/' + activityId, 'GET')
}
