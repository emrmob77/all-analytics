export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      brands: {
        Row: {
          id: string;
          name: string;
          avatar: string | null;
          active_admins: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          avatar?: string | null;
          active_admins?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          avatar?: string | null;
          active_admins?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
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
          created_at: string | null;
          updated_at: string | null;
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
          created_at?: string | null;
          updated_at?: string | null;
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
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      platforms: {
        Row: {
          id: string;
          key: string;
          name: string;
          logo_key: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          key: string;
          name: string;
          logo_key?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          key?: string;
          name?: string;
          logo_key?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
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
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          brand_id: string;
          platform_id: string;
          is_active?: boolean;
          spend?: number;
          spend_limit?: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          brand_id?: string;
          platform_id?: string;
          is_active?: boolean;
          spend?: number;
          spend_limit?: number;
          created_at?: string | null;
          updated_at?: string | null;
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
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          category: string;
          source: string;
          is_active?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          category?: string;
          source?: string;
          is_active?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
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
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          brand_id: string;
          metric_id: string;
          position?: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          brand_id?: string;
          metric_id?: string;
          position?: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
