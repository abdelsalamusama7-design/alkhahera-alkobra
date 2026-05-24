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
      ad_health_log: {
        Row: {
          checked_at: string
          error: string | null
          http_status: number | null
          id: string
          placement_id: string | null
          status: Database["public"]["Enums"]["ad_health"]
        }
        Insert: {
          checked_at?: string
          error?: string | null
          http_status?: number | null
          id?: string
          placement_id?: string | null
          status: Database["public"]["Enums"]["ad_health"]
        }
        Update: {
          checked_at?: string
          error?: string | null
          http_status?: number | null
          id?: string
          placement_id?: string | null
          status?: Database["public"]["Enums"]["ad_health"]
        }
        Relationships: [
          {
            foreignKeyName: "ad_health_log_placement_id_fkey"
            columns: ["placement_id"]
            isOneToOne: false
            referencedRelation: "ad_placements"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_placements: {
        Row: {
          clicks: number
          config: Json
          created_at: string
          enabled: boolean
          fail_count: number
          health_status: Database["public"]["Enums"]["ad_health"]
          id: string
          impressions: number
          is_fallback: boolean
          last_checked_at: string | null
          last_error: string | null
          name: string
          order_index: number
          slot: string
          type: string
          updated_at: string
        }
        Insert: {
          clicks?: number
          config?: Json
          created_at?: string
          enabled?: boolean
          fail_count?: number
          health_status?: Database["public"]["Enums"]["ad_health"]
          id?: string
          impressions?: number
          is_fallback?: boolean
          last_checked_at?: string | null
          last_error?: string | null
          name: string
          order_index?: number
          slot: string
          type: string
          updated_at?: string
        }
        Update: {
          clicks?: number
          config?: Json
          created_at?: string
          enabled?: boolean
          fail_count?: number
          health_status?: Database["public"]["Enums"]["ad_health"]
          id?: string
          impressions?: number
          is_fallback?: boolean
          last_checked_at?: string | null
          last_error?: string | null
          name?: string
          order_index?: number
          slot?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      article_drafts: {
        Row: {
          approved_article_id: string | null
          category_id: string | null
          content: string | null
          cover_image: string | null
          created_at: string
          excerpt: string | null
          id: string
          original_excerpt: string | null
          original_title: string | null
          published_at: string
          rejected_reason: string | null
          source: string | null
          source_url: string | null
          status: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          approved_article_id?: string | null
          category_id?: string | null
          content?: string | null
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          original_excerpt?: string | null
          original_title?: string | null
          published_at?: string
          rejected_reason?: string | null
          source?: string | null
          source_url?: string | null
          status?: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          approved_article_id?: string | null
          category_id?: string | null
          content?: string | null
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          original_excerpt?: string | null
          original_title?: string | null
          published_at?: string
          rejected_reason?: string | null
          source?: string | null
          source_url?: string | null
          status?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      article_views: {
        Row: {
          article_id: string
          country: string | null
          device_type: string
          id: string
          path: string | null
          referrer: string | null
          referrer_host: string | null
          source_type: string
          user_agent: string | null
          viewed_at: string
        }
        Insert: {
          article_id: string
          country?: string | null
          device_type?: string
          id?: string
          path?: string | null
          referrer?: string | null
          referrer_host?: string | null
          source_type?: string
          user_agent?: string | null
          viewed_at?: string
        }
        Update: {
          article_id?: string
          country?: string | null
          device_type?: string
          id?: string
          path?: string | null
          referrer?: string | null
          referrer_host?: string | null
          source_type?: string
          user_agent?: string | null
          viewed_at?: string
        }
        Relationships: []
      }
      articles: {
        Row: {
          author_id: string | null
          author_name: string | null
          category_id: string | null
          content: string | null
          cover_image: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_breaking: boolean
          is_published: boolean
          published_at: string
          slug: string
          source: string | null
          source_url: string | null
          tags: string[]
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          category_id?: string | null
          content?: string | null
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_breaking?: boolean
          is_published?: boolean
          published_at?: string
          slug: string
          source?: string | null
          source_url?: string | null
          tags?: string[]
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          category_id?: string | null
          content?: string | null
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_breaking?: boolean
          is_published?: boolean
          published_at?: string
          slug?: string
          source?: string | null
          source_url?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      home_section_items: {
        Row: {
          article_id: string | null
          created_at: string
          custom_image: string | null
          custom_source: string | null
          custom_title: string | null
          custom_url: string | null
          id: string
          kind: string
          section_key: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          article_id?: string | null
          created_at?: string
          custom_image?: string | null
          custom_source?: string | null
          custom_title?: string | null
          custom_url?: string | null
          id?: string
          kind?: string
          section_key: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          article_id?: string | null
          created_at?: string
          custom_image?: string | null
          custom_source?: string | null
          custom_title?: string | null
          custom_url?: string | null
          id?: string
          kind?: string
          section_key?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "home_section_items_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_section_items_section_key_fkey"
            columns: ["section_key"]
            isOneToOne: false
            referencedRelation: "home_sections"
            referencedColumns: ["key"]
          },
        ]
      }
      home_sections: {
        Row: {
          columns: number
          display_count: number
          enabled: boolean
          key: string
          layout: string
          load_more_step: number
          max_count: number
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          columns?: number
          display_count?: number
          enabled?: boolean
          key: string
          layout?: string
          load_more_step?: number
          max_count?: number
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          columns?: number
          display_count?: number
          enabled?: boolean
          key?: string
          layout?: string
          load_more_step?: number
          max_count?: number
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          last_used_at: string
          p256dh: string
          user_agent: string | null
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          last_used_at?: string
          p256dh: string
          user_agent?: string | null
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          last_used_at?: string
          p256dh?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      rss_sources: {
        Row: {
          auto_publish: boolean
          category_slug: string
          created_at: string
          enabled: boolean
          id: string
          last_error: string | null
          last_fetched_at: string | null
          last_inserted_count: number
          max_items: number
          name: string
          sort_order: number
          source_label: string
          total_inserted: number
          updated_at: string
          url: string
        }
        Insert: {
          auto_publish?: boolean
          category_slug: string
          created_at?: string
          enabled?: boolean
          id?: string
          last_error?: string | null
          last_fetched_at?: string | null
          last_inserted_count?: number
          max_items?: number
          name: string
          sort_order?: number
          source_label: string
          total_inserted?: number
          updated_at?: string
          url: string
        }
        Update: {
          auto_publish?: boolean
          category_slug?: string
          created_at?: string
          enabled?: boolean
          id?: string
          last_error?: string | null
          last_fetched_at?: string | null
          last_inserted_count?: number
          max_items?: number
          name?: string
          sort_order?: number
          source_label?: string
          total_inserted?: number
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      sitemap_checks: {
        Row: {
          checked_at: string
          content_type: string | null
          duration_ms: number | null
          error: string | null
          http_status: number | null
          id: string
          image_count: number | null
          latest_lastmod: string | null
          source: string
          status: string
          url_count: number | null
        }
        Insert: {
          checked_at?: string
          content_type?: string | null
          duration_ms?: number | null
          error?: string | null
          http_status?: number | null
          id?: string
          image_count?: number | null
          latest_lastmod?: string | null
          source?: string
          status: string
          url_count?: number | null
        }
        Update: {
          checked_at?: string
          content_type?: string | null
          duration_ms?: number | null
          error?: string | null
          http_status?: number | null
          id?: string
          image_count?: number | null
          latest_lastmod?: string | null
          source?: string
          status?: string
          url_count?: number | null
        }
        Relationships: []
      }
      social_posts: {
        Row: {
          article_id: string
          created_at: string | null
          error_message: string | null
          id: string
          platform: string
          post_id: string | null
          posted_at: string | null
          status: string
        }
        Insert: {
          article_id: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          platform: string
          post_id?: string | null
          posted_at?: string | null
          status?: string
        }
        Update: {
          article_id?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          platform?: string
          post_id?: string | null
          posted_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_list_users: {
        Args: never
        Returns: {
          created_at: string
          display_name: string
          email: string
          roles: Database["public"]["Enums"]["app_role"][]
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      ad_health: "ok" | "failed" | "unknown"
      app_role:
        | "admin"
        | "editor"
        | "journalist"
        | "chief_editor"
        | "editor_in_chief"
        | "it_specialist"
        | "board_director"
        | "president"
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
      ad_health: ["ok", "failed", "unknown"],
      app_role: [
        "admin",
        "editor",
        "journalist",
        "chief_editor",
        "editor_in_chief",
        "it_specialist",
        "board_director",
        "president",
      ],
    },
  },
} as const
