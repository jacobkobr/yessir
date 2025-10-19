<script setup lang="ts">
interface FileNode {
  name: string
  path: string
  type: 'file' | 'folder'
  children?: FileNode[]
  size?: number
  expanded?: boolean
}

defineProps<{
  node: FileNode
  depth?: number
  selected: string | null
}>()

defineEmits<{
  toggle: [node: FileNode]
  select: [node: FileNode]
}>()

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
</script>

<template>
  <div
    v-if="node"
    class="tree-node"
    :style="{ paddingLeft: `${(depth || 0) * 20}px` }"
  >
    <div
      class="tree-node-content"
      :class="{ selected: selected === node.path, folder: node.type === 'folder' }"
      @click="node.type === 'folder' ? $emit('toggle', node) : $emit('select', node)"
    >
      <i
        v-if="node.type === 'folder'"
        class="pi folder-icon"
        :class="node.expanded ? 'pi-folder-open' : 'pi-folder'"
      ></i>
      <i
        v-else
        class="pi file-icon"
        :class="getFileIcon(node.name)"
      ></i>
      <span class="node-name">{{ node.name }}</span>
      <span v-if="node.type === 'folder' && node.children" class="node-count">
        {{ node.children.length }}
      </span>
    </div>

    <div v-if="node.type === 'folder' && node.expanded && node.children" class="tree-children">
      <FileTreeNode
        v-for="child in node.children"
        :key="child.path"
        :node="child"
        :depth="(depth || 0) + 1"
        :selected="selected"
        @toggle="$emit('toggle', $event)"
        @select="$emit('select', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.tree-node-content {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  user-select: none;
}

.tree-node-content:hover {
  background-color: var(--bg-tertiary);
}

.tree-node-content.selected {
  background-color: var(--accent);
  color: white;
}

.tree-node-content.folder {
  font-weight: 600;
}

.folder-icon,
.file-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.node-name {
  flex: 1;
  font-size: 14px;
  font-family: 'Courier New', monospace;
}

.node-count {
  font-size: 11px;
  padding: 2px 8px;
  background-color: var(--bg-primary);
  border-radius: 10px;
  font-weight: 600;
}

.tree-children {
  border-left: 1px solid var(--border-color);
  margin-left: 10px;
}
</style>
