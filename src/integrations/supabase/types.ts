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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          event_type: string
          id: string
          metadata: Json | null
          summary: string | null
          workspace_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          summary?: string | null
          workspace_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          summary?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      classifications: {
        Row: {
          actionability_score: number
          created_at: string
          final_decision: Database["public"]["Enums"]["classification_decision"]
          id: string
          matched_keywords: string[] | null
          model_version: string | null
          reasoning: string | null
          risk_score: number
          source_score: number
          topic_score: number
          tweet_id: string
          workspace_id: string
        }
        Insert: {
          actionability_score?: number
          created_at?: string
          final_decision?: Database["public"]["Enums"]["classification_decision"]
          id?: string
          matched_keywords?: string[] | null
          model_version?: string | null
          reasoning?: string | null
          risk_score?: number
          source_score?: number
          topic_score?: number
          tweet_id: string
          workspace_id: string
        }
        Update: {
          actionability_score?: number
          created_at?: string
          final_decision?: Database["public"]["Enums"]["classification_decision"]
          id?: string
          matched_keywords?: string[] | null
          model_version?: string | null
          reasoning?: string | null
          risk_score?: number
          source_score?: number
          topic_score?: number
          tweet_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classifications_tweet_id_fkey"
            columns: ["tweet_id"]
            isOneToOne: false
            referencedRelation: "tweets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classifications_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      connected_accounts: {
        Row: {
          auto_reply_enabled: boolean
          bio: string | null
          created_at: string
          display_name: string | null
          enabled: boolean
          expertise_tags: string[] | null
          handle: string
          id: string
          persona_profile_id: string | null
          platform: string
          workspace_id: string
        }
        Insert: {
          auto_reply_enabled?: boolean
          bio?: string | null
          created_at?: string
          display_name?: string | null
          enabled?: boolean
          expertise_tags?: string[] | null
          handle: string
          id?: string
          persona_profile_id?: string | null
          platform?: string
          workspace_id: string
        }
        Update: {
          auto_reply_enabled?: boolean
          bio?: string | null
          created_at?: string
          display_name?: string | null
          enabled?: boolean
          expertise_tags?: string[] | null
          handle?: string
          id?: string
          persona_profile_id?: string | null
          platform?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "connected_accounts_persona_profile_id_fkey"
            columns: ["persona_profile_id"]
            isOneToOne: false
            referencedRelation: "persona_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connected_accounts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      drafts: {
        Row: {
          account_id: string | null
          action_type: Database["public"]["Enums"]["action_type"]
          approved_by: string | null
          created_at: string
          created_by: string | null
          draft_text: string
          error_message: string | null
          id: string
          platform_post_id: string | null
          published_at: string | null
          scheduled_for: string | null
          status: Database["public"]["Enums"]["draft_status"]
          tweet_id: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          account_id?: string | null
          action_type: Database["public"]["Enums"]["action_type"]
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          draft_text: string
          error_message?: string | null
          id?: string
          platform_post_id?: string | null
          published_at?: string | null
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["draft_status"]
          tweet_id?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          account_id?: string | null
          action_type?: Database["public"]["Enums"]["action_type"]
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          draft_text?: string
          error_message?: string | null
          id?: string
          platform_post_id?: string | null
          published_at?: string | null
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["draft_status"]
          tweet_id?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "drafts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "connected_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drafts_tweet_id_fkey"
            columns: ["tweet_id"]
            isOneToOne: false
            referencedRelation: "tweets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drafts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      persona_profiles: {
        Row: {
          created_at: string
          description: string | null
          expertise_domain: string | null
          id: string
          name: string
          reply_style: string | null
          risk_tolerance: string | null
          tone: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          expertise_domain?: string | null
          id?: string
          name: string
          reply_style?: string | null
          risk_tolerance?: string | null
          tone?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          expertise_domain?: string | null
          id?: string
          name?: string
          reply_style?: string | null
          risk_tolerance?: string | null
          tone?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "persona_profiles_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          current_workspace_id: string | null
          display_name: string | null
          email: string | null
          id: string
        }
        Insert: {
          created_at?: string
          current_workspace_id?: string | null
          display_name?: string | null
          email?: string | null
          id: string
        }
        Update: {
          created_at?: string
          current_workspace_id?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_current_workspace_id_fkey"
            columns: ["current_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tweets: {
        Row: {
          created_at: string
          hashtags: string[] | null
          id: string
          ingested_at: string
          lang: string | null
          links: string[] | null
          mentions: string[] | null
          raw_json: Json | null
          source_display_name: string | null
          source_handle: string
          text: string
          tweet_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          hashtags?: string[] | null
          id?: string
          ingested_at?: string
          lang?: string | null
          links?: string[] | null
          mentions?: string[] | null
          raw_json?: Json | null
          source_display_name?: string | null
          source_handle: string
          text: string
          tweet_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          hashtags?: string[] | null
          id?: string
          ingested_at?: string
          lang?: string | null
          links?: string[] | null
          mentions?: string[] | null
          raw_json?: Json | null
          source_display_name?: string | null
          source_handle?: string
          text?: string
          tweet_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tweets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      watch_sources: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          label: string | null
          priority: number
          source_type: Database["public"]["Enums"]["source_type"]
          source_value: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          label?: string | null
          priority?: number
          source_type: Database["public"]["Enums"]["source_type"]
          source_value: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          label?: string | null
          priority?: number
          source_type?: Database["public"]["Enums"]["source_type"]
          source_value?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watch_sources_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_edit_workspace: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
      has_workspace_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
          _workspace_id: string
        }
        Returns: boolean
      }
      is_workspace_member: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
    }
    Enums: {
      action_type: "reply" | "quote" | "post" | "ignore"
      app_role: "admin" | "editor" | "viewer"
      classification_decision:
        | "ignore"
        | "review"
        | "draft_reply"
        | "draft_quote"
        | "draft_post"
      draft_status:
        | "pending"
        | "approved"
        | "rejected"
        | "scheduled"
        | "published"
        | "failed"
      source_type: "account" | "keyword" | "concept" | "query"
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
      action_type: ["reply", "quote", "post", "ignore"],
      app_role: ["admin", "editor", "viewer"],
      classification_decision: [
        "ignore",
        "review",
        "draft_reply",
        "draft_quote",
        "draft_post",
      ],
      draft_status: [
        "pending",
        "approved",
        "rejected",
        "scheduled",
        "published",
        "failed",
      ],
      source_type: ["account", "keyword", "concept", "query"],
    },
  },
} as const
