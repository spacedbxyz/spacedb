<script setup lang="ts">
definePageMeta({ middleware: 'auth' });

const auth = useAuth();
const client = useNuxtApp().$client;

const { data: ssrHealth } = await useAsyncData('health.ping.ssr', () =>
  client.health.ping(),
);

const clientHealth = ref<Awaited<ReturnType<typeof client.health.ping>> | null>(
  null,
);
const clientPending = ref(false);
const clientError = ref<string | null>(null);

async function pingFromClient() {
  clientPending.value = true;
  clientError.value = null;
  try {
    clientHealth.value = await client.health.ping();
  } catch (e) {
    clientError.value = e instanceof Error ? e.message : 'Ping failed';
  } finally {
    clientPending.value = false;
  }
}

async function onLogout() {
  await auth.logout();
  await navigateTo('/login');
}
</script>

<template>
  <main>
    <h1>spacedb</h1>
    <p v-if="auth.user.value">
      Hello, {{ auth.user.value.displayName }} ({{ auth.user.value.email }})
    </p>

    <section>
      <h2>Health (SSR)</h2>
      <p>Fetched on the server during render via <code>useAsyncData</code>.</p>
      <pre v-if="ssrHealth">{{ ssrHealth }}</pre>
    </section>

    <section>
      <h2>Health (client)</h2>
      <p>Fetched in the browser via the BFF on demand.</p>
      <button type="button" :disabled="clientPending" @click="pingFromClient">
        {{ clientPending ? 'Pinging…' : 'Ping from client' }}
      </button>
      <pre v-if="clientHealth">{{ clientHealth }}</pre>
      <p v-if="clientError">{{ clientError }}</p>
    </section>

    <button type="button" @click="onLogout">Log out</button>
  </main>
</template>
