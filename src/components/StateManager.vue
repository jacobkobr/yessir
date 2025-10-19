<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getState, updateState } from '../services/dynamoService'
import { supabase, type StateSnapshot } from '../services/supabaseClient'

interface StateData {
  [key: string]: string
}

const state = ref<StateData>({})
const loading = ref(false)
const error = ref('')
const saved = ref(false)
const snapshots = ref<StateSnapshot[]>([])
const showSnapshotDialog = ref(false)
const snapshotName = ref('')

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

const loadSnapshots = async () => {
  try {
    const { data, error } = await supabase
      .from('state_snapshots')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) throw error
    snapshots.value = data || []
  } catch (e) {
    console.error('Error loading snapshots:', e)
  }
}

const createSnapshot = async () => {
  try {
    const { error } = await supabase
      .from('state_snapshots')
      .insert([{
        state_data: state.value,
        snapshot_type: 'manual',
        created_by: snapshotName.value || 'User'
      }])

    if (error) throw error
    showSnapshotDialog.value = false
    snapshotName.value = ''
    await loadSnapshots()
  } catch (e) {
    console.error('Error creating snapshot:', e)
  }
}

const restoreSnapshot = async (snapshot: StateSnapshot) => {
  if (!confirm('Are you sure you want to restore this snapshot? This will overwrite the current state.')) {
    return
  }

  try {
    state.value = snapshot.state_data
    await handleUpdate()
  } catch (e) {
    error.value = 'Failed to restore snapshot'
  }
}

const stateEntries = computed(() => Object.keys(state.value).length)
const totalChars = computed(() => JSON.stringify(state.value).length)

const formatDate = (timestamp: string) => {
  const date = new Date(timestamp)
  return date.toLocaleString()
}

onMounted(() => {
  loadState()
  loadSnapshots()
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
        <button @click="showSnapshotDialog = true" :disabled="loading || stateEntries === 0">
          <i class="pi pi-camera"></i>
          Create Snapshot
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

      <div class="content-grid">
        <div class="main-section">
          <div class="stats-cards">
            <div class="stat-card">
              <div class="stat-icon"><i class="pi pi-key"></i></div>
              <div class="stat-content">
                <div class="stat-value">{{ stateEntries }}</div>
                <div class="stat-label">State Entries</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon"><i class="pi pi-file"></i></div>
              <div class="stat-content">
                <div class="stat-value">{{ totalChars }}</div>
                <div class="stat-label">Total Characters</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon"><i class="pi pi-history"></i></div>
              <div class="stat-content">
                <div class="stat-value">{{ snapshots.length }}</div>
                <div class="stat-label">Snapshots</div>
              </div>
            </div>
          </div>

          <div class="section-card">
            <h3 class="section-title">Current State</h3>
            <div v-if="loading" class="loading">Loading state data...</div>
            <div v-else-if="stateEntries === 0" class="empty">No state data available</div>
            <div v-else class="state-form">
              <div v-for="key in Object.keys(state)" :key="key" class="form-field">
                <label class="field-label">{{ key }}</label>
                <input v-model="state[key]" type="text" class="field-input" />
              </div>
            </div>
          </div>
        </div>

        <div class="sidebar-section">
          <div class="section-card">
            <h3 class="section-title">Snapshot History</h3>
            <div v-if="snapshots.length === 0" class="empty-small">
              No snapshots yet
            </div>
            <div v-else class="snapshots-list">
              <div
                v-for="snapshot in snapshots"
                :key="snapshot.id"
                class="snapshot-item"
                @click="restoreSnapshot(snapshot)"
              >
                <div class="snapshot-header">
                  <i class="pi pi-history"></i>
                  <span class="snapshot-type">{{ snapshot.snapshot_type }}</span>
                </div>
                <div class="snapshot-date">{{ formatDate(snapshot.created_at) }}</div>
                <div v-if="snapshot.created_by" class="snapshot-by">by {{ snapshot.created_by }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showSnapshotDialog" class="dialog-overlay" @click.self="showSnapshotDialog = false">
      <div class="dialog">
        <div class="dialog-header">
          <h3>Create State Snapshot</h3>
          <button class="close-button" @click="showSnapshotDialog = false">
            <i class="pi pi-times"></i>
          </button>
        </div>
        <div class="dialog-content">
          <p class="dialog-description">
            Create a snapshot of the current state for backup and restore purposes.
          </p>
          <div class="form-field">
            <label>Snapshot Name (optional)</label>
            <input v-model="snapshotName" type="text" placeholder="e.g., Before config update" />
          </div>
        </div>
        <div class="dialog-footer">
          <button @click="showSnapshotDialog = false">Cancel</button>
          <button class="primary" @click="createSnapshot">Create Snapshot</button>
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

.content-grid {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 24px;
}

@media (max-width: 968px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--accent);
  color: white;
  border-radius: 8px;
  font-size: 24px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.section-card {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 24px;
}

.section-title {
  margin: 0 0 20px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.loading,
.empty {
  text-align: center;
  color: var(--text-secondary);
  padding: 48px;
  font-size: 15px;
}

.empty-small {
  text-align: center;
  color: var(--text-secondary);
  padding: 32px 16px;
  font-size: 14px;
}

.state-form {
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
  background-color: var(--bg-primary);
}

.snapshots-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.snapshot-item {
  padding: 12px;
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.snapshot-item:hover {
  background-color: var(--bg-tertiary);
  border-color: var(--accent);
}

.snapshot-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.snapshot-header i {
  color: var(--accent);
}

.snapshot-type {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  text-transform: capitalize;
}

.snapshot-date {
  font-size: 12px;
  color: var(--text-secondary);
}

.snapshot-by {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 4px;
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

.dialog-description {
  margin: 0 0 20px 0;
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
}
</style>
