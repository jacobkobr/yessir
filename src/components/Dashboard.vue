<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { fetchLogs } from '../services/s3Service'
import { getParameter } from '../services/ssmService'
import { getState } from '../services/dynamoService'

type View = 'dashboard' | 'logs' | 'config' | 'state'

const emit = defineEmits<{
  navigate: [view: View]
}>()

const searchQuery = ref('')
const recentLogs = ref<string[]>([])
const configSize = ref(0)
const stateEntries = ref(0)
const totalFiles = ref(0)
const loading = ref(false)
const showAddServerDialog = ref(false)
const newServer = ref({
  name: '',
  host: '',
  port: 22
})

const activities = ref<Array<{ icon: string; text: string; time: string; color: string }>>([])

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    emit('navigate', 'logs')
  }
}

const loadDashboardData = async () => {
  loading.value = true
  try {
    const [logs, config, state] = await Promise.all([
      fetchLogs().catch(() => []),
      getParameter().catch(() => ''),
      getState().catch(() => ({}))
    ])

    recentLogs.value = logs.slice(0, 5)
    totalFiles.value = logs.length
    configSize.value = config.length
    stateEntries.value = Object.keys(state).length

    activities.value = [
      { icon: 'pi-file-edit', text: 'Log file uploaded', time: '2 minutes ago', color: '#3b82f6' },
      { icon: 'pi-cog', text: 'Config updated', time: '15 minutes ago', color: '#8b5cf6' },
      { icon: 'pi-database', text: 'State synchronized', time: '1 hour ago', color: '#10b981' },
      { icon: 'pi-server', text: 'Server connected', time: '2 hours ago', color: '#f59e0b' },
    ]
  } catch (error) {
    console.error('Error loading dashboard data:', error)
  } finally {
    loading.value = false
  }
}

const formatFileName = (path: string) => {
  const parts = path.split('/')
  return parts[parts.length - 1] || path
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const openAddServerDialog = () => {
  showAddServerDialog.value = true
}

const closeAddServerDialog = () => {
  showAddServerDialog.value = false
  newServer.value = {
    name: '',
    host: '',
    port: 22
  }
}

const saveServer = async () => {
  try {
    const currentConfig = await getParameter()
    let config: any

    try {
      config = JSON.parse(currentConfig)
    } catch {
      config = { servers: [] }
    }

    if (!config.servers) {
      config.servers = []
    }

    config.servers.push({
      name: newServer.value.name,
      host: newServer.value.host,
      port: newServer.value.port
    })

    closeAddServerDialog()
  } catch (error) {
    console.error('Error saving server:', error)
  }
}

const systemHealth = computed(() => {
  if (totalFiles.value > 50) return { status: 'Excellent', color: '#10b981', percent: 95 }
  if (totalFiles.value > 20) return { status: 'Good', color: '#3b82f6', percent: 75 }
  if (totalFiles.value > 5) return { status: 'Fair', color: '#f59e0b', percent: 50 }
  return { status: 'Low Activity', color: '#64748b', percent: 25 }
})

onMounted(() => {
  loadDashboardData()
})
</script>

<template>
  <div class="dashboard">
    <div class="content">
      <div class="welcome-section">
        <div class="welcome-text">
          <h1>Welcome to AWS Management Console</h1>
          <p>Monitor and manage your S3 buckets, SSM parameters, and DynamoDB state</p>
        </div>
        <div class="system-health">
          <div class="health-indicator" :style="{ '--health-color': systemHealth.color }">
            <div class="health-ring">
              <svg viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="var(--border-color)"
                  stroke-width="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="var(--health-color)"
                  stroke-width="3"
                  :stroke-dasharray="`${systemHealth.percent}, 100`"
                  stroke-linecap="round"
                />
              </svg>
              <div class="health-center">
                <i class="pi pi-check-circle"></i>
              </div>
            </div>
            <div class="health-text">
              <div class="health-status">{{ systemHealth.status }}</div>
              <div class="health-label">System Health</div>
            </div>
          </div>
        </div>
      </div>

      <div class="search-section">
        <div class="search-bar-large">
          <i class="pi pi-search"></i>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search across all AWS resources..."
            @keyup.enter="handleSearch"
          />
          <button class="search-btn" @click="handleSearch">
            Search
          </button>
        </div>
      </div>

      <div class="metrics-grid">
        <div class="metric-card" @click="emit('navigate', 'logs')">
          <div class="metric-icon" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);">
            <i class="pi pi-folder-open"></i>
          </div>
          <div class="metric-content">
            <div class="metric-value">{{ totalFiles }}</div>
            <div class="metric-label">Files in S3</div>
            <div class="metric-trend positive">
              <i class="pi pi-arrow-up"></i>
              12% from last month
            </div>
          </div>
        </div>

        <div class="metric-card" @click="emit('navigate', 'config')">
          <div class="metric-icon" style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);">
            <i class="pi pi-cog"></i>
          </div>
          <div class="metric-content">
            <div class="metric-value">{{ formatBytes(configSize) }}</div>
            <div class="metric-label">Config Size</div>
            <div class="metric-trend neutral">
              <i class="pi pi-minus"></i>
              Stable
            </div>
          </div>
        </div>

        <div class="metric-card" @click="emit('navigate', 'state')">
          <div class="metric-icon" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
            <i class="pi pi-database"></i>
          </div>
          <div class="metric-content">
            <div class="metric-value">{{ stateEntries }}</div>
            <div class="metric-label">State Entries</div>
            <div class="metric-trend positive">
              <i class="pi pi-arrow-up"></i>
              5 new entries
            </div>
          </div>
        </div>

        <div class="metric-card" @click="openAddServerDialog">
          <div class="metric-icon" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
            <i class="pi pi-server"></i>
          </div>
          <div class="metric-content">
            <div class="metric-value">Active</div>
            <div class="metric-label">Server Status</div>
            <div class="metric-trend positive">
              <i class="pi pi-check"></i>
              All systems operational
            </div>
          </div>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="panel recent-logs-panel">
          <div class="panel-header">
            <h3><i class="pi pi-clock"></i> Recent Activity</h3>
            <button class="link-button" @click="emit('navigate', 'logs')">
              View All <i class="pi pi-arrow-right"></i>
            </button>
          </div>
          <div class="panel-content">
            <div v-if="loading" class="loading-state">
              <i class="pi pi-spin pi-spinner"></i>
            </div>
            <div v-else-if="recentLogs.length === 0" class="empty-state">
              <i class="pi pi-inbox"></i>
              <p>No recent files</p>
            </div>
            <div v-else class="activity-list">
              <div
                v-for="(log, index) in recentLogs"
                :key="index"
                class="activity-item"
                @click="emit('navigate', 'logs')"
              >
                <div class="activity-icon">
                  <i class="pi pi-file"></i>
                </div>
                <div class="activity-details">
                  <div class="activity-title">{{ formatFileName(log) }}</div>
                  <div class="activity-subtitle">{{ log }}</div>
                </div>
                <div class="activity-time">
                  <i class="pi pi-clock"></i>
                  {{ index * 5 + 2 }}m ago
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="panel activity-panel">
          <div class="panel-header">
            <h3><i class="pi pi-history"></i> System Activity</h3>
          </div>
          <div class="panel-content">
            <div class="timeline">
              <div
                v-for="(activity, index) in activities"
                :key="index"
                class="timeline-item"
              >
                <div class="timeline-marker" :style="{ background: activity.color }">
                  <i class="pi" :class="activity.icon"></i>
                </div>
                <div class="timeline-content">
                  <div class="timeline-text">{{ activity.text }}</div>
                  <div class="timeline-time">{{ activity.time }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="quick-actions">
        <h3><i class="pi pi-bolt"></i> Quick Actions</h3>
        <div class="actions-row">
          <button class="action-btn primary" @click="emit('navigate', 'logs')">
            <i class="pi pi-upload"></i>
            <span>Upload Files</span>
          </button>
          <button class="action-btn" @click="openAddServerDialog">
            <i class="pi pi-plus"></i>
            <span>Add Server</span>
          </button>
          <button class="action-btn" @click="emit('navigate', 'config')">
            <i class="pi pi-pencil"></i>
            <span>Edit Config</span>
          </button>
          <button class="action-btn" @click="loadDashboardData">
            <i class="pi pi-refresh"></i>
            <span>Refresh All</span>
          </button>
        </div>
      </div>
    </div>

    <div v-if="showAddServerDialog" class="dialog-overlay" @click.self="closeAddServerDialog">
      <div class="dialog">
        <div class="dialog-header">
          <h3><i class="pi pi-server"></i> Add New Server</h3>
          <button class="close-button" @click="closeAddServerDialog">
            <i class="pi pi-times"></i>
          </button>
        </div>
        <div class="dialog-content">
          <div class="form-field">
            <label>Server Name</label>
            <input v-model="newServer.name" type="text" placeholder="e.g., Production Server" />
          </div>
          <div class="form-field">
            <label>Host</label>
            <input v-model="newServer.host" type="text" placeholder="e.g., 192.168.1.100" />
          </div>
          <div class="form-field">
            <label>Port</label>
            <input v-model.number="newServer.port" type="number" placeholder="22" />
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
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
  overflow-y: auto;
}

.content {
  flex: 1;
  padding: 40px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.welcome-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  padding: 32px;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.welcome-text h1 {
  margin: 0 0 8px 0;
  font-size: 32px;
  font-weight: 800;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.welcome-text p {
  margin: 0;
  font-size: 16px;
  color: var(--text-secondary);
}

.system-health {
  display: flex;
  gap: 16px;
}

.health-indicator {
  display: flex;
  align-items: center;
  gap: 16px;
}

.health-ring {
  position: relative;
  width: 80px;
  height: 80px;
}

.health-ring svg {
  transform: rotate(-90deg);
  width: 100%;
  height: 100%;
}

.health-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 28px;
  color: var(--health-color);
}

.health-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.health-status {
  font-size: 24px;
  font-weight: 700;
  color: var(--health-color);
}

.health-label {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.search-section {
  margin-bottom: 40px;
}

.search-bar-large {
  position: relative;
  display: flex;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 8px 8px 8px 24px;
  transition: all 0.3s;
}

.search-bar-large:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.search-bar-large i {
  color: var(--text-muted);
  font-size: 20px;
  margin-right: 16px;
}

.search-bar-large input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 16px;
  outline: none;
  padding: 12px 0;
}

.search-btn {
  padding: 12px 32px;
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.search-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.metric-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  gap: 20px;
  cursor: pointer;
  transition: all 0.3s;
}

.metric-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
  border-color: rgba(255, 255, 255, 0.2);
}

.metric-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: white;
  flex-shrink: 0;
}

.metric-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-value {
  font-size: 32px;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1;
}

.metric-label {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

.metric-trend {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  margin-top: 8px;
}

.metric-trend.positive {
  color: #10b981;
}

.metric-trend.neutral {
  color: var(--text-secondary);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 40px;
}

@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

.panel {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.panel-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 10px;
}

.link-button {
  background: none;
  border: none;
  color: var(--accent);
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  transition: all 0.2s;
  font-weight: 600;
}

.link-button:hover {
  background-color: rgba(59, 130, 246, 0.1);
}

.panel-content {
  padding: 24px;
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

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.activity-item:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--accent);
  transform: translateX(4px);
}

.activity-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%);
  color: white;
  border-radius: 12px;
  font-size: 20px;
  flex-shrink: 0;
}

.activity-details {
  flex: 1;
  min-width: 0;
}

.activity-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  font-family: monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.activity-subtitle {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.activity-time {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-muted);
  white-space: nowrap;
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.timeline-item {
  display: flex;
  gap: 16px;
}

.timeline-marker {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;
  flex-shrink: 0;
}

.timeline-content {
  flex: 1;
  padding-top: 4px;
}

.timeline-text {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.timeline-time {
  font-size: 12px;
  color: var(--text-muted);
}

.quick-actions {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
}

.quick-actions h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 10px;
}

.actions-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: var(--text-primary);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--accent);
  transform: translateY(-2px);
}

.action-btn.primary {
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%);
  color: white;
  border: none;
}

.action-btn.primary:hover {
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.dialog {
  background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.dialog-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 10px;
}

.close-button {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.1);
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
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.form-field input[type="text"],
.form-field input[type="number"] {
  width: 100%;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.dialog-footer button {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.dialog-footer button:not(.primary) {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.dialog-footer button.primary {
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%);
  color: white;
  border: none;
}
</style>
