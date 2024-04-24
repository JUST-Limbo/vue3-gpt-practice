<script setup lang="ts">
import ChatList from './chatList.vue'
import { uuid, generateRandomSixDigitNumberExclusive } from '@/utils/index'
import { getCurrentTimestamp } from '@/utils'

import { useGptStore } from '@/stores/gptStore'
const { chatHistory, curChat, curChatEngine } = storeToRefs(useGptStore())

function createNewChat () {
    const uid = uuid()
    chatHistory.value.push({
        uid,
        chatRecords: [
            {
                id: generateRandomSixDigitNumberExclusive(),
                uid,
                type: 'answer',
                message: "有什么可以帮你的吗",
                chatEngine: curChatEngine.value,
                createTime: getCurrentTimestamp(),
                pid: null
            }
        ]
    })
    curChat.value = chatHistory.value[chatHistory.value.length - 1]
}
</script>

<template>
    <div class="home-sidebar">
        <div class="home-sidebar-header">
            <div class="home-sidebar-title">GPT</div>
            <div class="home-sidebar-description">
                A gpt frontend practice project. It is based on Vue3, vite, tailwind and TypeScript.
            </div>
        </div>
        <div class="home-sidebar-body">
            <ChatList />
        </div>
        <div class="home-sidebar-tail">
            <button class="new-chat" @click="createNewChat">
                <img class="add-icon" src="@/assets/icons/add.svg" alt="" width="16">
                <div class="add-text">新的聊天</div>
            </button>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.home-sidebar {
    top: 0;
    width: var(--sidebar-width);
    box-sizing: border-box;
    padding: 20px;
    background-color: var(--second);
    display: flex;
    flex-direction: column;
    box-shadow: inset -2px 0 2px 0 rgba(0, 0, 0, 0.05);
    position: relative;
    transition: width 0.05s ease;

    .home-sidebar-header {
        position: relative;
        padding-top: 20px;
        padding-bottom: 20px;

        .home-sidebar-title {
            font-size: 20px;
            font-weight: 700;
        }

        .home-sidebar-description {
            font-size: 12px;
            font-weight: 400;
        }
    }

    .home-sidebar-body {
        flex: 1 1;
        overflow: auto;
        overflow-x: hidden;
    }

    .home-sidebar-tail {
        display: flex;
        justify-content: space-between;
        padding-top: 20px;

        .new-chat {
            background-color: var(--white);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 10px;
            cursor: pointer;
            transition: all .3s ease;
            overflow: hidden;
            -webkit-user-select: none;
            -moz-user-select: none;
            user-select: none;
            outline: none;
            border: none;
            color: var(--black);
            box-shadow: var(--card-shadow);

            &:hover {
                filter: brightness(.9);
            }

            .add-icon {
                width: 16px;
                height: 16px;
            }

            .add-text {
                line-height: normal;
                margin-left: 5px;
                font-size: 12px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
        }
    }
}
</style>
