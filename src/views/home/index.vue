<script setup lang="ts">
import Sidebar from './cmp/sidebar.vue'
import ChatWindow from './cmp/chatWindow.vue'

import { useScrollToBottom } from '@/hooks/useScrollToBottom'
const { scrollToBottom } = useScrollToBottom('.chat-window-body')
import { getChatHistory } from '@/api/gptmock'
import { useGptStore } from '@/stores/gptStore'

const { chatHistory, curChat } = storeToRefs(useGptStore())

getChatHistory().then(res => {
    chatHistory.value = res
    curChat.value = res[0]
    scrollToBottom()
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
