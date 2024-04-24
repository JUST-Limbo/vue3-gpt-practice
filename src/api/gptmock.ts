import type { gptMockNamespace } from './interface/gptmock'
import gptService from '@/utils/request'

export function getChatHistory (): Promise<gptMockNamespace.history> {
    return gptService({
        url: '/getChatHistroy',
    }).then(res => res.data)
}
