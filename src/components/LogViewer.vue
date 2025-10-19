<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { fetchLogs, uploadLog } from '../services/s3Service'
import FileTreeNode from './FileTreeNode.vue'

interface FileNode {
  name: string
  path: string
  type: 'file' | 'folder'
  children?: FileNode[]
  size?: number
  expanded?: boolean
}

const logs = ref<string[]>([])
const loading = ref(false)
const error = ref('')
const searchQuery = ref('')
const selectedFile = ref<string | null>(null)
const fileContent = ref('')
const viewMode = ref<'tree' | 'list'>('tree')
const dragOver = ref(false)

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

const buildFileTree = (paths: string[]): FileNode[] => {
  const root: FileNode[] = []

  paths.forEach(path => {
    const parts = path.split('/')
    let currentLevel = root

    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1
      let existingNode = currentLevel.find(node => node.name === part)

      if (!existingNode) {
        existingNode = {
          name: part,
          path: parts.slice(0, index + 1).join('/'),
          type: isFile ? 'file' : 'folder',
          children: isFile ? undefined : [],
          expanded: false
        }
        currentLevel.push(existingNode)
      }

      if (!isFile && existingNode.children) {
        currentLevel = existingNode.children
      }
    })
  })

  return root
}

const fileTree = computed(() => buildFileTree(filteredLogs.value))

const filteredLogs = computed(() => {
  if (!searchQuery.value) return logs.value
  return logs.value.filter(log =>
    log.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const toggleFolder = (node: FileNode) => {
  if (node.type === 'folder') {
    node.expanded = !node.expanded
  }
}

const selectFile = (node: FileNode) => {
  if (node.type === 'file') {
    selectedFile.value = node.path
    fileContent.value = `Loading content for: ${node.path}\n\n[Simulated file content would appear here]`
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

const handleDrop = async (event: DragEvent) => {
  event.preventDefault()
  dragOver.value = false

  const files = event.dataTransfer?.files
  if (!files?.length) return

  loading.value = true
  error.value = ''
  try {
    for (const file of Array.from(files)) {
      await uploadLog(file)
    }
    await loadLogs()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to upload files'
  } finally {
    loading.value = false
  }
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  dragOver.value = true
}

const handleDragLeave = () => {
  dragOver.value = false
}

const getFileIcon = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'log': return 'pi-file-edit'
    case 'txt': return 'pi-file'
    case 'json': return 'pi-code'
    case 'csv': return 'pi-table'
    case 'zip': return 'pi-box'
    default: return 'pi-file'
  }
}

onMounted(() => {
  loadLogs()
})
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div class="header-left">
        <h1><i class="pi pi-folder-open"></i> S3 File Browser</h1>
        <div class="header-stats">
          <span class="stat-badge">
            <i class="pi pi-file"></i>
            {{ filteredLogs.length }} files
          </span>
        </div>
      </div>
      <div class="header-actions">
        <div class="search-box">
          <i class="pi pi-search"></i>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search files..."
            class="search-input"
          />
        </div>
        <div class="view-toggle">
          <button
            :class="{ active: viewMode === 'tree' }"
            @click="viewMode = 'tree'"
            title="Tree View"
          >
            <i class="pi pi-sitemap"></i>
          </button>
          <button
            :class="{ active: viewMode === 'list' }"
            @click="viewMode = 'list'"
            title="List View"
          >
            <i class="pi pi-list"></i>
          </button>
        </div>
        <button @click="loadLogs" :disabled="loading" class="refresh-btn">
          <i class="pi pi-refresh" :class="{ spinning: loading }"></i>
        </button>
        <label class="upload-btn">
          <input type="file" multiple @change="handleUpload" :disabled="loading" />
          <i class="pi pi-upload"></i>
          Upload
        </label>
      </div>
    </header>

    <div
      class="page-content"
      :class="{ 'drag-over': dragOver }"
      @drop="handleDrop"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
    >
      <div v-if="error" class="message error-message">
        <i class="pi pi-exclamation-triangle"></i>
        {{ error }}
      </div>

      <div class="content-wrapper">
        <div class="file-panel">
          <div v-if="loading" class="loading">
            <i class="pi pi-spin pi-spinner"></i>
            <p>Loading files...</p>
          </div>
          <div v-else-if="filteredLogs.length === 0" class="empty">
            <div class="empty-icon">
              <i class="pi pi-inbox"></i>
            </div>
            <h3>{{ searchQuery ? 'No files found' : 'No files in bucket' }}</h3>
            <p>{{ searchQuery ? 'Try a different search term' : 'Upload files to get started' }}</p>
          </div>

          <div v-else-if="viewMode === 'tree'" class="file-tree">
            <FileTreeNode
              v-for="node in fileTree"
              :key="node.path"
              :node="node"
              :selected="selectedFile"
              @toggle="toggleFolder"
              @select="selectFile"
            />
          </div>

          <div v-else class="file-list">
            <div
              v-for="(log, index) in filteredLogs"
              :key="index"
              class="file-list-item"
              :class="{ selected: selectedFile === log }"
              @click="selectedFile = log"
            >
              <div class="file-list-icon">
                <i class="pi" :class="getFileIcon(log)"></i>
              </div>
              <div class="file-list-info">
                <div class="file-list-name">{{ log.split('/').pop() }}</div>
                <div class="file-list-path">{{ log }}</div>
              </div>
              <div class="file-list-actions">
                <button class="icon-btn" title="Download">
                  <i class="pi pi-download"></i>
                </button>
                <button class="icon-btn" title="Delete">
                  <i class="pi pi-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="selectedFile" class="preview-panel">
          <div class="preview-header">
            <div class="preview-title">
              <i class="pi pi-file"></i>
              <span>{{ selectedFile.split('/').pop() }}</span>
            </div>
            <div class="preview-actions">
              <button class="icon-btn" title="Download">
                <i class="pi pi-download"></i>
              </button>
              <button class="icon-btn" @click="selectedFile = null" title="Close">
                <i class="pi pi-times"></i>
              </button>
            </div>
          </div>
          <div class="preview-content">
            <div class="preview-path">{{ selectedFile }}</div>
            <pre class="preview-code">{{ fileContent }}</pre>
          </div>
        </div>
      </div>

      <div v-if="dragOver" class="drop-overlay">
        <div class="drop-content">
          <i class="pi pi-cloud-upload"></i>
          <h2>Drop files to upload</h2>
          <p>Release to upload files to S3</p>
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
  gap: 12px;
}

.stat-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background-color: var(--accent);
  color: white;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-box i {
  position: absolute;
  left: 12px;
  color: var(--text-muted);
  font-size: 14px;
}

.search-input {
  padding: 10px 16px 10px 36px;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  width: 250px;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  width: 300px;
}

.view-toggle {
  display: flex;
  gap: 4px;
  background-color: var(--bg-secondary);
  padding: 4px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.view-toggle button {
  padding: 8px 12px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.view-toggle button:hover {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
}

.view-toggle button.active {
  background-color: var(--accent);
  color: white;
}

.refresh-btn {
  padding: 10px 16px;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover {
  background-color: var(--bg-tertiary);
  border-color: var(--accent);
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.upload-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.upload-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

.upload-btn input[type="file"] {
  display: none;
}

.page-content {
  flex: 1;
  padding: 24px 32px;
  overflow: hidden;
  position: relative;
  transition: all 0.2s;
}

.page-content.drag-over {
  background-color: rgba(59, 130, 246, 0.05);
}

.message {
  padding: 14px 18px;
  border-radius: 8px;
  margin-bottom: 20px;
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

.content-wrapper {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  height: 100%;
}

.file-panel,
.preview-panel {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.file-panel {
  overflow-y: auto;
}

.loading,
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 40px;
  color: var(--text-secondary);
  height: 100%;
}

.loading i {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-icon {
  font-size: 72px;
  margin-bottom: 20px;
  opacity: 0.3;
}

.empty h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.empty p {
  margin: 0;
  font-size: 14px;
}

.file-tree,
.file-list {
  padding: 12px;
}

.file-list-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.file-list-item:hover {
  background-color: var(--bg-tertiary);
  border-color: var(--accent);
  transform: translateX(4px);
}

.file-list-item.selected {
  background-color: var(--accent);
  border-color: var(--accent);
  color: white;
}

.file-list-icon {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%);
  color: white;
  border-radius: 10px;
  font-size: 18px;
  flex-shrink: 0;
}

.file-list-info {
  flex: 1;
  min-width: 0;
}

.file-list-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  font-family: monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-list-path {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-list-actions {
  display: flex;
  gap: 6px;
}

.icon-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.icon-btn:hover {
  background-color: var(--bg-secondary);
  border-color: var(--accent);
  color: var(--accent);
}

.preview-panel {
  background-color: var(--bg-secondary);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--bg-tertiary);
}

.preview-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  color: var(--text-primary);
}

.preview-actions {
  display: flex;
  gap: 8px;
}

.preview-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.preview-path {
  font-size: 12px;
  color: var(--text-secondary);
  font-family: monospace;
  margin-bottom: 16px;
  padding: 8px 12px;
  background-color: var(--bg-primary);
  border-radius: 6px;
}

.preview-code {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-primary);
  background-color: var(--bg-primary);
  padding: 20px;
  border-radius: 8px;
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
}

.drop-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(59, 130, 246, 0.95);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  animation: fadeIn 0.2s;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.drop-content {
  text-align: center;
  color: white;
}

.drop-content i {
  font-size: 80px;
  margin-bottom: 20px;
  animation: bounce 0.6s infinite alternate;
}

@keyframes bounce {
  to { transform: translateY(-10px); }
}

.drop-content h2 {
  margin: 0 0 8px 0;
  font-size: 32px;
  font-weight: 700;
}

.drop-content p {
  margin: 0;
  font-size: 18px;
  opacity: 0.9;
}
</style>
