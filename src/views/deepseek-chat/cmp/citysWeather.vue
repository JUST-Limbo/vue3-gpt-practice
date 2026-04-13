<template>
    <ul>
        <li v-for="item in tableData" :key="item.id">
            <span>{{ item.name }}</span>
            <span>{{ item.weather }}</span>
            <span>{{ item.temperature }}</span>
        </li>
    </ul>
</template>

<script setup lang="ts">
const { tableData = [] } = defineProps<{
    tableData: any[]
}>()
</script>
