<script setup lang="ts">
import ChatInputPanel from './chatInputPanel.vue'
import ChatWindowBody from './chatWindowBody.vue'
import { useGptStore } from '@/stores/gptStore'
const { curChat } = storeToRefs(useGptStore())

import { useCodeCopy } from '@/hooks/useCodeCopy'
const codeCopyPower = useCodeCopy()
const copyPowerTrigger = codeCopyPower.launch()
onBeforeUnmount(() => {
    copyPowerTrigger()
})
</script>

<template>
    <div class="chat-window-content">
        <div class="window-header">
            <div class="window-header-title" v-if="curChat">
                <div class="window-header-main-title">{{ curChat.chatRecords[0].message }}</div>
                <div class="window-header-sub-title">共 {{ curChat.chatRecords.length }} 条对话</div>
            </div>
        </div>
        <ChatWindowBody />
        <ChatInputPanel />
    </div>
</template>

<style lang="scss" scoped>
.chat-window-content {
    width: var(--window-content-width);
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;

    .window-header {
        padding: 14px 20px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);

        .window-header-title {
            .window-header-main-title {
                font-size: 20px;
                font-weight: bolder;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                display: block;
                max-width: 50vw;
            }

            .window-header-sub-title {
                font-size: 14px;
            }
        }
    }
}
</style>
