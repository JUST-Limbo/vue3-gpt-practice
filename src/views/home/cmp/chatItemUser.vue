<script setup lang="ts">
import type { gptMockNamespace } from '@/api/interface/gptmock'
defineProps<Partial<gptMockNamespace.chatRecord>>()
</script>

<template>
    <div class="chat-message-user">
        <div class="chat-message-container">
            <div class="chat-markdown-body">{{ message }}</div>
            <div class="chat-message-date">{{ createTime }}</div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.chat-message-user {
    display: flex;
    flex-direction: row-reverse;

    .chat-message-container {
        max-width: var(--message-max-width);
        display: flex;
        flex-direction: column;
        align-items: flex-end;

        .chat-markdown-body {
            white-space: pre-wrap;
            box-sizing: border-box;
            max-width: 100%;
            margin-top: 10px;
            border-radius: 10px;
            padding: 10px;
            font-size: 14px;
            -webkit-user-select: text;
            -moz-user-select: text;
            user-select: text;
            word-break: break-word;
            position: relative;
            transition: all .3s ease;
        }

        .chat-message-date {
            font-size: 12px;
            opacity: .2;
            white-space: nowrap;
            transition: all .6s ease;
            color: var(--black);
            text-align: right;
            width: 100%;
            box-sizing: border-box;
            padding-right: 10px;
            pointer-events: none;
        }
    }
}
</style>
