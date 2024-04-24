<script setup lang="ts">
import type { Ref } from 'vue'
import type { gptMockNamespace } from '@/api/interface/gptmock'
import { getCurrentTimestamp, generateRandomSixDigitNumberExclusive } from "@/utils"
import { useScrollToBottom } from '@/hooks/useScrollToBottom'
const { scrollToBottom } = useScrollToBottom('.chat-window-body')

import ResizeTextarea from './ResizeTextarea.vue'

import { useGptStore } from '@/stores/gptStore'
const { unLockScroll } = useGptStore()
const { curChat, chatEngines, curChatEngine, chatWindowScollLock } = storeToRefs(useGptStore())

const textAreaInput = ref('')

class Pipe {
    static str = ''
    static timer = 0
    static target: Nullable<Ref<gptMockNamespace.chatRecord>> = null
    static reset () {
        Pipe.str = ''
        clearInterval(Pipe.timer)
        unLockScroll()
        Pipe.target = null
    }
    static start (data: Ref<gptMockNamespace.chatRecord>) {
        Pipe.target = data
        function recursiveTimeoutFunction () {
            Pipe.timer = setTimeout(() => {
                Pipe.consume(Pipe.getFirstStr())
                Pipe.pop()
                recursiveTimeoutFunction()
            }, 50);
        }
        recursiveTimeoutFunction()
    }
    static write (chunk: string) {
        Pipe.str += chunk
    }
    static getFirstStr () {
        return Pipe.str[0]
    }
    static pop () {
        Pipe.str = Pipe.str.substring(1)
    }
    static consume (message: string = '') {
        const ans = Pipe.target!
        ans.value.message += message
        !chatWindowScollLock.value && scrollToBottom()
    }
    static consumeAll () {
        Pipe.consume(Pipe.str)
        Pipe.str = ''
        delete Pipe.target!.value.chatting
        clearInterval(Pipe.timer)
    }
}

class WebSocketClient {
    socket!: WebSocket;
    static mockAnswer () {
        return {
            id: generateRandomSixDigitNumberExclusive(),
            uid: curChat.value!.uid,
            type: "answer",
            message: '',
            chatEngine: curChatEngine.value,
            createTime: getCurrentTimestamp(),
            pid: "",
            chatting: true
        }
    }
    static mockQuestion (message: string) {
        return {
            id: generateRandomSixDigitNumberExclusive(),
            uid: curChat.value!.uid,
            createTime: getCurrentTimestamp(),
            type: "question",
            message,
            chatEngine: curChatEngine.value,
            pid: "",
        }
    }
    constructor() {
        this.connect()
    }
    connect () {
        this.socket = new WebSocket(import.meta.env.VITE_WS);
        this.socket.binaryType = "arraybuffer"

        this.socket.onopen = () => {
            console.log('WebSocket connecting');
            ElNotification({
                title: 'Title',
                message: "WebSocket connecting",
            })
        };

        this.socket.onmessage = (event) => {
            console.log(event);
            const data = JSON.parse(event.data)
            const { type, content } = data
            if (type == 'answer') {
                Pipe.write(content)
            } else if (type == 'DONE') {
                Pipe.consumeAll()
            }
        };

        this.socket.onerror = (event) => {
            console.error('WebSocketerror:', event);
        };

        this.socket.onclose = () => {
            console.log('Connect closed')
            ElNotification({
                title: 'Title',
                message: "WebSocket has been closed",
            })
            this.connect()
        };
    }
    sendMessage (message: string) {
        if (!message) return
        if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
                uid: curChat.value!.uid,
                type: "question",
                question: message,
                aiEngine: curChatEngine.value,
            }));
            const mockAns = ref(WebSocketClient.mockAnswer())
            curChat.value!.chatRecords!.push(
                WebSocketClient.mockQuestion(message),
                mockAns.value
            )
            textAreaInput.value = ""
            Pipe.reset()
            Pipe.start(mockAns)
        } else {
            ElNotification({
                title: 'Title',
                message: "请检查WebSocket连接后再试",
            })
        }
    }
}

const webSocketClientInstance = ref(new WebSocketClient());
</script>

<template>
    <div class="chat-input-panel">
        <el-radio-group v-model="curChatEngine">
            <el-radio v-for="(chatEngine, index) in chatEngines" :key="index" :value="chatEngine.value">
                {{ chatEngine.name }}
            </el-radio>
        </el-radio-group>
        <ResizeTextarea v-model="textAreaInput" @send="webSocketClientInstance.sendMessage(textAreaInput)" />
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
