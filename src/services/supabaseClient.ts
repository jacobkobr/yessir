import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface LogFile {
  id: string
  file_name: string
  file_path: string
  file_size: number
  source_device: string | null
  uploaded_at: string
  created_at: string
  metadata: Record<string, any>
}

export interface ServerConfig {
  id: string
  server_name: string
  host: string
  port: number
  enabled: boolean
  config_data: Record<string, any>
  created_at: string
  updated_at: string
}

export interface StateSnapshot {
  id: string
  state_data: Record<string, any>
  snapshot_type: string
  created_at: string
  created_by: string | null
}
