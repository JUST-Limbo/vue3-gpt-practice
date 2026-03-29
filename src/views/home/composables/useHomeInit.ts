import { getChatHistory } from '@/api/gptmock'
import { useScrollToBottom } from '@/hooks/useScrollToBottom'
import type { HomeState } from '../context'

export function useHomeInit (state: Pick<HomeState, 'chatHistory' | 'curChat'>) {
    const { chatHistory, curChat } = state
    const { scrollToBottom } = useScrollToBottom('.chat-window-body')

    async function initHomeData () {
        try {
            const res = await getChatHistory()
            chatHistory.value = res
            if (res.length) {
                curChat.value = res[0]
            } else {
                curChat.value = null
            }
            scrollToBottom()
        } catch (error) {
            console.error('init home data failed', error)
        }
    }

    return {
        initHomeData
    }
}
