<template>
  <el-tag class="skill-tag" size="small" effect="plain">{{ skill }}</el-tag>
</template>

<script setup lang="ts">
defineProps<{ skill: string }>();
</script>

<style scoped>
.skill-tag {
  margin: 0 6px 6px 0;
}
</style>
