<script setup lang="ts">
import { deleteChatByUid } from '@/api/gptmock'
import { useHomeState } from '../context'
import type { gptMockNamespace } from '@/api/interface/gptmock'
const { chatHistory, curChat } = useHomeState()

import { useScrollToBottom } from '@/hooks/useScrollToBottom'
const { scrollToBottom } = useScrollToBottom('.chat-window-body')

const chatHistoryFormat = computed(() => {
    return chatHistory.value.map((item) => {
        const first = item.chatRecords.length > 0 ? item.chatRecords[0] : null
        return {
            ...item,
            _time: first ? first.createTime : '',
            _title: first ? String(first.message) : ''
        }
    })
})

async function handleDelete (e: MouseEvent, uid: string) {
    console.log(uid)
    e.stopPropagation()
    try {
        const next = await deleteChatByUid(uid)
        chatHistory.value = next
        if (curChat.value && curChat.value.uid === uid) {
            curChat.value = next.length > 0 ? next[0] : null
        }
        scrollToBottom()
    } catch (error) {
        console.error(error)
        ElMessage({
            message: '删除失败',
            type: 'error'
        })
    }
}

const changeChat = (chatItem: gptMockNamespace.historyItem) => {
    curChat.value = chatItem
    console.log(curChat.value)
    scrollToBottom()
}
</script>

<template>
    <div
        class="chat-item"
        :class="{ active: curChat && curChat.uid == chatItem.uid }"
        v-for="chatItem in chatHistoryFormat"
        :key="chatItem.uid"
        @click="changeChat(chatItem)"
    >
        <div class="chat-item-top">
            <div class="chat-item-title">{{ chatItem._title }}</div>
            <button
                type="button"
                class="chat-item-delete"
                @click.stop="handleDelete($event, chatItem.uid)"
            >
                删除
            </button>
        </div>
        <div class="chat-item-info">
            <div class="chat-item-count">{{ chatItem.chatRecords.length }} 条对话</div>
            <div class="chat-item-date">{{ chatItem._time }}</div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.chat-item {
    padding: 10px 14px;
    background-color: var(--white);
    border-radius: 10px;
    margin-bottom: 10px;
    box-shadow: var(--card-shadow);
    transition: background-color 0.3s ease;
    cursor: pointer;
    -webkit-user-select: none;
    -moz-user-select: none;
    user-select: none;
    border: 2px solid transparent;
    position: relative;
    content-visibility: auto;

    &.active {
        border-color: var(--primary);
    }

    &:hover {
        background-color: var(--hover-color);
    }

    .chat-item-top {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
    }

    .chat-item-title {
        font-size: 14px;
        font-weight: bolder;
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .chat-item-delete {
        flex-shrink: 0;
        font-size: 12px;
        color: #a6a6a6;
        border: none;
        background: transparent;
        cursor: pointer;
        padding: 2px 4px;
        border-radius: 4px;
        outline: none;
    }

    .chat-item-delete:hover {
        color: var(--primary);
        background-color: rgba(0, 0, 0, 0.04);
    }

    .chat-item-info {
        display: flex;
        justify-content: space-between;
        color: #a6a6a6;
        font-size: 12px;
        margin-top: 8px;

        .chat-item-count,
        .chat-item-date {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
    }
}
</style>
