// lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

// Supabase 클라이언트 생성
// 환경 변수는 .env.local 파일에 설정하거나 Vercel 환경 변수로 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default supabase