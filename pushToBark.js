// pushToBark.js
import axios from 'axios'

const BARK_ENDPOINT = process.env.BARK_ENDPOINT
const BARK_KEY = process.env.BARK_KEY

if (!BARK_ENDPOINT || !BARK_KEY) {
  console.error('❌ 环境变量 BARK_ENDPOINT 或 BARK_KEY 未设置')
  process.exit(1)
}

/**
 * 发送推送到 Bark 服务
 * @param {Object} payload - 要发送的 JSON 数据（包含 title, body 等）
 * @returns {Promise<Object>} Bark 返回的数据
 */
export async function pushToBark(payload) {
  try {
    const res = await axios.post(`${BARK_ENDPOINT}/${BARK_KEY}`, payload, {
      timeout: 5000
    })
    return res.data
  } catch (err) {
    const detail = err.response?.data || err.message
    throw new Error(
      typeof detail === 'string' ? detail : JSON.stringify(detail)
    )
  }
}
