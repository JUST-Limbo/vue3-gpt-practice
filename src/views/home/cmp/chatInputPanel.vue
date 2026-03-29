<script setup lang="ts">
import type { Ref } from 'vue'
import type { gptMockNamespace } from '@/api/interface/gptmock'
import { getCurrentTimestamp, generateRandomSixDigitNumberExclusive } from '@/utils'
import { uuid } from '@/utils/index'
import { useScrollToBottom } from '@/hooks/useScrollToBottom'
const { scrollToBottom } = useScrollToBottom('.chat-window-body')

import ResizeTextarea from './ResizeTextarea.vue'
import { useHomeState } from '../context'
const { unLockScroll, curChat, chatHistory, chatWindowScollLock } = useHomeState()

const textAreaInput = ref('')

let streamAnswerRef: Nullable<Ref<gptMockNamespace.chatRecord>> = null

function resetStreamAnswer() {
    unLockScroll()
    streamAnswerRef = null
}

function appendStreamChunk(raw: unknown) {
    const chunk = typeof raw === 'string' ? raw : ''
    const ans = streamAnswerRef
    if (!ans) return
    ans.value.message += chunk
    if (!chatWindowScollLock.value) {
        scrollToBottom()
    }
}

function finishStreamAnswer() {
    unLockScroll()
    streamAnswerRef = null
}

class WebSocketClient {
    socket: Nullable<WebSocket> = null
    reconnectTimes = 0
    maxReconnectTimes = 3
    static createPendingAnswerRecord() {
        const currentChat = curChat.value
        if (!currentChat) return null
        return {
            id: generateRandomSixDigitNumberExclusive(),
            uid: currentChat.uid,
            type: 'answer',
            message: '',
            chatEngine: 'deepseek-chat',
            createTime: getCurrentTimestamp(),
            pid: ''
        }
    }
    static createQuestionRecord(text: string) {
        const currentChat = curChat.value
        if (!currentChat) return null
        return {
            id: generateRandomSixDigitNumberExclusive(),
            uid: currentChat.uid,
            createTime: getCurrentTimestamp(),
            type: 'question',
            message: text,
            chatEngine: 'deepseek-chat',
            pid: ''
        }
    }
    constructor() {
        this.connect()
    }
    connect() {
        this.socket = new WebSocket(import.meta.env.VITE_WS)
        const socket = this.socket
        socket.binaryType = 'arraybuffer'

        socket.onopen = () => {
            console.log('WebSocket connecting')
            this.reconnectTimes = 0
            ElNotification({
                title: 'Title',
                message: 'WebSocket connecting'
            })
        }

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data)
            const { type, content } = data
            if (type == 'answer') {
                appendStreamChunk(content)
            } else if (type == 'error') {
                const errText = typeof content === 'string' ? content : ''
                ElNotification({
                    title: 'DeepSeek Error',
                    message: errText
                })
            } else if (type == 'DONE') {
                finishStreamAnswer()
            }
        }

        socket.onerror = (event) => {
            console.error('WebSocketerror:', event)
        }

        socket.onclose = () => {
            console.log('Connect closed')
            if (this.reconnectTimes < this.maxReconnectTimes) {
                this.reconnectTimes += 1
                ElNotification({
                    title: 'Title',
                    message: `WebSocket has been closed, reconnecting ${this.reconnectTimes}/${this.maxReconnectTimes}`
                })
                setTimeout(() => {
                    this.connect()
                }, 1000)
            } else {
                ElNotification({
                    title: 'Title',
                    message: 'WebSocket reconnect limit reached'
                })
            }
        }
    }
    sendMessage(message: string) {
        if (!message) return
        if (!curChat.value) {
            const uid = uuid()
            chatHistory.value.push({
                uid,
                chatRecords: []
            })
            curChat.value = chatHistory.value[chatHistory.value.length - 1]
            scrollToBottom()
        }
        const currentChat = curChat.value
        if (!currentChat) return
        const socket = this.socket
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(
                JSON.stringify({
                    uid: currentChat.uid,
                    type: 'question',
                    question: message
                })
            )
            const questionRecord = WebSocketClient.createQuestionRecord(message)
            const answerRecord = WebSocketClient.createPendingAnswerRecord()
            if (answerRecord && questionRecord) {
                const answerRef = ref(answerRecord)
                currentChat.chatRecords.push(questionRecord, answerRef.value)
                resetStreamAnswer()
                streamAnswerRef = answerRef
            }
            textAreaInput.value = ''
        } else {
            ElNotification({
                title: 'Title',
                message: '请检查WebSocket连接后再试'
            })
        }
    }
}

const webSocketClientInstance = ref(new WebSocketClient())
</script>

<template>
    <div class="chat-input-panel">
        <ResizeTextarea
            v-model="textAreaInput"
            @send="webSocketClientInstance.sendMessage(textAreaInput)"
        />
    </div>
</template>

<style lang="scss" scoped>
.chat-input-panel {
    position: relative;
    width: 100%;
    padding: 10px 20px 20px;
    box-sizing: border-box;
    border-top: var(--border-in-light);
    box-shadow: var(--card-shadow);
}
</style>
