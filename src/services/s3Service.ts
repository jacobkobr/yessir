import { supabase } from './supabaseClient'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export async function fetchLogs(): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/logs`)
  if (!response.ok) throw new Error('Failed to fetch logs')
  return response.json()
}

export async function uploadLog(file: File): Promise<void> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_BASE_URL}/logs`, {
    method: 'POST',
    body: formData
  })

  if (!response.ok) throw new Error('Failed to upload log')

  await supabase.from('log_files').insert([{
    file_name: file.name,
    file_path: `logs/${file.name}`,
    file_size: file.size,
    source_device: null,
    metadata: {}
  }])
}
