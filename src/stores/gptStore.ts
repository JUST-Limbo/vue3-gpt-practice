import type { gptMockNamespace } from "@/api/interface/gptmock"

export const useGptStore = defineStore("gptStore", () => {
    const chatHistory = ref<gptMockNamespace.history>([])
    const curChat = ref<Nullable<gptMockNamespace.historyItem>>(null)

    const chatEngines = ref<gptMockNamespace.ChatEngine[]>([
        {
            name: '文心一言',
            value: 'ERNIE-Bot',
            description: '百度文心一言'
        },
        {
            name: 'Open AI 4',
            value: 'OpenAI-3',
            description: 'OpenAI ChatGpt'
        },
        {
            name: 'Open AI 3.5',
            value: 'OpenAI-4',
            description: 'OpenAI ChatGpt'
        }
    ])
    const curChatEngine = ref<string>("ERNIE-Bot")

    const chatWindowScollLock = ref(false)
    function unLockScroll () {
        chatWindowScollLock.value = false
    }
    function lockScroll () {
        chatWindowScollLock.value = true
    }

    return {
        chatHistory,
        curChat,

        chatEngines,
        curChatEngine,

        chatWindowScollLock,
        unLockScroll,
        lockScroll,
    }
})
