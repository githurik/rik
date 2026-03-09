/*
  # Intelligent Road Safety Compliance System Database

  ## Overview
  This migration creates the complete database schema for the AI-powered vehicle monitoring
  and automated alert system for road safety compliance in Kenya.

  ## Tables Created

  ### 1. vehicles
  Stores registered vehicle information and compliance status
  - `id` (uuid, primary key) - Unique vehicle identifier
  - `license_plate` (text, unique) - Vehicle registration number (e.g., KBE 100A)
  - `owner_name` (text) - Vehicle owner's full name
  - `owner_phone` (text) - Contact phone number for SMS alerts
  - `owner_email` (text, optional) - Email for notifications
  - `vehicle_type` (text) - Type of vehicle (sedan, matatu, truck, etc.)
  - `vehicle_capacity` (integer) - Maximum allowed occupants
  - `license_expiry_date` (date) - When vehicle license expires
  - `inspection_expiry_date` (date) - When inspection certificate expires
  - `is_active` (boolean) - Whether vehicle is actively registered
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. violations
  Records all detected safety violations
  - `id` (uuid, primary key) - Unique violation identifier
  - `vehicle_id` (uuid, foreign key) - Reference to vehicles table
  - `license_plate` (text) - Quick reference to plate number
  - `violation_type` (text) - Type: expired_license, overdue_inspection, overcrowding, etc.
  - `violation_date` (timestamptz) - When violation occurred
  - `occupant_count` (integer, optional) - Number of occupants detected
  - `confidence_score` (numeric, optional) - AI detection confidence (0-1)
  - `image_url` (text, optional) - Screenshot/evidence URL
  - `location` (text, optional) - Where violation was detected
  - `status` (text) - Status: pending, resolved, dismissed
  - `notes` (text, optional) - Additional information
  - `created_at` (timestamptz) - Record creation timestamp

  ### 3. alerts
  Tracks all alerts sent to vehicle owners and authorities
  - `id` (uuid, primary key) - Unique alert identifier
  - `violation_id` (uuid, foreign key) - Reference to violations table
  - `recipient_phone` (text) - Phone number alert was sent to
  - `recipient_email` (text, optional) - Email if applicable
  - `alert_type` (text) - Type: sms, email, system
  - `message` (text) - Alert message content
  - `status` (text) - Status: pending, sent, failed, delivered
  - `sent_at` (timestamptz, optional) - When alert was sent
  - `created_at` (timestamptz) - Record creation timestamp

  ### 4. system_stats
  Aggregated statistics for dashboard analytics
  - `id` (uuid, primary key) - Unique stat identifier
  - `date` (date, unique) - Date of statistics
  - `total_vehicles_scanned` (integer) - Vehicles processed
  - `total_violations` (integer) - Violations detected
  - `total_alerts_sent` (integer) - Alerts dispatched
  - `avg_confidence_score` (numeric) - Average AI confidence
  - `created_at` (timestamptz) - Record creation timestamp

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Policies allow authenticated users full access (suitable for admin dashboard)
  - Public access restricted for data protection compliance

  ## Indexes
  - License plate lookups optimized
  - Violation date queries optimized
  - Foreign key relationships indexed
*/

-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_plate text UNIQUE NOT NULL,
  owner_name text NOT NULL,
  owner_phone text NOT NULL,
  owner_email text,
  vehicle_type text NOT NULL DEFAULT 'sedan',
  vehicle_capacity integer NOT NULL DEFAULT 5,
  license_expiry_date date NOT NULL,
  inspection_expiry_date date NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create violations table
CREATE TABLE IF NOT EXISTS violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE,
  license_plate text NOT NULL,
  violation_type text NOT NULL,
  violation_date timestamptz DEFAULT now(),
  occupant_count integer,
  confidence_score numeric(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  image_url text,
  location text,
  status text DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  violation_id uuid REFERENCES violations(id) ON DELETE CASCADE,
  recipient_phone text NOT NULL,
  recipient_email text,
  alert_type text DEFAULT 'system',
  message text NOT NULL,
  status text DEFAULT 'pending',
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create system_stats table
CREATE TABLE IF NOT EXISTS system_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date UNIQUE NOT NULL,
  total_vehicles_scanned integer DEFAULT 0,
  total_violations integer DEFAULT 0,
  total_alerts_sent integer DEFAULT 0,
  avg_confidence_score numeric(3,2),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vehicles_license_plate ON vehicles(license_plate);
CREATE INDEX IF NOT EXISTS idx_vehicles_expiry_dates ON vehicles(license_expiry_date, inspection_expiry_date);
CREATE INDEX IF NOT EXISTS idx_violations_vehicle_id ON violations(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_violations_date ON violations(violation_date DESC);
CREATE INDEX IF NOT EXISTS idx_violations_status ON violations(status);
CREATE INDEX IF NOT EXISTS idx_alerts_violation_id ON alerts(violation_id);
CREATE INDEX IF NOT EXISTS idx_system_stats_date ON system_stats(date DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for vehicles table
DROP TRIGGER IF EXISTS update_vehicles_updated_at ON vehicles;
CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_stats ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (admin access)
CREATE POLICY "Authenticated users can view all vehicles"
  ON vehicles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert vehicles"
  ON vehicles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update vehicles"
  ON vehicles FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete vehicles"
  ON vehicles FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view all violations"
  ON violations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert violations"
  ON violations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update violations"
  ON violations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete violations"
  ON violations FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view all alerts"
  ON alerts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert alerts"
  ON alerts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update alerts"
  ON alerts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete alerts"
  ON alerts FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view stats"
  ON system_stats FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert stats"
  ON system_stats FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update stats"
  ON system_stats FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert sample data for demonstration
INSERT INTO vehicles (license_plate, owner_name, owner_phone, vehicle_type, vehicle_capacity, license_expiry_date, inspection_expiry_date)
VALUES 
  ('KBE 100A', 'John Kamau', '+254700000001', 'sedan', 5, '2026-12-31', '2026-06-30'),
  ('KCA 200B', 'Mary Wanjiru', '+254700000002', 'matatu', 14, '2025-08-15', '2026-03-20'),
  ('KDA 300C', 'Peter Ochieng', '+254700000003', 'truck', 3, '2026-10-10', '2025-12-01'),
  ('KAA 400D', 'Sarah Akinyi', '+254700000004', 'sedan', 5, '2027-05-20', '2026-11-15')
ON CONFLICT (license_plate) DO NOTHING;