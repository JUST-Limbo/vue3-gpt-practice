import type { gptMockNamespace } from './interface/gptmock'
import gptService from '@/utils/request'

export function getChatHistory (): Promise<gptMockNamespace.history> {
    return gptService({
        url: '/getChatHistroy',
    }).then(res => res.data)
}

export function deleteChatByUid (uid: string): Promise<gptMockNamespace.history> {
    return gptService({
        url: '/chat-history/' + encodeURIComponent(uid),
        method: 'delete'
    }).then((res: { data: gptMockNamespace.history }) => res.data)
}
