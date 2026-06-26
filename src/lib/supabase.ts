import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase env vars — check .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── Types ────────────────────────────────────────────────────────────────────

export type Report = {
  id: string
  uuid: string
  title: string
  category: string
  abstract: string | null
  publish_status: 'draft' | 'staged' | 'published' | 'archived'
  access_level: string
  published_at: string | null
  created_at: string
  updated_at: string
  file_path: string | null
  tags: string[] | null
}

export type Analyst = {
  id: string
  name: string
  title: string
  bio: string | null
  email_display: string | null
  photo_path: string | null
  coverage: string[]
  sort_order: number
  active: boolean
  created_at: string
}

export type MarketDataSeries = {
  id: string
  series_key: string
  label: string
  category: string
  unit: string | null
  created_at: string
}

export type MarketDataPoint = {
  id: string
  series_id: string
  effective_date: string
  value: number
  created_at: string
}

export type ContactSubmission = {
  id: string
  name: string
  email: string
  phone: string | null
  organisation: string | null
  message: string
  status: string
  created_at: string
}
