<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getParameter, putParameter } from '../services/ssmService'

const config = ref('')
const loading = ref(false)
const error = ref('')
const saved = ref(false)

const loadConfig = async () => {
  loading.value = true
  error.value = ''
  try {
    config.value = await getParameter()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load config'
  } finally {
    loading.value = false
  }
}

const saveConfig = async () => {
  loading.value = true
  error.value = ''
  saved.value = false
  try {
    await putParameter(config.value)
    saved.value = true
    setTimeout(() => saved.value = false, 3000)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to save config'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadConfig()
})
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div class="header-left">
        <h1><i class="pi pi-cog"></i> Server Config</h1>
      </div>
      <div class="header-actions">
        <button @click="loadConfig" :disabled="loading">
          <i class="pi pi-refresh"></i>
          Refresh
        </button>
        <button class="primary" @click="saveConfig" :disabled="loading">
          <i class="pi pi-save"></i>
          Save Changes
        </button>
      </div>
    </header>

    <div class="page-content">
      <div v-if="error" class="message error-message">{{ error }}</div>
      <div v-if="saved" class="message success-message">Configuration saved successfully</div>

      <div class="editor-container">
        <textarea
          v-model="config"
          :disabled="loading"
          placeholder="Enter server configuration..."
          class="config-editor"
        ></textarea>
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
  display: flex;
  flex-direction: column;
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

.editor-container {
  flex: 1;
  display: flex;
}

.config-editor {
  flex: 1;
  min-height: 400px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.6;
  resize: none;
}
</style>
