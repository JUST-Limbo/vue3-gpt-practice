<script setup lang="ts">
const model = defineModel({ type: String })
const emit = defineEmits(['send'])

function handleEnterKeyDown ($event: KeyboardEvent) {
    if ($event.keyCode == 13) {
        if (!$event.ctrlKey && !$event.shiftKey) {
            emit('send')
            $event.preventDefault();
        } else {
            model.value += '\n';
        }
    }
}

const textarea = ref()
function handleInput () {
    const textAreaDom = textarea.value
    textAreaDom.style.height = "auto"
    const height = textAreaDom.scrollHeight
    textAreaDom.style.height = Math.min(height, 260) + 'px'
}
</script>

<template>
    <label class="chat-input-inner" for="chat-input">
        <textarea ref="textarea" v-model.trim="model" class="chat-input" id="chat-input"
            placeholder="Enter 发送，Shift + Enter 换行" @keydown.enter="handleEnterKeyDown" @input="handleInput"></textarea>
        <el-button class="chat-send" type="primary" @click="emit('send')">
            <img src="@/assets/icons/send-white.svg" alt="">发送
        </el-button>
    </label>
</template>

<style lang="scss" scoped>
.chat-input-inner {
    cursor: text;
    display: flex;
    border-radius: 10px;
    border: var(--border-in-light);

    .chat-input {
        width: 100%;
        border-radius: 10px;
        border: none;
        box-shadow: 0 -2px 5px rgba(0, 0, 0, .03);
        background-color: var(--white);
        color: var(--black);
        font-family: inherit;
        padding: 10px 90px 10px 14px;
        resize: none;
        outline: none;
        box-sizing: border-box;
        min-height: 68px;
        font-size: 14px;
    }

    .chat-send {
        position: absolute;
        right: 30px;
        bottom: 32px;
    }
}
</style>
