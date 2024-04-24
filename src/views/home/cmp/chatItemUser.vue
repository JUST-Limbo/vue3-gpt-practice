<script setup lang="ts">
import type { gptMockNamespace } from '@/api/interface/gptmock'
defineProps<Partial<gptMockNamespace.chatRecord>>()
</script>

<template>
    <div class="chat-message-user">
        <div class="chat-message-container">
            <div class="chat-message-header">
                <div class="chat-message-avatar">
                    <div class="user-avatar">
                        <img src="@/assets/icons/brain.svg">
                    </div>
                </div>
            </div>
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

        .chat-message-header {
            margin-top: 20px;
            display: flex;
            align-items: center;
            flex-direction: row-reverse;

            .chat-message-avatar {
                .user-avatar {
                    overflow: hidden;
                    height: 30px;
                    min-height: 30px;
                    width: 30px;
                    min-width: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: var(--border-in-light);
                    box-shadow: var(--card-shadow);
                    border-radius: 11px;
                }
            }
        }

        .chat-markdown-body {
            white-space: pre-wrap;
            box-sizing: border-box;
            max-width: 100%;
            margin-top: 10px;
            border-radius: 10px;
            background-color: var(--second);
            padding: 10px;
            font-size: 14px;
            -webkit-user-select: text;
            -moz-user-select: text;
            user-select: text;
            word-break: break-word;
            border: var(--border-in-light);
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
