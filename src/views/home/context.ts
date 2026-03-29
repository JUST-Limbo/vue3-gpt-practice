import type { InjectionKey, Ref } from 'vue'
import type { gptMockNamespace } from '@/api/interface/gptmock'

export type HomeState = {
    chatHistory: Ref<gptMockNamespace.history>
    curChat: Ref<Nullable<gptMockNamespace.historyItem>>
    chatWindowScollLock: Ref<boolean>
    unLockScroll: () => void
    lockScroll: () => void
}

export const homeStateKey: InjectionKey<HomeState> = Symbol('homeStateKey')

export function useHomeState (): HomeState {
    const state = inject(homeStateKey)
    if (!state) {
        throw new Error('home state is not provided')
    }
    return state
}
