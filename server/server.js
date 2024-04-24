import Koa from 'koa'
import Router from 'koa-router'
import cors from '@koa/cors'
import { WebSocketServer } from 'ws'

import { processStringWithDelay } from './utils.js'

import historyRes from './mock.js'
import MockData from './mock2.js'

const app = new Koa()
app.use(cors())

const router = new Router()
router.get('/', async (ctx, next) => {
  ctx.body = 'Hello, Koa!'
  next()
})

router.get('/getChatHistroy', async (ctx, next) => {
  ctx.body = historyRes
  next()
})

app.use(router.routes()).use(router.allowedMethods())

app.listen(3000, () => {
  console.log('Server is running on port 3000')
})

const wss = new WebSocketServer({ port: 8080 })
wss.on('connection', function connection(ws) {
  ws.on('message', function incoming() {
    processStringWithDelay(
      MockData[parseInt(Math.random() * 4)],
      100,
      (subStr) => {
        ws.send(JSON.stringify({ type: 'answer', content: subStr }))
      },
      () => {
        ws.send(JSON.stringify({ type: 'DONE' }))
      }
    )
  })
})
