<script setup lang="ts">
const client = useClient();
const { data, error } = await useAsyncData('health.ping', () =>
  client.health.ping(),
);
</script>

<template>
  <main>
    <h1>spacedb</h1>
    <pre v-if="data">{{ data }}</pre>
    <pre v-else-if="error">error: {{ error.message }}</pre>
  </main>
</template>
