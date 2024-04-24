<script setup lang="ts">
import { useScroll } from '@vueuse/core'
import ChatItemUser from './chatItemUser.vue'
import ChatItemBot from './chatItemBot.vue'

import { useGptStore } from '@/stores/gptStore'
const { lockScroll } = useGptStore()
const { curChat, chatWindowScollLock } = storeToRefs(useGptStore())


const chatWindowBody = ref<HTMLElement>()
const { directions, isScrolling, y } = useScroll(chatWindowBody)
watch(directions, (newdirections) => {
    if (isScrolling && newdirections.top && !chatWindowScollLock.value) {
        const scrollHeight = chatWindowBody.value!.scrollHeight
        const offsetHeight = chatWindowBody.value!.offsetHeight
        const scrollTop = y.value
        if ((scrollHeight - (scrollTop + offsetHeight)) > 50) {
            lockScroll()
        }
    }
})

const chatMessages = computed(() => {
    return curChat.value?.chatRecords || []
})
</script>

<template>
    <div ref="chatWindowBody" class="chat-window-body">
        <template v-for="(messageItem) in chatMessages" :key="messageItem.id">
            <ChatItemUser v-if="messageItem.type == 'question'" v-bind="messageItem" />
            <ChatItemBot v-else v-bind="messageItem" />
        </template>
    </div>
</template>

<style lang="scss" scoped>
.chat-window-body {
    flex: 1 1 0%;
    overflow: hidden auto;
    padding: 20px 20px 40px;
    position: relative;
    overscroll-behavior: none;
}
</style>
