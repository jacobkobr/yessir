<script setup lang="ts">
import { ref } from 'vue'
import Sidebar from './components/Sidebar.vue'
import Dashboard from './components/Dashboard.vue'
import LogViewer from './components/LogViewer.vue'
import ConfigManager from './components/ConfigManager.vue'
import StateManager from './components/StateManager.vue'

type View = 'dashboard' | 'logs' | 'config' | 'state'

const currentView = ref<View>('dashboard')

const setView = (view: View) => {
  currentView.value = view
}
</script>

<template>
  <div class="app-layout">
    <Sidebar :current-view="currentView" @navigate="setView" />

    <main class="main-content">
      <Dashboard v-if="currentView === 'dashboard'" @navigate="setView" />
      <LogViewer v-else-if="currentView === 'logs'" />
      <ConfigManager v-else-if="currentView === 'config'" />
      <StateManager v-else-if="currentView === 'state'" />
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  background-color: var(--bg-primary);
}
</style>
