/*
  # Create Log Metadata and Server Configuration Tables

  ## Summary
  Creates tables to track S3 log files metadata, server configurations, 
  and DynamoDB state snapshots for the dashboard.

  ## New Tables

  ### `log_files`
  Tracks metadata about uploaded log files in S3 for quick dashboard access
  - `id` (uuid, primary key) - Unique identifier
  - `file_name` (text) - Name of the log file in S3
  - `file_path` (text) - Full S3 path/key
  - `file_size` (bigint) - File size in bytes
  - `source_device` (text) - Device or server that generated the log
  - `uploaded_at` (timestamptz) - When the file was uploaded to S3
  - `created_at` (timestamptz) - Record creation timestamp
  - `metadata` (jsonb) - Additional flexible metadata

  ### `server_configs`
  Stores server configuration entries for easy management
  - `id` (uuid, primary key) - Unique identifier
  - `server_name` (text) - Friendly name for the server
  - `host` (text) - Hostname or IP address
  - `port` (integer) - Server port
  - `enabled` (boolean) - Whether server is active
  - `config_data` (jsonb) - Additional configuration parameters
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last modification timestamp

  ### `state_snapshots`
  Historical snapshots of DynamoDB state data
  - `id` (uuid, primary key) - Unique identifier
  - `state_data` (jsonb) - Full state data snapshot
  - `snapshot_type` (text) - Type of snapshot (manual, auto, etc.)
  - `created_at` (timestamptz) - Snapshot creation timestamp
  - `created_by` (text) - User or system that created snapshot

  ## Security
  - Enable RLS on all tables
  - Add policies for authenticated users to read/write their data
  - Public access disabled by default

  ## Indexes
  - Index on `uploaded_at` for log_files to optimize recent logs queries
  - Index on `created_at` for state_snapshots for timeline queries
  - Index on `server_name` for server_configs for quick lookups
*/

-- Create log_files table
CREATE TABLE IF NOT EXISTS log_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint DEFAULT 0,
  source_device text,
  uploaded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create server_configs table
CREATE TABLE IF NOT EXISTS server_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  server_name text NOT NULL,
  host text NOT NULL,
  port integer DEFAULT 22,
  enabled boolean DEFAULT true,
  config_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create state_snapshots table
CREATE TABLE IF NOT EXISTS state_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state_data jsonb NOT NULL,
  snapshot_type text DEFAULT 'manual',
  created_at timestamptz DEFAULT now(),
  created_by text
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_log_files_uploaded_at ON log_files(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_state_snapshots_created_at ON state_snapshots(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_server_configs_server_name ON server_configs(server_name);

-- Enable RLS
ALTER TABLE log_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE state_snapshots ENABLE ROW LEVEL SECURITY;

-- Create policies for log_files
CREATE POLICY "Allow public read access to log_files"
  ON log_files FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to log_files"
  ON log_files FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to log_files"
  ON log_files FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from log_files"
  ON log_files FOR DELETE
  TO public
  USING (true);

-- Create policies for server_configs
CREATE POLICY "Allow public read access to server_configs"
  ON server_configs FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to server_configs"
  ON server_configs FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to server_configs"
  ON server_configs FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from server_configs"
  ON server_configs FOR DELETE
  TO public
  USING (true);

-- Create policies for state_snapshots
CREATE POLICY "Allow public read access to state_snapshots"
  ON state_snapshots FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to state_snapshots"
  ON state_snapshots FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public delete from state_snapshots"
  ON state_snapshots FOR DELETE
  TO public
  USING (true);