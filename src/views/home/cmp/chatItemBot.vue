<script setup lang="ts">
import type { gptMockNamespace } from '@/api/interface/gptmock'

import markdown from '@/utils/markdownIt'
import { findLastNonEmptyTextNode } from '@/utils/DomUtils'

const props = defineProps<Partial<gptMockNamespace.chatRecord>>()

type aiEngineType = 'OpenAI-4' | 'OpenAI-3' | 'ERNIE-Bot'
const botNameMap = ref<Record<aiEngineType, string>>({
    'OpenAI-4': 'GPT4',
    'OpenAI-3': 'GPT3',
    'ERNIE-Bot': '文心一言'
})
const botName = computed(() => {
    return botNameMap.value[props.chatEngine as aiEngineType] || ''
})

const chatMarkdownBody = ref()
const chatMessageContainer = ref()
const botMessage = computed(() => {
    return markdown.value.render(props.message)
})

const pos = reactive({ x: 0, y: 0 })

let textNode: Nullable<Text> = document.createTextNode('_')
function refreshPosXY () {
    const lastText = findLastNonEmptyTextNode(chatMarkdownBody.value)
    if (lastText) {
        lastText.parentNode!.appendChild(textNode!)
    }
    const range = document.createRange()
    range.setStart(textNode!, 0)
    range.setEnd(textNode!, 0)
    const textNodeRect = range.getBoundingClientRect()
    const containerRect = chatMessageContainer.value.getBoundingClientRect()
    pos.x = textNodeRect.left - containerRect.left
    pos.y = textNodeRect.top - containerRect.top
    textNode!.remove()
}
onMounted(() => {
    refreshPosXY()
})
onUpdated(() => {
    refreshPosXY()
})
onBeforeUnmount(() => {
    textNode = null
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
        <div ref="chatMessageContainer" class="chat-message-container">
            <div class="chat-message-header flex justify-center items-center">
                <div class="chat-message-avatar flex justify-center items-center">
                    <img class="bot-avatar" src="@/assets/icons/bot.svg">
                    <span class="ml-2"> {{ botName }}:</span>
                </div>
                <div class="chat-message-actions ml-6 flex justify-center items-center">
                    <div class="chat-message-action" @click="copyMessage">
                        <img class="chat-icon" src="@/assets/icons/copy.svg" alt="">
                        <div class="chat-text">复制</div>
                    </div>
                </div>
            </div>
            <div ref="chatMarkdownBody" class="chat-markdown-body" :class="{ 'chat-markdown-body-rendering': chatting }"
                v-html="botMessage">
            </div>
            <div class="chat-message-date">{{ createTime }}</div>
            <div class="blink" v-if="chatting"></div>
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

        .blink {
            position: absolute;
            width: 10px;
            height: 2px;
            transform: translateY(13px);
            background: black;
            left: calc(v-bind('pos.x') * 1px);
            top: calc(v-bind('pos.y') * 1px);
            animation: blink 1s steps(5, start) infinite;
        }

        .chat-message-header {
            .chat-message-avatar {
                .bot-avatar {
                    overflow: hidden;
                    height: 30px;
                    width: 30px;
                    border-radius: 11px;
                    box-shadow: var(--card-shadow);
                }
            }

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
            background-color: rgba(0, 0, 0, .05);
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
