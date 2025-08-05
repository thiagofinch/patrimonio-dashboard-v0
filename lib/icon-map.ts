import type React from "react"
import {
  TrendingUp,
  Home,
  DollarSign,
  FileText,
  CheckCircle2,
  Zap,
  Clock,
  Folder,
  Building2,
  Users,
  CreditCard,
  Briefcase,
  Landmark,
} from "lucide-react"

// Mapeia o nome do ícone (string do banco de dados) para o componente React
export const iconMap: { [key: string]: React.ElementType } = {
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Zap,
  Clock,
  Folder,
  Building2,
  FileText,
  Users,
  Briefcase,
  Home,
  CreditCard,
  Landmark,
}

// Ícone padrão caso um mapeamento não seja encontrado
export const defaultIcon = DollarSign
