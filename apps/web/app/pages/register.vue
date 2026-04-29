<script setup lang="ts">
const auth = useAuth();

const email = ref('');
const password = ref('');
const displayName = ref('');
const error = ref<string | null>(null);
const submitting = ref(false);

async function onSubmit() {
  error.value = null;
  submitting.value = true;
  try {
    await auth.register(email.value, password.value, displayName.value);
    await navigateTo('/');
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Registration failed';
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <main>
    <h1>Register</h1>
    <form @submit.prevent="onSubmit">
      <label>
        Display name
        <input v-model="displayName" type="text" required />
      </label>
      <label>
        Email
        <input v-model="email" type="email" autocomplete="email" required />
      </label>
      <label>
        Password
        <input
          v-model="password"
          type="password"
          autocomplete="new-password"
          required
          minlength="8"
        />
      </label>
      <button type="submit" :disabled="submitting">
        {{ submitting ? 'Registering…' : 'Register' }}
      </button>
      <p v-if="error">{{ error }}</p>
    </form>
    <p>
      Have an account?
      <NuxtLink to="/login">Log in</NuxtLink>
    </p>
  </main>
</template>
