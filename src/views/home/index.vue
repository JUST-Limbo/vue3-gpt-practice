<script setup lang="ts">
import Sidebar from './cmp/sidebar.vue'
import ChatWindow from './cmp/chatWindow.vue'
import { homeStateKey } from './context'
import { useHomeInit } from './composables/useHomeInit'
import type { gptMockNamespace } from '@/api/interface/gptmock'

const chatHistory = ref<gptMockNamespace.history>([])
const curChat = ref<Nullable<gptMockNamespace.historyItem>>(null)
const chatWindowScollLock = ref(false)
function unLockScroll () {
    chatWindowScollLock.value = false
}
function lockScroll () {
    chatWindowScollLock.value = true
}

provide(homeStateKey, {
    chatHistory,
    curChat,
    chatWindowScollLock,
    unLockScroll,
    lockScroll
})

const { initHomeData } = useHomeInit({
    chatHistory,
    curChat
})

onMounted(async () => {
    await initHomeData()
})
</script>

<template>
    <div class="home-container">
        <Sidebar />
        <ChatWindow />
    </div>
</template>
<style scoped>
.home-container {
    border: var(--border-in-light);
    border-radius: 20px;
    box-shadow: var(--shadow);
    color: var(--black);
    background-color: var(--white);
    min-width: 600px;
    min-height: 370px;
    max-width: 1200px;
    display: flex;
    overflow: hidden;
    box-sizing: border-box;
    width: var(--window-width);
    height: var(--window-height);
}
</style>
