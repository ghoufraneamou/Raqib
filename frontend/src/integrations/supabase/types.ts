export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          dossier_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          dossier_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          dossier_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_profiles: {
        Row: {
          created_at: string
          department: string | null
          employee_id: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          employee_id?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department?: string | null
          employee_id?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          agent_id: string | null
          appointment_date: string
          created_at: string
          dossier_id: string | null
          email: string
          full_name: string
          id: string
          notes: string | null
          operator_id: string
          phone: string | null
          service_type: string
          status: Database["public"]["Enums"]["appointment_status"]
          time_slot: string
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          appointment_date: string
          created_at?: string
          dossier_id?: string | null
          email: string
          full_name: string
          id?: string
          notes?: string | null
          operator_id: string
          phone?: string | null
          service_type: string
          status?: Database["public"]["Enums"]["appointment_status"]
          time_slot: string
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          appointment_date?: string
          created_at?: string
          dossier_id?: string | null
          email?: string
          full_name?: string
          id?: string
          notes?: string | null
          operator_id?: string
          phone?: string | null
          service_type?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          time_slot?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operator_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_dossiers: {
        Row: {
          agenda_order: number | null
          commission_id: string
          dossier_id: string
          id: string
        }
        Insert: {
          agenda_order?: number | null
          commission_id: string
          dossier_id: string
          id?: string
        }
        Update: {
          agenda_order?: number | null
          commission_id?: string
          dossier_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_dossiers_commission_id_fkey"
            columns: ["commission_id"]
            isOneToOne: false
            referencedRelation: "commissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_dossiers_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_members: {
        Row: {
          agent_id: string
          commission_id: string
          convocation_sent_at: string | null
          id: string
          is_convoked: boolean
          role_in_commission: string | null
        }
        Insert: {
          agent_id: string
          commission_id: string
          convocation_sent_at?: string | null
          id?: string
          is_convoked?: boolean
          role_in_commission?: string | null
        }
        Update: {
          agent_id?: string
          commission_id?: string
          convocation_sent_at?: string | null
          id?: string
          is_convoked?: boolean
          role_in_commission?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_members_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_members_commission_id_fkey"
            columns: ["commission_id"]
            isOneToOne: false
            referencedRelation: "commissions"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          commission_date: string
          commission_time: string
          created_at: string
          created_by: string
          id: string
          location: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          commission_date: string
          commission_time: string
          created_at?: string
          created_by: string
          id?: string
          location: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          commission_date?: string
          commission_time?: string
          created_at?: string
          created_by?: string
          id?: string
          location?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          dossier_id: string | null
          id: string
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dossier_id?: string | null
          id?: string
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dossier_id?: string | null
          id?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          module_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          module_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          module_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "dossier_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      dossier_assignments: {
        Row: {
          agent_id: string
          assigned_at: string
          assigned_by: string | null
          assigned_role: Database["public"]["Enums"]["agent_role"]
          dossier_id: string
          id: string
        }
        Insert: {
          agent_id: string
          assigned_at?: string
          assigned_by?: string | null
          assigned_role: Database["public"]["Enums"]["agent_role"]
          dossier_id: string
          id?: string
        }
        Update: {
          agent_id?: string
          assigned_at?: string
          assigned_by?: string | null
          assigned_role?: Database["public"]["Enums"]["agent_role"]
          dossier_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dossier_assignments_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dossier_assignments_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
        ]
      }
      dossier_modules: {
        Row: {
          created_at: string
          dossier_id: string
          files_count: number
          id: string
          is_complete: boolean
          module_name: string
          module_number: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          dossier_id: string
          files_count?: number
          id?: string
          is_complete?: boolean
          module_name: string
          module_number: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          dossier_id?: string
          files_count?: number
          id?: string
          is_complete?: boolean
          module_name?: string
          module_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dossier_modules_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
        ]
      }
      dossiers: {
        Row: {
          amount_due: number | null
          created_at: string
          dci: string | null
          dosage: string | null
          dossier_number: string
          dossier_type: Database["public"]["Enums"]["dossier_type"]
          id: string
          is_paid: boolean
          manufacturer: string | null
          operator_id: string
          paid_at: string | null
          pharmaceutical_form: string | null
          product_name: string
          status: Database["public"]["Enums"]["dossier_status"]
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          amount_due?: number | null
          created_at?: string
          dci?: string | null
          dosage?: string | null
          dossier_number: string
          dossier_type: Database["public"]["Enums"]["dossier_type"]
          id?: string
          is_paid?: boolean
          manufacturer?: string | null
          operator_id: string
          paid_at?: string | null
          pharmaceutical_form?: string | null
          product_name: string
          status?: Database["public"]["Enums"]["dossier_status"]
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          amount_due?: number | null
          created_at?: string
          dci?: string | null
          dosage?: string | null
          dossier_number?: string
          dossier_type?: Database["public"]["Enums"]["dossier_type"]
          id?: string
          is_paid?: boolean
          manufacturer?: string | null
          operator_id?: string
          paid_at?: string | null
          pharmaceutical_form?: string | null
          product_name?: string
          status?: Database["public"]["Enums"]["dossier_status"]
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dossiers_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operator_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluations: {
        Row: {
          ai_analysis: string | null
          created_at: string
          dossier_id: string
          efficacy_comment: string | null
          efficacy_status: string | null
          evaluator_id: string
          id: string
          quality_comment: string | null
          quality_status: string | null
          recommendation: string | null
          safety_comment: string | null
          safety_status: string | null
          updated_at: string
        }
        Insert: {
          ai_analysis?: string | null
          created_at?: string
          dossier_id: string
          efficacy_comment?: string | null
          efficacy_status?: string | null
          evaluator_id: string
          id?: string
          quality_comment?: string | null
          quality_status?: string | null
          recommendation?: string | null
          safety_comment?: string | null
          safety_status?: string | null
          updated_at?: string
        }
        Update: {
          ai_analysis?: string | null
          created_at?: string
          dossier_id?: string
          efficacy_comment?: string | null
          efficacy_status?: string | null
          evaluator_id?: string
          id?: string
          quality_comment?: string | null
          quality_status?: string | null
          recommendation?: string | null
          safety_comment?: string | null
          safety_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_evaluator_id_fkey"
            columns: ["evaluator_id"]
            isOneToOne: false
            referencedRelation: "agent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      operator_profiles: {
        Row: {
          created_at: string
          id: string
          is_primary_contact: boolean
          organization_id: string
          position: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary_contact?: boolean
          organization_id: string
          position?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary_contact?: boolean
          organization_id?: string
          position?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "operator_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string
          business_domains: string[]
          city: string | null
          created_at: string
          email: string | null
          ice: string
          id: string
          is_validated: boolean
          phone: string | null
          raison_sociale: string
          updated_at: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          address: string
          business_domains?: string[]
          city?: string | null
          created_at?: string
          email?: string | null
          ice: string
          id?: string
          is_validated?: boolean
          phone?: string | null
          raison_sociale: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          address?: string
          business_domains?: string[]
          city?: string | null
          created_at?: string
          email?: string | null
          ice?: string
          id?: string
          is_validated?: boolean
          phone?: string | null
          raison_sociale?: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: []
      }
      parapheur_steps: {
        Row: {
          action: string | null
          agent_id: string
          comment: string | null
          created_at: string
          id: string
          signed_at: string | null
          step_order: number
          workflow_id: string
        }
        Insert: {
          action?: string | null
          agent_id: string
          comment?: string | null
          created_at?: string
          id?: string
          signed_at?: string | null
          step_order: number
          workflow_id: string
        }
        Update: {
          action?: string | null
          agent_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          signed_at?: string | null
          step_order?: number
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parapheur_steps_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parapheur_steps_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "parapheur_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      parapheur_workflows: {
        Row: {
          created_at: string
          document_path: string | null
          document_title: string
          dossier_id: string
          id: string
          initiated_by: string
          status: Database["public"]["Enums"]["parapheur_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_path?: string | null
          document_title: string
          dossier_id: string
          id?: string
          initiated_by: string
          status?: Database["public"]["Enums"]["parapheur_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_path?: string | null
          document_title?: string
          dossier_id?: string
          id?: string
          initiated_by?: string
          status?: Database["public"]["Enums"]["parapheur_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parapheur_workflows_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["agent_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["agent_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["agent_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["agent_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_agent: { Args: { _user_id: string }; Returns: boolean }
      is_assigned_to_dossier: {
        Args: { _dossier_id: string; _user_id: string }
        Returns: boolean
      }
      is_conversation_participant: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
      is_dossier_owner: {
        Args: { _dossier_id: string; _user_id: string }
        Returns: boolean
      }
      is_operator: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      agent_role: "admin" | "evaluator" | "inspector" | "validator"
      appointment_status: "pending" | "confirmed" | "completed" | "cancelled"
      dossier_status:
        | "draft"
        | "submitted"
        | "completeness_check"
        | "complement_required"
        | "evaluation"
        | "commission"
        | "approved"
        | "rejected"
        | "suspended"
      dossier_type:
        | "new_amm"
        | "renewal"
        | "modification"
        | "variation"
        | "import_auth"
        | "visa_pub"
        | "bpf_cert"
      parapheur_status: "pending" | "in_progress" | "signed" | "refused"
      user_type: "operator" | "agent"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      agent_role: ["admin", "evaluator", "inspector", "validator"],
      appointment_status: ["pending", "confirmed", "completed", "cancelled"],
      dossier_status: [
        "draft",
        "submitted",
        "completeness_check",
        "complement_required",
        "evaluation",
        "commission",
        "approved",
        "rejected",
        "suspended",
      ],
      dossier_type: [
        "new_amm",
        "renewal",
        "modification",
        "variation",
        "import_auth",
        "visa_pub",
        "bpf_cert",
      ],
      parapheur_status: ["pending", "in_progress", "signed", "refused"],
      user_type: ["operator", "agent"],
    },
  },
} as const
