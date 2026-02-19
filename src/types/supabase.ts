export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      brands: {
        Row: {
          id: string;
          name: string;
          avatar: string | null;
          active_admins: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          avatar?: string | null;
          active_admins?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          avatar?: string | null;
          active_admins?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_brand_access: {
        Row: {
          id: string;
          user_id: string;
          brand_id: string;
          role: "owner" | "admin" | "member" | "viewer";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          brand_id: string;
          role?: "owner" | "admin" | "member" | "viewer";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          brand_id?: string;
          role?: "owner" | "admin" | "member" | "viewer";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      campaigns: {
        Row: {
          id: string;
          brand_id: string;
          name: string;
          platform_id: string;
          status: "active" | "paused" | "stopped";
          budget_used: number;
          budget_limit: number;
          roas: number;
          roas_trend: "up" | "down" | "flat";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          brand_id: string;
          name: string;
          platform_id: string;
          status?: "active" | "paused" | "stopped";
          budget_used?: number;
          budget_limit?: number;
          roas?: number;
          roas_trend?: "up" | "down" | "flat";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          brand_id?: string;
          name?: string;
          platform_id?: string;
          status?: "active" | "paused" | "stopped";
          budget_used?: number;
          budget_limit?: number;
          roas?: number;
          roas_trend?: "up" | "down" | "flat";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      platforms: {
        Row: {
          id: string;
          key: string;
          name: string;
          logo_key: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          name: string;
          logo_key?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          name?: string;
          logo_key?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      platform_connections: {
        Row: {
          id: string;
          brand_id: string;
          platform_id: string;
          is_active: boolean;
          spend: number;
          spend_limit: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          brand_id: string;
          platform_id: string;
          is_active?: boolean;
          spend?: number;
          spend_limit?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          brand_id?: string;
          platform_id?: string;
          is_active?: boolean;
          spend?: number;
          spend_limit?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      metrics: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          category: string;
          source: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          category: string;
          source: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          category?: string;
          source?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_metric_preferences: {
        Row: {
          id: string;
          user_id: string;
          brand_id: string;
          metric_id: string;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          brand_id: string;
          metric_id: string;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          brand_id?: string;
          metric_id?: string;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      has_any_brand_role: {
        Args: {
          allowed_roles: string[];
        };
        Returns: boolean;
      };
      has_brand_access: {
        Args: {
          target_brand_id: string;
        };
        Returns: boolean;
      };
      has_brand_role: {
        Args: {
          target_brand_id: string;
          allowed_roles: string[];
        };
        Returns: boolean;
      };
      reindex_metric_preference_positions: {
        Args: {
          target_user_id: string;
          target_brand_id: string;
        };
        Returns: void;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
