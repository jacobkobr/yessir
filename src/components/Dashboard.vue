<script setup lang="ts">
import { ref } from 'vue'

type View = 'dashboard' | 'logs' | 'config' | 'state'

const emit = defineEmits<{
  navigate: [view: View]
}>()

const searchQuery = ref('')

const handleSearch = () => {
  console.log('Searching for:', searchQuery.value)
}
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

      <div class="actions-grid">
        <button class="action-card" @click="emit('navigate', 'config')">
          <i class="pi pi-cog action-icon"></i>
          <h3>Server Config</h3>
          <p>Modify server configuration parameters</p>
        </button>

        <button class="action-card" @click="emit('navigate', 'state')">
          <i class="pi pi-database action-icon"></i>
          <h3>State Data</h3>
          <p>Manage application state in DynamoDB</p>
        </button>

        <button class="action-card" @click="emit('navigate', 'logs')">
          <i class="pi pi-folder action-icon"></i>
          <h3>S3 File Tree</h3>
          <p>View and manage log files in S3</p>
        </button>
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
  margin-bottom: 48px;
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

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.action-card {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 32px 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.action-card:hover {
  background-color: var(--bg-tertiary);
  border-color: var(--accent);
  transform: translateY(-2px);
}

.action-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: var(--accent-light);
}

.action-card h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.action-card p {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
}
</style>
