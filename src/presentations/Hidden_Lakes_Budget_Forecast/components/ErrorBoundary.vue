<script setup>
import { ref, onErrorCaptured } from 'vue'

const error = ref(null)

onErrorCaptured((err) => {
  error.value = err
  return true
})
</script>

<template>
  <div class="error-boundary">
    <div v-if="error" class="error-message">
      <p>{{ error }}</p>
    </div>
    <slot v-else></slot>
  </div>
</template>

<style scoped>
.error-boundary {
  width: 100%;
  height: 100%;
}

.error-message {
  color: #721c24;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  padding: 1rem;
  border-radius: 4px;
  margin: 1rem 0;
}
</style> 