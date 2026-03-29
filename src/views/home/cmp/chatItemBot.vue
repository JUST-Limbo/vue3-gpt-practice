<script setup lang="ts">
import type { gptMockNamespace } from '@/api/interface/gptmock'

import markdown from '@/utils/markdownIt'

const props = defineProps<Partial<gptMockNamespace.chatRecord>>()

const botMessage = computed(() => {
    return markdown.value.render(props.message)
})

function copyMessage () {
    navigator.clipboard.writeText(props.message as string)
    ElMessage({
        message: '已写入剪切板',
        type: 'success',
        plain: true,
    })
}
</script>

<template>
    <div class="chat-message-bot">
        <div class="chat-message-container">
            <div class="chat-message-header flex items-center">
                <div class="chat-message-actions flex justify-center items-center">
                    <div class="chat-message-action" @click="copyMessage">
                        <img class="chat-icon" src="@/assets/icons/copy.svg" alt="">
                        <div class="chat-text">复制</div>
                    </div>
                </div>
            </div>
            <div class="chat-markdown-body" v-html="botMessage">
            </div>
            <div class="chat-message-date">{{ createTime }}</div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.chat-message-bot {
    display: flex;

    .chat-message-container {
        max-width: var(--message-max-width);
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        position: relative;
        overflow: hidden;

        .chat-message-header {
            .chat-message-actions {
                column-gap: 6px;
                transition: all .3s ease;
                transform: scale(.9) translateY(5px);
                opacity: 0;
                pointer-events: none;

                .chat-message-action {
                    --icon-width: 16px;
                    --full-width: 45px;
                    display: inline-flex;
                    border-radius: 20px;
                    font-size: 12px;
                    background-color: var(--white);
                    color: var(--black);
                    border: var(--border-in-light);
                    padding: 4px 10px;
                    animation: chat_slide-in__nvZgA .3s ease;
                    box-shadow: var(--card-shadow);
                    transition: width .3s ease;
                    align-items: center;
                    height: 16px;
                    width: var(--icon-width);
                    overflow: hidden;
                    box-sizing: content-box;
                    cursor: pointer;
                    user-select: none;

                    &:hover {
                        --delay: 0.5s;
                        width: var(--full-width);
                        transition-delay: var(--delay);
                        filter: brightness(.9);

                        .chat-text {
                            transition-delay: var(--delay);
                            opacity: 1;
                            transform: translate(0);
                        }
                    }

                    .chat-icon {
                        width: 16px;
                        height: 16px;
                    }

                    .chat-text {
                        white-space: nowrap;
                        padding-left: 5px;
                        opacity: 0;
                        transform: translateX(-5px);
                        transition: all .3s ease;
                        pointer-events: none;
                    }
                }
            }
        }

        .chat-markdown-body {
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
            overflow-x: auto;
        }

        .chat-message-date {
            font-size: 12px;
            opacity: .2;
            white-space: nowrap;
            transition: all .6s ease;
            color: var(--black);
            text-align: left;
            width: 100%;
            box-sizing: border-box;
            padding-left: 10px;
            padding-right: 0;
            pointer-events: none;
            z-index: 1;
        }
    }
}

.chat-message-container:hover {
    .chat-message-actions {
        opacity: 1 !important;
        pointer-events: all !important;
        transform: scale(1) translateY(0) !important;
    }
}
</style>
