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
        };
        Insert: {
          id?: string;
          name: string;
          avatar?: string | null;
          active_admins?: number | null;
        };
        Update: {
          id?: string;
          name?: string;
          avatar?: string | null;
          active_admins?: number | null;
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
