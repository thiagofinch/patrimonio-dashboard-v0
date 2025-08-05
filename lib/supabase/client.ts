import { createClient } from "@supabase/supabase-js"
import type { Bucket } from "@/types/patrimonio"

// Tipagem para o banco de dados gerado pelo Supabase (simplificado por agora)
export type Database = {
  public: {
    Tables: {
      buckets: {
        Row: Bucket // A linha no DB corresponde ao nosso tipo Bucket
        Insert: Partial<Bucket>
        Update: Partial<Bucket>
      }
      // ... outras tabelas
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
  }
}

const supabaseUrlRaw = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrlRaw || !supabaseAnonKey) {
  const errorMessage =
    "Variáveis de ambiente do Supabase não configuradas. " +
    "Por favor, configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
    "No ambiente v0, use o botão 'Adicionar Integração' para conectar seu projeto Supabase. " +
    "Lembre-se de reiniciar o servidor após alterar o .env.local"
  console.error("❌ " + errorMessage)
  throw new Error(errorMessage)
}

// ✅ CORRETO: Garantir que a URL não tenha uma barra (/) no final
const supabaseUrl = supabaseUrlRaw.replace(/\/$/, "")

// Exportar uma instância única do client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
