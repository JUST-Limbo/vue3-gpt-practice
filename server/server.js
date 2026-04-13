/* eslint-env node */
import Koa from 'koa'
import cors from '@koa/cors'
import bodyParser from 'koa-bodyparser'
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createApiRouter } from './apiRoutes.js'
import { createWsServer } from './wsServer.js'

const serverDir = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(serverDir, '..')
const nodeEnv = process.env.NODE_ENV === 'production' ? 'production' : 'development'
const envFileName = `.env.${nodeEnv}`

const envLocalFileName = `.env.${nodeEnv}.local`

dotenv.config({ path: path.join(rootDir, '.env') })
dotenv.config({ path: path.join(rootDir, envFileName), override: true })
dotenv.config({ path: path.join(rootDir, envLocalFileName), override: true })
dotenv.config({ path: path.join(serverDir, '.env') })
dotenv.config({ path: path.join(serverDir, envFileName), override: true })
dotenv.config({ path: path.join(serverDir, envLocalFileName), override: true })

const app = new Koa()
app.use(cors())
app.use(
    bodyParser({
        enableTypes: ['json'],
        jsonLimit: '10mb',
        onerror(_err, ctx) {
            ctx.throw(400, '请求体不是合法 JSON')
        }
    })
)
const router = createApiRouter()
app.use(router.routes()).use(router.allowedMethods())

app.listen(3000, () => {
    console.log('Server is running on port 3000')
})
createWsServer(8080)
