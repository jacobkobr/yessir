<script setup lang="ts">
import { ref } from 'vue'

type View = 'dashboard' | 'logs' | 'config' | 'state'

defineProps<{
  currentView: View
}>()

const emit = defineEmits<{
  navigate: [view: View]
}>()

const menuItems = ref([
  {
    label: 'Dashboard',
    icon: 'pi pi-home',
    command: () => emit('navigate', 'dashboard')
  },
  {
    label: 'S3 File Tree',
    icon: 'pi pi-folder',
    command: () => emit('navigate', 'logs')
  },
  {
    label: 'Server Config',
    icon: 'pi pi-cog',
    command: () => emit('navigate', 'config')
  },
  {
    label: 'State Data',
    icon: 'pi pi-database',
    command: () => emit('navigate', 'state')
  }
])
</script>

<template>
  <aside class="sidebar">
    <nav class="nav">
      <button
        v-for="item in menuItems"
        :key="item.label"
        class="nav-item"
        :class="{ active: currentView === item.command?.toString().split('\'')[1] }"
        @click="item.command?.()"
      >
        <i :class="item.icon"></i>
        <span>{{ item.label }}</span>
      </button>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 240px;
  background-color: var(--sidebar-bg);
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border-color);
}

.nav {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: transparent;
  color: var(--text-secondary);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
  font-size: 15px;
}

.nav-item:hover {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
}

.nav-item.active {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
}

.nav-item i {
  color: var(--text-muted);
  font-size: 16px;
  width: 20px;
}

.nav-item.active i {
  color: var(--accent);
}
</style>
