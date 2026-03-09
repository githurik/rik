/*
  # Add Analysis, Notifications, and Detection Results Tables

  1. New Tables
    - `analysis_results` - Stores frame analysis results
      - `id` (uuid, primary key)
      - `image_url` (text, URL to stored image)
      - `license_plate` (text, detected plate)
      - `plate_confidence` (numeric, 0-100)
      - `occupant_count` (integer, detected people)
      - `occupant_confidence` (numeric, 0-100)
      - `violations` (jsonb array, detected violations)
      - `analysis_metadata` (jsonb, raw analysis data)
      - `camera_id` (text, source camera)
      - `analyzed_at` (timestamp)
      - `created_at` (timestamp)

    - `notifications` - Stores admin notifications
      - `id` (uuid, primary key)
      - `type` (text, notification type)
      - `title` (text)
      - `message` (text)
      - `analysis_result_id` (uuid, foreign key)
      - `severity` (text, critical/high/medium/low)
      - `read` (boolean)
      - `created_at` (timestamp)

    - `uploaded_images` - Stores uploaded images for analysis
      - `id` (uuid, primary key)
      - `storage_path` (text)
      - `file_name` (text)
      - `file_size` (integer)
      - `uploaded_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policy for authenticated users to read notifications
    - Add policy for authenticated users to read analysis results
*/

CREATE TABLE IF NOT EXISTS analysis_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text,
  license_plate text,
  plate_confidence numeric DEFAULT 0,
  occupant_count integer DEFAULT 0,
  occupant_confidence numeric DEFAULT 0,
  violations jsonb DEFAULT '[]'::jsonb,
  analysis_metadata jsonb,
  camera_id text,
  analyzed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  title text NOT NULL,
  message text,
  analysis_result_id uuid REFERENCES analysis_results(id),
  severity text DEFAULT 'medium',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS uploaded_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path text NOT NULL,
  file_name text NOT NULL,
  file_size integer,
  uploaded_at timestamptz DEFAULT now()
);

ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read analysis results"
  ON analysis_results FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert analysis results"
  ON analysis_results FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read uploaded images"
  ON uploaded_images FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert uploaded images"
  ON uploaded_images FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX idx_analysis_results_created_at ON analysis_results(created_at DESC);
CREATE INDEX idx_analysis_results_license_plate ON analysis_results(license_plate);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_severity ON notifications(severity);
