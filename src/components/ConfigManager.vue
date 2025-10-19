<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { getParameter, putParameter } from '../services/ssmService'

const config = ref('')
const loading = ref(false)
const error = ref('')
const saved = ref(false)
const formatMode = ref<'raw' | 'json'>('json')
const validationError = ref('')
const lineNumbers = ref(true)

const loadConfig = async () => {
  loading.value = true
  error.value = ''
  try {
    const data = await getParameter()
    config.value = data
    if (formatMode.value === 'json') {
      try {
        const parsed = JSON.parse(data)
        config.value = JSON.stringify(parsed, null, 2)
      } catch {
        formatMode.value = 'raw'
      }
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load config'
  } finally {
    loading.value = false
  }
}

const validateConfig = () => {
  validationError.value = ''
  if (formatMode.value === 'json') {
    try {
      JSON.parse(config.value)
      return true
    } catch (e) {
      validationError.value = e instanceof Error ? e.message : 'Invalid JSON'
      return false
    }
  }
  return true
}

const saveConfig = async () => {
  if (!validateConfig()) {
    error.value = 'Cannot save: ' + validationError.value
    return
  }

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

const formatJson = () => {
  try {
    const parsed = JSON.parse(config.value)
    config.value = JSON.stringify(parsed, null, 2)
    validationError.value = ''
  } catch (e) {
    validationError.value = e instanceof Error ? e.message : 'Invalid JSON'
  }
}

const minifyJson = () => {
  try {
    const parsed = JSON.parse(config.value)
    config.value = JSON.stringify(parsed)
    validationError.value = ''
  } catch (e) {
    validationError.value = e instanceof Error ? e.message : 'Invalid JSON'
  }
}

const configLines = computed(() => {
  return config.value.split('\n')
})

const charCount = computed(() => config.value.length)
const lineCount = computed(() => configLines.value.length)
const wordCount = computed(() => config.value.trim().split(/\s+/).length)

watch(config, () => {
  if (formatMode.value === 'json') {
    validateConfig()
  }
})

onMounted(() => {
  loadConfig()
})
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div class="header-left">
        <h1><i class="pi pi-cog"></i> Configuration Editor</h1>
        <div class="header-stats">
          <span class="stat-pill">
            <i class="pi pi-align-left"></i>
            {{ lineCount }} lines
          </span>
          <span class="stat-pill">
            <i class="pi pi-file"></i>
            {{ charCount }} chars
          </span>
        </div>
      </div>
      <div class="header-actions">
        <div class="mode-toggle">
          <button
            :class="{ active: formatMode === 'json' }"
            @click="formatMode = 'json'; validateConfig()"
          >
            JSON
          </button>
          <button
            :class="{ active: formatMode === 'raw' }"
            @click="formatMode = 'raw'; validationError = ''"
          >
            Raw
          </button>
        </div>
        <button
          v-if="formatMode === 'json'"
          @click="formatJson"
          :disabled="loading"
          title="Format JSON"
        >
          <i class="pi pi-align-justify"></i>
        </button>
        <button
          v-if="formatMode === 'json'"
          @click="minifyJson"
          :disabled="loading"
          title="Minify JSON"
        >
          <i class="pi pi-minus"></i>
        </button>
        <button @click="loadConfig" :disabled="loading">
          <i class="pi pi-refresh" :class="{ spinning: loading }"></i>
        </button>
        <button class="primary" @click="saveConfig" :disabled="loading">
          <i class="pi pi-save"></i>
          Save
        </button>
      </div>
    </header>

    <div class="page-content">
      <div v-if="error" class="message error-message">
        <i class="pi pi-exclamation-triangle"></i>
        {{ error }}
      </div>
      <div v-if="saved" class="message success-message">
        <i class="pi pi-check-circle"></i>
        Configuration saved successfully
      </div>
      <div v-if="validationError" class="message warning-message">
        <i class="pi pi-exclamation-circle"></i>
        {{ validationError }}
      </div>

      <div class="editor-wrapper">
        <div class="editor-toolbar">
          <div class="toolbar-left">
            <button
              class="toolbar-btn"
              :class="{ active: lineNumbers }"
              @click="lineNumbers = !lineNumbers"
              title="Toggle line numbers"
            >
              <i class="pi pi-list"></i>
              Line Numbers
            </button>
          </div>
          <div class="toolbar-right">
            <span class="validation-badge" :class="{ valid: !validationError && config, invalid: validationError }">
              <i class="pi" :class="validationError ? 'pi-times-circle' : 'pi-check-circle'"></i>
              {{ validationError ? 'Invalid' : 'Valid' }}
            </span>
          </div>
        </div>

        <div class="editor-container">
          <div v-if="lineNumbers" class="line-numbers">
            <div v-for="(_line, index) in configLines" :key="index" class="line-number">
              {{ index + 1 }}
            </div>
          </div>
          <textarea
            v-model="config"
            :disabled="loading"
            placeholder="Enter server configuration..."
            class="config-editor"
            spellcheck="false"
          ></textarea>
        </div>

        <div class="editor-footer">
          <div class="footer-info">
            <span><i class="pi pi-map"></i> {{ lineCount }} lines</span>
            <span><i class="pi pi-bookmark"></i> {{ wordCount }} words</span>
            <span><i class="pi pi-file"></i> {{ charCount }} characters</span>
          </div>
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
  background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 32px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border-color);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-left h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-stats {
  display: flex;
  gap: 8px;
}

.stat-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mode-toggle {
  display: flex;
  gap: 4px;
  background-color: var(--bg-secondary);
  padding: 4px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.mode-toggle button {
  padding: 8px 16px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  font-weight: 600;
  font-size: 13px;
}

.mode-toggle button:hover {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
}

.mode-toggle button.active {
  background-color: var(--accent);
  color: white;
}

.header-actions button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.header-actions button:hover {
  background-color: var(--bg-tertiary);
  border-color: var(--accent);
}

.header-actions button.primary {
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%);
  color: white;
  border: none;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.header-actions button.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.page-content {
  flex: 1;
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.message {
  padding: 14px 18px;
  border-radius: 8px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 500;
}

.error-message {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.success-message {
  background-color: rgba(34, 197, 94, 0.1);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.warning-message {
  background-color: rgba(251, 146, 60, 0.1);
  color: #fb923c;
  border: 1px solid rgba(251, 146, 60, 0.3);
}

.editor-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-color);
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background-color: transparent;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 12px;
  font-weight: 500;
}

.toolbar-btn:hover {
  background-color: var(--bg-secondary);
  border-color: var(--accent);
  color: var(--text-primary);
}

.toolbar-btn.active {
  background-color: var(--accent);
  border-color: var(--accent);
  color: white;
}

.validation-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.validation-badge.valid {
  background-color: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.validation-badge.invalid {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.editor-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.line-numbers {
  padding: 20px 0;
  background-color: var(--bg-tertiary);
  border-right: 1px solid var(--border-color);
  user-select: none;
  text-align: right;
  min-width: 50px;
}

.line-number {
  padding: 0 12px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-muted);
}

.config-editor {
  flex: 1;
  padding: 20px;
  background-color: var(--bg-primary);
  border: none;
  color: var(--text-primary);
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.6;
  resize: none;
  outline: none;
  overflow-y: auto;
}

.config-editor:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.editor-footer {
  padding: 10px 16px;
  background-color: var(--bg-tertiary);
  border-top: 1px solid var(--border-color);
}

.footer-info {
  display: flex;
  gap: 20px;
  font-size: 12px;
  color: var(--text-secondary);
}

.footer-info span {
  display: flex;
  align-items: center;
  gap: 6px;
}

.footer-info i {
  font-size: 11px;
}
</style>
