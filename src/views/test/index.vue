<template>
    <div></div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

const count = ref(0)
const state = reactive({
  count  // ref 会被自动解包
})

console.log(state.count)  // 0，不需要 .value

// 但数组情况特殊
const arr = reactive([ref(1), ref(2), ref(3)])
console.log(arr[0])  // 1，会自动解包 ✅
</script>

<style scoped></style>
