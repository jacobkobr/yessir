<script setup lang="ts">
import { ref } from 'vue'
import { fetchLogs, uploadLog } from '../services/s3Service'

const logs = ref<string[]>([])
const loading = ref(false)
const error = ref('')

const loadLogs = async () => {
  loading.value = true
  error.value = ''
  try {
    logs.value = await fetchLogs()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load logs'
  } finally {
    loading.value = false
  }
}

const handleUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return

  loading.value = true
  error.value = ''
  try {
    await uploadLog(input.files[0])
    await loadLogs()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to upload log'
  } finally {
    loading.value = false
    input.value = ''
  }
}
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div class="header-left">
        <h1><i class="pi pi-folder"></i> S3 File Tree</h1>
      </div>
      <div class="header-actions">
        <button @click="loadLogs" :disabled="loading">
          <i class="pi pi-refresh"></i>
          Refresh
        </button>
        <label class="upload-btn">
          <input type="file" @change="handleUpload" :disabled="loading" />
          <i class="pi pi-upload"></i>
          Upload File
        </label>
      </div>
    </header>

    <div class="page-content">
      <div v-if="error" class="message error-message">{{ error }}</div>
      <div v-if="loading" class="loading">Loading files...</div>
      <div v-else-if="logs.length === 0" class="empty">No files found in S3 bucket</div>
      <div v-else class="file-tree">
        <div v-for="(log, index) in logs" :key="index" class="file-item">
          <i class="pi pi-file file-icon"></i>
          <span class="file-name">{{ log }}</span>
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

.header-actions button,
.upload-btn {
  display: flex;
  align-items: center;
  gap: 8px;
}

.upload-btn {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  background-color: var(--accent);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-btn:hover {
  background-color: var(--accent-hover);
}

.upload-btn input[type="file"] {
  display: none;
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

.loading, .empty {
  text-align: center;
  color: var(--text-secondary);
  padding: 48px;
  font-size: 15px;
}

.file-tree {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background-color: var(--bg-secondary);
  border-radius: 4px;
  transition: background-color 0.15s;
  cursor: pointer;
}

.file-item:hover {
  background-color: var(--bg-tertiary);
}

.file-icon {
  font-size: 14px;
  flex-shrink: 0;
  color: var(--text-muted);
}

.file-name {
  font-size: 14px;
  color: var(--text-primary);
  font-family: monospace;
}
</style>
