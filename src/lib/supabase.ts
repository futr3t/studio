import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database type definitions (these will match your Supabase schema)
export type Database = {
  public: {
    Tables: {
      suppliers: {
        Row: {
          id: string
          name: string
          contact_person: string | null
          phone: string | null
          email: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          contact_person?: string | null
          phone?: string | null
          email?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          contact_person?: string | null
          phone?: string | null
          email?: string | null
          updated_at?: string
        }
      }
      appliances: {
        Row: {
          id: string
          name: string
          location: string
          type: string
          min_temp: number | null
          max_temp: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          location: string
          type: string
          min_temp?: number | null
          max_temp?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          location?: string
          type?: string
          min_temp?: number | null
          max_temp?: number | null
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          name: string
          email: string
          role: 'admin' | 'staff'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          role: 'admin' | 'staff'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          role?: 'admin' | 'staff'
          updated_at?: string
        }
      }
      production_logs: {
        Row: {
          id: string
          product_name: string
          batch_code: string
          log_time: string
          critical_limit_details: string
          is_compliant: boolean
          corrective_action: string | null
          verified_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_name: string
          batch_code: string
          log_time?: string
          critical_limit_details: string
          is_compliant: boolean
          corrective_action?: string | null
          verified_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_name?: string
          batch_code?: string
          log_time?: string
          critical_limit_details?: string
          is_compliant?: boolean
          corrective_action?: string | null
          verified_by?: string | null
          updated_at?: string
        }
      }
      delivery_logs: {
        Row: {
          id: string
          supplier_id: string | null
          delivery_time: string
          vehicle_reg: string | null
          driver_name: string | null
          overall_condition: 'good' | 'fair' | 'poor' | null
          is_compliant: boolean
          corrective_action: string | null
          received_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          supplier_id?: string | null
          delivery_time?: string
          vehicle_reg?: string | null
          driver_name?: string | null
          overall_condition?: 'good' | 'fair' | 'poor' | null
          is_compliant: boolean
          corrective_action?: string | null
          received_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          supplier_id?: string | null
          delivery_time?: string
          vehicle_reg?: string | null
          driver_name?: string | null
          overall_condition?: 'good' | 'fair' | 'poor' | null
          is_compliant?: boolean
          corrective_action?: string | null
          received_by?: string | null
          updated_at?: string
        }
      }
      delivery_items: {
        Row: {
          id: string
          delivery_log_id: string | null
          name: string
          quantity: number
          unit: string
          temperature: number | null
          is_compliant: boolean
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          delivery_log_id?: string | null
          name: string
          quantity: number
          unit: string
          temperature?: number | null
          is_compliant: boolean
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          delivery_log_id?: string | null
          name?: string
          quantity?: number
          unit?: string
          temperature?: number | null
          is_compliant?: boolean
          notes?: string | null
        }
      }
      temperature_logs: {
        Row: {
          id: string
          appliance_id: string | null
          temperature: number
          log_time: string
          is_compliant: boolean
          corrective_action: string | null
          logged_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          appliance_id?: string | null
          temperature: number
          log_time?: string
          is_compliant: boolean
          corrective_action?: string | null
          logged_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          appliance_id?: string | null
          temperature?: number
          log_time?: string
          is_compliant?: boolean
          corrective_action?: string | null
          logged_by?: string | null
          updated_at?: string
        }
      }
      cleaning_tasks: {
        Row: {
          id: string
          name: string
          area: string
          frequency: 'daily' | 'weekly' | 'monthly' | 'as_needed'
          description: string | null
          equipment: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          area: string
          frequency: 'daily' | 'weekly' | 'monthly' | 'as_needed'
          description?: string | null
          equipment?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          area?: string
          frequency?: 'daily' | 'weekly' | 'monthly' | 'as_needed'
          description?: string | null
          equipment?: string[] | null
          updated_at?: string
        }
      }
      cleaning_checklist_items: {
        Row: {
          id: string
          task_id: string | null
          name: string
          area: string
          frequency: string
          description: string | null
          completed: boolean
          completed_at: string | null
          completed_by: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          task_id?: string | null
          name: string
          area: string
          frequency: string
          description?: string | null
          completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          task_id?: string | null
          name?: string
          area?: string
          frequency?: string
          description?: string | null
          completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          notes?: string | null
          updated_at?: string
        }
      }
    }
  }
}