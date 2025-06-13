import Koa from 'koa'
import Router from 'koa-router'
import bodyParser from 'koa-bodyparser'
import yaml from 'js-yaml'
import fs from 'fs'
import { pushToBark } from './pushToBark.js'

const app = new Koa()
const router = new Router()

// 加载配置
let validKeys = {}
try {
  const config = yaml.load(fs.readFileSync('./config.yaml', 'utf8'))
  if (typeof config === 'object' && config && 'keys' in config) {
    validKeys = config.keys
  }
} catch (e) {
  console.error('❌ 加载 config.yaml 失败:', e)
  process.exit(1)
}

// 工具函数：安全解码 URI
function safeDecode(val, fallback = '') {
  if (!val) return fallback
  try {
    return decodeURIComponent(val)
  } catch {
    return fallback
  }
}

// 通用 GET 请求处理器
async function handleGetFormat(ctx, { title = '', subtitle = '' }) {
  const { key, title: pTitle, subtitle: pSubtitle, body: pBody } = ctx.params

  if (!validKeys[key]) {
    ctx.status = 403
    ctx.body = { error: 'Invalid key' }
    return
  }

  const payload = {
    title: safeDecode(pTitle, title),
    subtitle: safeDecode(pSubtitle, subtitle),
    body: safeDecode(pBody),
    ...ctx.query
  }

  try {
    ctx.body = await pushToBark(payload)
  } catch (err) {
    ctx.status = 502
    ctx.body = { error: 'Failed to push', detail: err.message }
  }
}

// 路由定义
router.get('/:key/:body', ctx =>
  handleGetFormat(ctx, { title: '', subtitle: '' })
)
router.get('/:key/:title/:body', ctx => {
  ctx.params.subtitle = ''
  return handleGetFormat(ctx, {})
})
router.get('/:key/:title/:subtitle/:body', ctx => handleGetFormat(ctx, {}))

router.post('/:key', async ctx => {
  const key = ctx.params.key
  const body = ctx.request.body

  if (!validKeys[key]) {
    ctx.status = 403
    ctx.body = { error: 'Invalid key' }
    return
  }

  if (!body?.body) {
    ctx.status = 400
    ctx.body = { error: 'Missing "body" field' }
    return
  }

  try {
    ctx.body = await pushToBark(body)
  } catch (err) {
    ctx.status = 502
    ctx.body = { error: 'Failed to push', detail: err.message }
  }
})

app.use(bodyParser())
app.use(router.routes()).use(router.allowedMethods())

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`🚀 Bark proxy running at http://localhost:${port}`)
})
