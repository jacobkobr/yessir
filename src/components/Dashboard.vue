<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase, type LogFile } from '../services/supabaseClient'

type View = 'dashboard' | 'logs' | 'config' | 'state'

const emit = defineEmits<{
  navigate: [view: View]
}>()

const searchQuery = ref('')
const recentLogs = ref<LogFile[]>([])
const loading = ref(false)
const showAddServerDialog = ref(false)
const newServer = ref({
  server_name: '',
  host: '',
  port: 22,
  enabled: true,
  config_data: {}
})

const handleSearch = () => {
  console.log('Searching for:', searchQuery.value)
}

const loadRecentLogs = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('log_files')
      .select('*')
      .order('uploaded_at', { ascending: false })
      .limit(5)

    if (error) throw error
    recentLogs.value = data || []
  } catch (error) {
    console.error('Error loading recent logs:', error)
  } finally {
    loading.value = false
  }
}

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

const viewLogDetails = () => {
  emit('navigate', 'logs')
}

const openAddServerDialog = () => {
  showAddServerDialog.value = true
}

const closeAddServerDialog = () => {
  showAddServerDialog.value = false
  newServer.value = {
    server_name: '',
    host: '',
    port: 22,
    enabled: true,
    config_data: {}
  }
}

const saveServer = async () => {
  try {
    const { error } = await supabase
      .from('server_configs')
      .insert([newServer.value])

    if (error) throw error
    closeAddServerDialog()
  } catch (error) {
    console.error('Error saving server:', error)
  }
}

onMounted(() => {
  loadRecentLogs()
})
</script>

<template>
  <div class="dashboard">
    <div class="content">
      <div class="search-section">
        <h2>Search Device</h2>
        <div class="search-bar">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Enter device name or ID..."
            @keyup.enter="handleSearch"
          />
          <button class="primary" @click="handleSearch">
            <i class="pi pi-search"></i>
            Search
          </button>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="panel recent-logs-panel">
          <div class="panel-header">
            <h3><i class="pi pi-clock"></i> Recent Logs</h3>
            <button class="link-button" @click="emit('navigate', 'logs')">
              View All <i class="pi pi-arrow-right"></i>
            </button>
          </div>
          <div class="panel-content">
            <div v-if="loading" class="loading-state">
              <i class="pi pi-spin pi-spinner"></i> Loading...
            </div>
            <div v-else-if="recentLogs.length === 0" class="empty-state">
              <i class="pi pi-inbox"></i>
              <p>No recent logs</p>
            </div>
            <div v-else class="logs-list">
              <div
                v-for="log in recentLogs"
                :key="log.id"
                class="log-item"
                @click="viewLogDetails"
              >
                <div class="log-icon">
                  <i class="pi pi-file"></i>
                </div>
                <div class="log-details">
                  <div class="log-name">{{ log.file_name }}</div>
                  <div class="log-meta">
                    <span v-if="log.source_device" class="device-tag">
                      <i class="pi pi-server"></i> {{ log.source_device }}
                    </span>
                    <span class="file-size">{{ formatFileSize(log.file_size) }}</span>
                  </div>
                </div>
                <div class="log-timestamp">{{ formatTimestamp(log.uploaded_at) }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="panel quick-actions-panel">
          <div class="panel-header">
            <h3><i class="pi pi-bolt"></i> Quick Actions</h3>
          </div>
          <div class="panel-content">
            <button class="action-button" @click="openAddServerDialog">
              <i class="pi pi-plus-circle"></i>
              <span>Add Server</span>
            </button>
            <button class="action-button" @click="emit('navigate', 'config')">
              <i class="pi pi-cog"></i>
              <span>Configure Server</span>
            </button>
            <button class="action-button" @click="emit('navigate', 'state')">
              <i class="pi pi-save"></i>
              <span>Save State Snapshot</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showAddServerDialog" class="dialog-overlay" @click.self="closeAddServerDialog">
      <div class="dialog">
        <div class="dialog-header">
          <h3>Add New Server</h3>
          <button class="close-button" @click="closeAddServerDialog">
            <i class="pi pi-times"></i>
          </button>
        </div>
        <div class="dialog-content">
          <div class="form-field">
            <label>Server Name</label>
            <input v-model="newServer.server_name" type="text" placeholder="e.g., Production Server" />
          </div>
          <div class="form-field">
            <label>Host</label>
            <input v-model="newServer.host" type="text" placeholder="e.g., 192.168.1.100" />
          </div>
          <div class="form-field">
            <label>Port</label>
            <input v-model.number="newServer.port" type="number" placeholder="22" />
          </div>
          <div class="form-field checkbox-field">
            <label>
              <input v-model="newServer.enabled" type="checkbox" />
              <span>Enable this server</span>
            </label>
          </div>
        </div>
        <div class="dialog-footer">
          <button @click="closeAddServerDialog">Cancel</button>
          <button class="primary" @click="saveServer">Add Server</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.content {
  flex: 1;
  padding: 32px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.search-section {
  margin-bottom: 32px;
}

.search-section h2 {
  margin: 0 0 16px 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.search-bar {
  display: flex;
  gap: 12px;
  max-width: 600px;
}

.search-bar input {
  flex: 1;
}

.search-bar button {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}

@media (max-width: 968px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

.panel {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--bg-tertiary);
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.link-button {
  background: none;
  border: none;
  color: var(--accent);
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  transition: color 0.2s;
}

.link-button:hover {
  color: var(--accent-hover);
}

.panel-content {
  padding: 20px;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 48px 20px;
  color: var(--text-secondary);
}

.empty-state i {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.3;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

.logs-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.log-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.log-item:hover {
  background-color: var(--bg-tertiary);
  border-color: var(--accent);
}

.log-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--accent);
  color: white;
  border-radius: 6px;
  flex-shrink: 0;
}

.log-details {
  flex: 1;
  min-width: 0;
}

.log-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: monospace;
}

.log-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}

.device-tag {
  display: flex;
  align-items: center;
  gap: 4px;
}

.log-timestamp {
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 16px;
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 12px;
  text-align: left;
}

.action-button:last-child {
  margin-bottom: 0;
}

.action-button:hover {
  background-color: var(--bg-tertiary);
  border-color: var(--accent);
}

.action-button i {
  font-size: 20px;
  color: var(--accent);
}

.action-button span {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background-color: var(--bg-secondary);
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.close-button {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 18px;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.close-button:hover {
  color: var(--text-primary);
}

.dialog-content {
  padding: 24px;
}

.form-field {
  margin-bottom: 20px;
}

.form-field:last-child {
  margin-bottom: 0;
}

.form-field label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.form-field input[type="text"],
.form-field input[type="number"] {
  width: 100%;
}

.checkbox-field label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-field input[type="checkbox"] {
  width: auto;
  cursor: pointer;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
}
</style>
