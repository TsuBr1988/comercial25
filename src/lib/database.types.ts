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
      badges: {
        Row: {
          id: string
          name: string
          icon: string
          color: string
          description: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          icon: string
          color: string
          description: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          icon?: string
          color?: string
          description?: string
          created_at?: string
        }
      }
      bonus_contributions: {
        Row: {
          id: string
          proposal_id: string
          client_name: string
          contract_value: number
          fixed_amount: number
          percentage_amount: number
          total_contribution: number
          contribution_date: string
          created_at: string
        }
        Insert: {
          id?: string
          proposal_id: string
          client_name: string
          contract_value: number
          fixed_amount?: number
          percentage_amount?: number
          total_contribution?: number
          contribution_date?: string
          created_at?: string
        }
        Update: {
          id?: string
          proposal_id?: string
          client_name?: string
          contract_value?: number
          fixed_amount?: number
          percentage_amount?: number
          total_contribution?: number
          contribution_date?: string
          created_at?: string
        }
      }
      budget_posts: {
        Row: {
          id: string
          budget_id: string
          post_name: string
          role_id: string | null
          scale_id: string | null
          turn: string
          city_id: string | null
          salary_additions: any | null
          total_cost: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          budget_id: string
          post_name: string
          role_id?: string | null
          scale_id?: string | null
          turn: string
          city_id?: string | null
          salary_additions?: any | null
          total_cost?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          budget_id?: string
          post_name?: string
          role_id?: string | null
          scale_id?: string | null
          turn?: string
          city_id?: string | null
          salary_additions?: any | null
          total_cost?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      campaigns: {
        Row: {
          id: string
          title: string
          description: string
          start_date: string
          end_date: string
          target_points: number
          participants: number
          status: 'active' | 'paused' | 'completed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          start_date: string
          end_date: string
          target_points?: number
          participants?: number
          status?: 'active' | 'paused' | 'completed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          start_date?: string
          end_date?: string
          target_points?: number
          participants?: number
          status?: 'active' | 'paused' | 'completed'
          created_at?: string
          updated_at?: string
        }
      }
      employee_badges: {
        Row: {
          id: string
          employee_id: string
          badge_id: string
          earned_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          badge_id: string
          earned_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          badge_id?: string
          earned_at?: string
        }
      }
      challenges: {
        Row: {
          id: string
          title: string
          description: string | null
          start_date: string
          end_date: string
          prize: string
          target_type: "points" | "sales" | "mql" | "visitas_agendadas" | "contratos_assinados" | "pontos_educacao"
          target_value: number
          status: "active" | "completed" | "expired"
          participants_ids: string[] | null
          winner_ids: string[] | null
          completion_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          start_date: string
          end_date: string
          prize: string
          target_type: "points" | "sales" | "mql" | "visitas_agendadas" | "contratos_assinados" | "pontos_educacao"
          target_value: number
          status?: "active" | "completed" | "expired"
          participants_ids?: string[] | null
          winner_ids?: string[] | null
          completion_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          start_date?: string
          end_date?: string
          prize?: string
          target_type?: "points" | "sales" | "mql" | "visitas_agendadas" | "contratos_assinados" | "pontos_educacao"
          target_value?: number
          status?: "active" | "completed" | "expired"
          participants_ids?: string[] | null
          winner_ids?: string[] | null
          completion_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      employees: {
        Row: {
          id: string
          user_id: string | null
          name: string
          email: string
          avatar: string
          department: string
          position: string
          role: 'SDR' | 'Closer' | 'Admin'
          points: number
          level: number
          admission_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          email: string
          avatar?: string
          department?: string
          position: string
          role?: 'SDR' | 'Closer' | 'Admin'
          points?: number
          level?: number
          admission_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          email?: string
          avatar?: string
          department?: string
          position?: string
          role?: 'SDR' | 'Closer' | 'Admin'
          points?: number
          level?: number
          admission_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      probability_scores: {
        Row: {
          id: string
          proposal_id: string
          economic_buyer: number
          metrics: number
          decision_criteria: number
          decision_process: number
          identify_pain: number
          champion: number
          competition: number
          engagement: number
          total_score: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          proposal_id: string
          economic_buyer?: number
          metrics?: number
          decision_criteria?: number
          decision_process?: number
          identify_pain?: number
          champion?: number
          competition?: number
          engagement?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          proposal_id?: string
          economic_buyer?: number
          metrics?: number
          decision_criteria?: number
          decision_process?: number
          identify_pain?: number
          champion?: number
          competition?: number
          engagement?: number
          created_at?: string
          updated_at?: string
        }
      }
      proposals: {
        Row: {
          id: string
          client: string
          monthly_value: number
          months: number
          total_value: number
          status: 'Proposta' | 'Negociação' | 'Fechado' | 'Perdido'
          commission: number
          commission_rate: number
          closer_id: string | null
          sdr_id: string | null
          closing_date: string | null
          lost_date: string | null
          lost_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client: string
          monthly_value: number
          months: number
          total_value: number
          status?: 'Proposta' | 'Negociação' | 'Fechado' | 'Perdido'
          commission?: number
          commission_rate?: number
          closer_id?: string | null
          sdr_id?: string | null
          closing_date?: string | null
          lost_date?: string | null
          lost_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client?: string
          monthly_value?: number
          months?: number
          total_value?: number
          status?: 'Proposta' | 'Negociação' | 'Fechado' | 'Perdido'
          commission?: number
          commission_rate?: number
          closer_id?: string | null
          sdr_id?: string | null
          closing_date?: string | null
          lost_date?: string | null
          lost_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      recognitions: {
        Row: {
          id: string
          from_employee_id: string
          to_employee_id: string
          message: string
          points: number
          is_public: boolean
          created_at: string
        }
        Insert: {
          id?: string
          from_employee_id: string
          to_employee_id: string
          message: string
          points?: number
          is_public?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          from_employee_id?: string
          to_employee_id?: string
          message?: string
          points?: number
          is_public?: boolean
          created_at?: string
        }
      }
      rewards: {
        Row: {
          id: string
          name: string
          description: string
          points: number
          category: string
          image: string
          stock: number
          is_available: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          points: number
          category: string
          image?: string
          stock?: number
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          points?: number
          category?: string
          image?: string
          stock?: number
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      system_configurations: {
        Row: {
          id: string
          config_type: string
          config_data: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          config_type: string
          config_data: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          config_type?: string
          config_data?: any
          created_at?: string
          updated_at?: string
        }
      }
      weekly_performance: {
        Row: {
          id: string
          employee_id: string
          week_ending_date: string
          tarefas: number
          pontos_educacao: number
          propostas_apresentadas: number
          contrato_assinado: number
          mql: number
          visitas_agendadas: number
          total_points: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          week_ending_date: string
          tarefas?: number
          pontos_educacao?: number
          propostas_apresentadas?: number
          contrato_assinado?: number
          mql?: number
        turn?: string | null
          total_points?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          week_ending_date?: string
          tarefas?: number
          pontos_educacao?: number
          propostas_apresentadas?: number
          contrato_assinado?: number
        turn?: string | null
          visitas_agendadas?: number
          total_points?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    budget_cities_iss: {
      Row: {
        id: string
        city_name: string
        iss_percent: number
        is_active: boolean | null
        created_at: string | null
      }
      Insert: {
        id?: string
        city_name: string
        iss_percent: number
        is_active?: boolean | null
        created_at?: string | null
      }
      Update: {
        id?: string
        city_name?: string
        iss_percent?: number
        is_active?: boolean | null
        created_at?: string | null
      }
    }
    budget_uniforms: {
      Row: {
        id: string
        item_name: string
        life_time_months: number
        qty_per_collaborator: number
        unit_value: number
        is_active: boolean | null
        created_at: string | null
      }
      Insert: {
        id?: string
        item_name: string
        life_time_months: number
        qty_per_collaborator: number
        unit_value: number
        is_active?: boolean | null
        created_at?: string | null
      }
      Update: {
        id?: string
        item_name?: string
        life_time_months?: number
        qty_per_collaborator?: number
        unit_value?: number
        is_active?: boolean | null
        created_at?: string | null
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
        turn: string | null
      employee_role: 'SDR' | 'Closer' | 'Admin'
      proposal_status: 'Proposta' | 'Negociação' | 'Fechado' | 'Perdido'
    }
    CompositeTypes: {
      [_ in never]: never
    }
    target_type: "points" | "sales"
    challenge_status: "active" | "completed" | "expired"
    budget_iss_rates: {
      Row: {
        id: string
        city_name: string
        iss_rate: number
        is_active: boolean
        created_at: string
      }
      Insert: {
        id?: string
        city_name: string
        iss_rate: number
        is_active?: boolean
        created_at?: string
      }
      Update: {
        id?: string
        city_name?: string
        iss_rate?: number
        is_active?: boolean
        created_at?: string
      }
    }
  }
}