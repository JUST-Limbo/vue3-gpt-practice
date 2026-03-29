/* eslint-env node */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const serverDir = path.dirname(fileURLToPath(import.meta.url))
const historyFilePath = path.join(serverDir, 'chat-history.json')

function ensureStoreFile() {
    if (!fs.existsSync(historyFilePath)) {
        fs.writeFileSync(historyFilePath, '[]', 'utf-8')
    }
}

export function readHistory() {
    ensureStoreFile()
    try {
        const content = fs.readFileSync(historyFilePath, 'utf-8')
        const data = JSON.parse(content)
        if (Array.isArray(data)) return data
        return []
    } catch (error) {
        return []
    }
}

export function writeHistory(history) {
    ensureStoreFile()
    fs.writeFileSync(historyFilePath, JSON.stringify(history, null, 2), 'utf-8')
}

export function ensureChat(history, uid) {
    for (let i = 0; i < history.length; i += 1) {
        if (history[i].uid === uid) return history[i]
    }
    const chat = {
        uid,
        chatRecords: []
    }
    history.push(chat)
    return chat
}

export function removeChatByUid(uid) {
    const history = readHistory()
    const next = history.filter((item) => item.uid !== uid)
    writeHistory(next)
    return next
}
