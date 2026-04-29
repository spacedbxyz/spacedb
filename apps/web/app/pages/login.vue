<script setup lang="ts">
const auth = useAuth();
const route = useRoute();

const email = ref('');
const password = ref('');
const error = ref<string | null>(null);
const submitting = ref(false);

async function onSubmit() {
  error.value = null;
  submitting.value = true;
  try {
    await auth.login(email.value, password.value);
    const redirect = (route.query.redirect as string | undefined) ?? '/';
    await navigateTo(redirect);
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Login failed';
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <main>
    <h1>Log in</h1>
    <form @submit.prevent="onSubmit">
      <label>
        Email
        <input v-model="email" type="email" autocomplete="email" required />
      </label>
      <label>
        Password
        <input
          v-model="password"
          type="password"
          autocomplete="current-password"
          required
        />
      </label>
      <button type="submit" :disabled="submitting">
        {{ submitting ? 'Logging in…' : 'Log in' }}
      </button>
      <p v-if="error">{{ error }}</p>
    </form>
    <p>
      No account?
      <NuxtLink to="/register">Register</NuxtLink>
    </p>
  </main>
</template>
