<script setup lang="ts">
import { useGptStore } from '@/stores/gptStore'
const { chatHistory, curChat } = storeToRefs(useGptStore())

import { useScrollToBottom } from '@/hooks/useScrollToBottom'
const { scrollToBottom } = useScrollToBottom('.chat-window-body')

const chatHistoryFormat = computed(() => {
    return chatHistory.value.map(item => {
        return {
            ...item,
            _time: item.chatRecords[0].createTime,
            _title: item.chatRecords[0].message
        }
    })
})
</script>

<template>
    <div class="chat-item" :class="{ active: curChat!.uid == chatItem.uid }" v-for="(chatItem) in chatHistoryFormat"
        :key="chatItem.uid" @click="curChat = chatItem, scrollToBottom()">
        <div class="chat-item-title">{{ chatItem._title }}</div>
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

    .chat-item-title {
        font-size: 14px;
        font-weight: bolder;
        display: block;
        width: calc(100% - 15px);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
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
