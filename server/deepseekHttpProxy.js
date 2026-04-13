/* eslint-env node */
import { Readable } from 'node:stream'
import { shouldUseBsgWeatherMock, createBsgWeatherMockSseStream } from './mockBsgWeatherSse.js'

/**
 * POST /api/deepseek/chat/completions
 * 请求体与 DeepSeek OpenAI 兼容接口一致：{ model?, messages: [{role, content}], stream? }
 * 密钥仅服务端读取 DEEPSEEK_API_KEY；stream 为 true 时原样转发 SSE。
 * @param {import('koa').Context} ctx
 * @param {import('koa').Next} next
 * @example
 * {
 *   "model": "deepseek-chat",
 *   "messages": [{"role": "user", "content": "Hello, world!"}],
 *   "stream": true
 * }
 */
export async function handleDeepseekChatCompletions(ctx, next) {
    const payload = ctx.request.body
    if (payload === undefined || payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
        ctx.status = 400
        ctx.set('Content-Type', 'application/json; charset=utf-8')
        ctx.body = JSON.stringify({ error: { message: '请求体须为 JSON 对象' } })
        await next()
        return
    }

    const messages = payload.messages
    if (!Array.isArray(messages) || messages.length === 0) {
        ctx.status = 400
        ctx.set('Content-Type', 'application/json; charset=utf-8')
        ctx.body = JSON.stringify({ error: { message: 'messages 必须为非空数组' } })
        await next()
        return
    }

    const model =
        typeof payload.model === 'string' && payload.model
            ? payload.model
            : process.env.DEEPSEEK_MODEL || 'deepseek-chat'
    const stream = payload.stream === true

    if (stream && shouldUseBsgWeatherMock(messages)) {
        ctx.status = 200
        ctx.set('Content-Type', 'text/event-stream; charset=utf-8')
        ctx.set('Cache-Control', 'no-cache')
        ctx.set('Connection', 'keep-alive')
        ctx.set('X-Accel-Buffering', 'no')
        ctx.body = createBsgWeatherMockSseStream()
        await next()
        return
    }

    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
        ctx.status = 500
        ctx.set('Content-Type', 'application/json; charset=utf-8')
        ctx.body = JSON.stringify({ error: { message: 'DEEPSEEK_API_KEY 未配置' } })
        await next()
        return
    }

    let upstream
    try {
        upstream = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model,
                messages,
                stream
            })
        })
    } catch (e) {
        const err = e
        const msg = err instanceof Error ? err.message : '上游请求失败'
        ctx.status = 502
        ctx.set('Content-Type', 'application/json; charset=utf-8')
        ctx.body = JSON.stringify({ error: { message: msg } })
        await next()
        return
    }

    if (!upstream.ok) {
        const errorText = await upstream.text()
        ctx.status = upstream.status
        ctx.set('Content-Type', 'application/json; charset=utf-8')
        ctx.body = errorText
        await next()
        return
    }

    if (stream) {
        const webBody = upstream.body
        if (!webBody) {
            ctx.status = 502
            ctx.set('Content-Type', 'application/json; charset=utf-8')
            ctx.body = JSON.stringify({ error: { message: '上游未返回流式响应体' } })
            await next()
            return
        }
        ctx.status = 200
        ctx.set('Content-Type', 'text/event-stream; charset=utf-8')
        ctx.set('Cache-Control', 'no-cache')
        ctx.set('Connection', 'keep-alive')
        ctx.set('X-Accel-Buffering', 'no')
        ctx.body = Readable.fromWeb(webBody)
        await next()
        return
    }

    const json = await upstream.json()
    ctx.status = 200
    ctx.set('Content-Type', 'application/json; charset=utf-8')
    ctx.body = json
    await next()
}
