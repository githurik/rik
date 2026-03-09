export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      vehicles: {
        Row: {
          id: string
          license_plate: string
          owner_name: string
          owner_phone: string
          owner_email: string | null
          vehicle_type: string
          vehicle_capacity: number
          license_expiry_date: string
          inspection_expiry_date: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          license_plate: string
          owner_name: string
          owner_phone: string
          owner_email?: string | null
          vehicle_type?: string
          vehicle_capacity?: number
          license_expiry_date: string
          inspection_expiry_date: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          license_plate?: string
          owner_name?: string
          owner_phone?: string
          owner_email?: string | null
          vehicle_type?: string
          vehicle_capacity?: number
          license_expiry_date?: string
          inspection_expiry_date?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      violations: {
        Row: {
          id: string
          vehicle_id: string | null
          license_plate: string
          violation_type: string
          violation_date: string
          occupant_count: number | null
          confidence_score: number | null
          image_url: string | null
          location: string | null
          status: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          vehicle_id?: string | null
          license_plate: string
          violation_type: string
          violation_date?: string
          occupant_count?: number | null
          confidence_score?: number | null
          image_url?: string | null
          location?: string | null
          status?: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          vehicle_id?: string | null
          license_plate?: string
          violation_type?: string
          violation_date?: string
          occupant_count?: number | null
          confidence_score?: number | null
          image_url?: string | null
          location?: string | null
          status?: string
          notes?: string | null
          created_at?: string
        }
      }
      alerts: {
        Row: {
          id: string
          violation_id: string | null
          recipient_phone: string
          recipient_email: string | null
          alert_type: string
          message: string
          status: string
          sent_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          violation_id?: string | null
          recipient_phone: string
          recipient_email?: string | null
          alert_type?: string
          message: string
          status?: string
          sent_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          violation_id?: string | null
          recipient_phone?: string
          recipient_email?: string | null
          alert_type?: string
          message?: string
          status?: string
          sent_at?: string | null
          created_at?: string
        }
      }
      system_stats: {
        Row: {
          id: string
          date: string
          total_vehicles_scanned: number
          total_violations: number
          total_alerts_sent: number
          avg_confidence_score: number | null
          created_at: string
        }
        Insert: {
          id?: string
          date: string
          total_vehicles_scanned?: number
          total_violations?: number
          total_alerts_sent?: number
          avg_confidence_score?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          date?: string
          total_vehicles_scanned?: number
          total_violations?: number
          total_alerts_sent?: number
          avg_confidence_score?: number | null
          created_at?: string
        }
      }
    }
  }
}
