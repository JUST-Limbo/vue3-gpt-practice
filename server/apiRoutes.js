/* eslint-env node */
import Router from 'koa-router'
import { readHistory, removeChatByUid } from './historyStore.js'

export function createApiRouter() {
    const router = new Router()

    router.get('/', async (ctx, next) => {
        ctx.body = 'Hello, Koa!'
        next()
    })

    router.get('/getChatHistroy', async (ctx, next) => {
        const history = readHistory()
        ctx.body = {
            code: 200,
            msg: '',
            data: history
        }
        next()
    })

    router.delete('/chat-history/:uid', async (ctx, next) => {
        const uid = ctx.params.uid
        if (!uid) {
            ctx.status = 400
            ctx.body = {
                code: 400,
                msg: 'uid required',
                data: null
            }
            next()
            return
        }
        const history = removeChatByUid(uid)
        ctx.body = {
            code: 200,
            msg: '',
            data: history
        }
        next()
    })

    return router
}
