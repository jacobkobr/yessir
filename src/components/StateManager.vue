<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getState, updateState } from '../services/dynamoService'

interface StateData {
  [key: string]: string
}

const state = ref<StateData>({})
const loading = ref(false)
const error = ref('')

const loadState = async () => {
  loading.value = true
  error.value = ''
  try {
    state.value = await getState()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load state'
  } finally {
    loading.value = false
  }
}

const saved = ref(false)

const handleUpdate = async () => {
  loading.value = true
  error.value = ''
  saved.value = false
  try {
    await updateState(state.value)
    saved.value = true
    setTimeout(() => saved.value = false, 3000)
    await loadState()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to update state'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadState()
})
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div class="header-left">
        <h1><i class="pi pi-database"></i> State Data</h1>
      </div>
      <div class="header-actions">
        <button @click="loadState" :disabled="loading">
          <i class="pi pi-refresh"></i>
          Refresh
        </button>
        <button class="primary" @click="handleUpdate" :disabled="loading">
          <i class="pi pi-save"></i>
          Update State
        </button>
      </div>
    </header>

    <div class="page-content">
      <div v-if="error" class="message error-message">{{ error }}</div>
      <div v-if="saved" class="message success-message">State updated successfully</div>

      <div v-if="loading" class="loading">Loading state data...</div>
      <div v-else-if="Object.keys(state).length === 0" class="empty">No state data available</div>
      <div v-else class="state-form">
        <div v-for="key in Object.keys(state)" :key="key" class="form-field">
          <label class="field-label">{{ key }}</label>
          <input v-model="state[key]" type="text" class="field-input" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.header-left h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.header-actions button {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.message {
  padding: 12px 16px;
  border-radius: 4px;
  margin-bottom: 16px;
}

.error-message {
  background-color: rgba(240, 71, 71, 0.1);
  color: var(--error);
  border: 1px solid var(--error);
}

.success-message {
  background-color: rgba(67, 181, 129, 0.1);
  color: var(--success);
  border: 1px solid var(--success);
}

.loading, .empty {
  text-align: center;
  color: var(--text-secondary);
  padding: 48px;
  font-size: 15px;
}

.state-form {
  max-width: 600px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.field-input {
  background-color: var(--bg-secondary);
}
</style>
