/* eslint-env node */
import { WebSocketServer } from 'ws'
import { streamDeepSeekAnswer } from './deepseek.js'
import { readHistory, writeHistory, ensureChat } from './historyStore.js'

/**
 * chatRecords 末尾为本次「问题 + 空答案」；此前为已完成轮次。
 * 转成 DeepSeek / OpenAI 所需的 messages（user / assistant 交替）。
 */
function buildDeepSeekMessages(chatRecords) {
    const messages = []
    if (!chatRecords || chatRecords.length < 2) {
        return messages
    }
    const prior = chatRecords.slice(0, chatRecords.length - 2)
    for (let i = 0; i < prior.length; i += 2) {
        const qRec = prior[i]
        const aRec = prior[i + 1]
        if (!qRec || qRec.type !== 'question') {
            continue
        }
        const answerText = aRec && aRec.type === 'answer' ? aRec.message : ''
        if (!answerText) {
            continue
        }
        messages.push({ role: 'user', content: qRec.message })
        messages.push({ role: 'assistant', content: answerText })
    }
    const currentQuestion = chatRecords[chatRecords.length - 2]
    if (currentQuestion && currentQuestion.type === 'question') {
        messages.push({ role: 'user', content: currentQuestion.message })
    }
    return messages
}

function generateId() {
    return Math.floor(Math.random() * 900000) + 100000
}

function formatTime() {
    const date = new Date()
    const YYYY = date.getFullYear()
    const MM = `${date.getMonth() + 1}`.padStart(2, '0')
    const DD = `${date.getDate()}`.padStart(2, '0')
    const HH = `${date.getHours()}`.padStart(2, '0')
    const mm = `${date.getMinutes()}`.padStart(2, '0')
    const ss = `${date.getSeconds()}`.padStart(2, '0')
    return `${YYYY}-${MM}-${DD} ${HH}:${mm}:${ss}.000`
}

export function createWsServer(port = 8080) {
    const wss = new WebSocketServer({ port })

    wss.on('connection', function connection(ws) {
        ws.on('message', async function incoming(raw) {
            try {
                const message = JSON.parse(raw.toString())
                const question = message.question
                const uid = message.uid
                if (!question) {
                    ws.send(JSON.stringify({ type: 'error', content: '问题不能为空' }))
                    ws.send(JSON.stringify({ type: 'DONE' }))
                    return
                }
                if (!uid) {
                    ws.send(JSON.stringify({ type: 'error', content: '会话 uid 不能为空' }))
                    ws.send(JSON.stringify({ type: 'DONE' }))
                    return
                }

                const history = readHistory()
                const chat = ensureChat(history, uid)
                const questionId = generateId()
                const questionRecord = {
                    id: questionId,
                    uid,
                    type: 'question',
                    message: question,
                    chatEngine: 'deepseek-chat',
                    createTime: formatTime(),
                    pid: null
                }
                const answerRecord = {
                    id: generateId(),
                    uid,
                    type: 'answer',
                    message: '',
                    chatEngine: 'deepseek-chat',
                    createTime: formatTime(),
                    pid: questionId
                }
                chat.chatRecords.push(questionRecord)
                chat.chatRecords.push(answerRecord)
                writeHistory(history)

                const deepseekMessages = buildDeepSeekMessages(chat.chatRecords)
                if (deepseekMessages.length === 0) {
                    ws.send(JSON.stringify({ type: 'error', content: '无法构建对话消息' }))
                    ws.send(JSON.stringify({ type: 'DONE' }))
                    return
                }

                await streamDeepSeekAnswer(
                    deepseekMessages,
                    (subStr) => {
                        answerRecord.message += subStr
                        writeHistory(history)
                        ws.send(JSON.stringify({ type: 'answer', content: subStr }))
                    },
                    () => {
                        writeHistory(history)
                        ws.send(JSON.stringify({ type: 'DONE' }))
                    },
                    (errorMessage) => {
                        answerRecord.message += `\n[Error] ${errorMessage}`
                        writeHistory(history)
                        ws.send(JSON.stringify({ type: 'error', content: errorMessage }))
                        ws.send(JSON.stringify({ type: 'DONE' }))
                    }
                )
            } catch (error) {
                console.error('error:', error)
                const err = error
                let errorMessage = '请求解析失败'
                if (err instanceof Error) {
                    errorMessage = err.message
                }
                ws.send(JSON.stringify({ type: 'error', content: errorMessage }))
                ws.send(JSON.stringify({ type: 'DONE' }))
            }
        })
    })

    return wss
}
