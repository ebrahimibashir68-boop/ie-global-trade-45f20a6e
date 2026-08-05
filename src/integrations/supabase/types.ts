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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      compliance_screenings: {
        Row: {
          checks: Json
          contract_id: string
          created_at: string
          id: string
          matches: Json
          outcome: Database["public"]["Enums"]["screening_outcome"]
          screened_by: string | null
        }
        Insert: {
          checks?: Json
          contract_id: string
          created_at?: string
          id?: string
          matches?: Json
          outcome: Database["public"]["Enums"]["screening_outcome"]
          screened_by?: string | null
        }
        Update: {
          checks?: Json
          contract_id?: string
          created_at?: string
          id?: string
          matches?: Json
          outcome?: Database["public"]["Enums"]["screening_outcome"]
          screened_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_screenings_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "trade_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_documents: {
        Row: {
          contract_id: string
          created_at: string
          created_by: string | null
          doc_number: string | null
          doc_type: Database["public"]["Enums"]["trade_doc_type"]
          hash: string | null
          id: string
          issued_at: string
          issuer: string | null
          payload: Json
        }
        Insert: {
          contract_id: string
          created_at?: string
          created_by?: string | null
          doc_number?: string | null
          doc_type: Database["public"]["Enums"]["trade_doc_type"]
          hash?: string | null
          id?: string
          issued_at?: string
          issuer?: string | null
          payload?: Json
        }
        Update: {
          contract_id?: string
          created_at?: string
          created_by?: string | null
          doc_number?: string | null
          doc_type?: Database["public"]["Enums"]["trade_doc_type"]
          hash?: string | null
          id?: string
          issued_at?: string
          issuer?: string | null
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "contract_documents_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "trade_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_events: {
        Row: {
          actor_id: string | null
          contract_id: string
          created_at: string
          detail: Json
          event_type: string
          id: string
        }
        Insert: {
          actor_id?: string | null
          contract_id: string
          created_at?: string
          detail?: Json
          event_type: string
          id?: string
        }
        Update: {
          actor_id?: string | null
          contract_id?: string
          created_at?: string
          detail?: Json
          event_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_events_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "trade_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_milestones: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          contract_id: string
          created_at: string
          id: string
          key: string
          label: string
          note: string | null
          release_pct: number
          required_docs: string[]
          seq: number
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          contract_id: string
          created_at?: string
          id?: string
          key: string
          label: string
          note?: string | null
          release_pct?: number
          required_docs?: string[]
          seq: number
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          contract_id?: string
          created_at?: string
          id?: string
          key?: string
          label?: string
          note?: string | null
          release_pct?: number
          required_docs?: string[]
          seq?: number
        }
        Relationships: [
          {
            foreignKeyName: "contract_milestones_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "trade_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_signatures: {
        Row: {
          contract_id: string
          hash: string
          id: string
          role: string
          signed_at: string
          signer_name: string
          signer_user_id: string | null
        }
        Insert: {
          contract_id: string
          hash: string
          id?: string
          role: string
          signed_at?: string
          signer_name: string
          signer_user_id?: string | null
        }
        Update: {
          contract_id?: string
          hash?: string
          id?: string
          role?: string
          signed_at?: string
          signer_name?: string
          signer_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_signatures_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "trade_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      controlled_goods: {
        Row: {
          description: string
          hs_prefix: string
          id: string
          regime: string
          severity: Database["public"]["Enums"]["screening_outcome"]
        }
        Insert: {
          description: string
          hs_prefix: string
          id?: string
          regime: string
          severity?: Database["public"]["Enums"]["screening_outcome"]
        }
        Update: {
          description?: string
          hs_prefix?: string
          id?: string
          regime?: string
          severity?: Database["public"]["Enums"]["screening_outcome"]
        }
        Relationships: []
      }
      denied_parties: {
        Row: {
          country_code: string | null
          id: string
          list_source: string
          name: string
          reason: string | null
        }
        Insert: {
          country_code?: string | null
          id?: string
          list_source: string
          name: string
          reason?: string | null
        }
        Update: {
          country_code?: string | null
          id?: string
          list_source?: string
          name?: string
          reason?: string | null
        }
        Relationships: []
      }
      duty_rates: {
        Row: {
          destination_country: string
          duty_pct: number
          hs_prefix: string
          id: string
          note: string | null
          vat_pct: number
        }
        Insert: {
          destination_country: string
          duty_pct?: number
          hs_prefix: string
          id?: string
          note?: string | null
          vat_pct?: number
        }
        Update: {
          destination_country?: string
          duty_pct?: number
          hs_prefix?: string
          id?: string
          note?: string | null
          vat_pct?: number
        }
        Relationships: []
      }
      hs_codes: {
        Row: {
          chapter: string
          code: string
          description: string
          keywords: string[]
          unit: string | null
        }
        Insert: {
          chapter: string
          code: string
          description: string
          keywords?: string[]
          unit?: string | null
        }
        Update: {
          chapter?: string
          code?: string
          description?: string
          keywords?: string[]
          unit?: string | null
        }
        Relationships: []
      }
      organizations: {
        Row: {
          address: string | null
          contact_email: string | null
          country_code: string
          created_at: string
          entity_type: Database["public"]["Enums"]["entity_type"]
          eori_no: string | null
          id: string
          legal_name: string
          owner_id: string
          pi_username: string | null
          registration_no: string | null
          tax_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          country_code: string
          created_at?: string
          entity_type?: Database["public"]["Enums"]["entity_type"]
          eori_no?: string | null
          id?: string
          legal_name: string
          owner_id: string
          pi_username?: string | null
          registration_no?: string | null
          tax_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          country_code?: string
          created_at?: string
          entity_type?: Database["public"]["Enums"]["entity_type"]
          eori_no?: string | null
          id?: string
          legal_name?: string
          owner_id?: string
          pi_username?: string | null
          registration_no?: string | null
          tax_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          country_code: string | null
          created_at: string
          display_name: string | null
          id: string
          pi_username: string | null
          updated_at: string
        }
        Insert: {
          country_code?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          pi_username?: string | null
          updated_at?: string
        }
        Update: {
          country_code?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          pi_username?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      trade_contracts: {
        Row: {
          amount_pi: number
          buyer_legal_name: string | null
          buyer_org_id: string | null
          buyer_user_id: string | null
          carrier: string | null
          category: string | null
          compliance_notes: string | null
          container_no: string | null
          contract_value: number
          counterparty_email: string | null
          created_at: string
          created_by: string
          currency: string
          destination_country: string
          duty_estimate: number | null
          eta: string | null
          etd: string | null
          funded_at: string | null
          goods_description: string
          gross_weight_kg: number | null
          hs_code: string | null
          id: string
          incoterm: Database["public"]["Enums"]["incoterm_2020"]
          insurance_clauses: string | null
          insured_value: number | null
          insurer: string | null
          named_place: string | null
          net_weight_kg: number | null
          origin_country: string
          package_count: number | null
          payment_terms: string | null
          pi_payment_id: string | null
          pi_txid: string | null
          policy_no: string | null
          port_of_discharge: string | null
          port_of_loading: string | null
          quantity: number
          reference: string
          seller_legal_name: string | null
          seller_org_id: string | null
          seller_user_id: string | null
          status: Database["public"]["Enums"]["contract_status"]
          title: string
          transport_doc_no: string | null
          transport_mode: Database["public"]["Enums"]["transport_mode"]
          unit: string
          updated_at: string
          vat_estimate: number | null
          vessel_or_flight: string | null
          volume_m3: number | null
        }
        Insert: {
          amount_pi?: number
          buyer_legal_name?: string | null
          buyer_org_id?: string | null
          buyer_user_id?: string | null
          carrier?: string | null
          category?: string | null
          compliance_notes?: string | null
          container_no?: string | null
          contract_value?: number
          counterparty_email?: string | null
          created_at?: string
          created_by: string
          currency?: string
          destination_country: string
          duty_estimate?: number | null
          eta?: string | null
          etd?: string | null
          funded_at?: string | null
          goods_description: string
          gross_weight_kg?: number | null
          hs_code?: string | null
          id?: string
          incoterm?: Database["public"]["Enums"]["incoterm_2020"]
          insurance_clauses?: string | null
          insured_value?: number | null
          insurer?: string | null
          named_place?: string | null
          net_weight_kg?: number | null
          origin_country: string
          package_count?: number | null
          payment_terms?: string | null
          pi_payment_id?: string | null
          pi_txid?: string | null
          policy_no?: string | null
          port_of_discharge?: string | null
          port_of_loading?: string | null
          quantity?: number
          reference?: string
          seller_legal_name?: string | null
          seller_org_id?: string | null
          seller_user_id?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          title: string
          transport_doc_no?: string | null
          transport_mode?: Database["public"]["Enums"]["transport_mode"]
          unit?: string
          updated_at?: string
          vat_estimate?: number | null
          vessel_or_flight?: string | null
          volume_m3?: number | null
        }
        Update: {
          amount_pi?: number
          buyer_legal_name?: string | null
          buyer_org_id?: string | null
          buyer_user_id?: string | null
          carrier?: string | null
          category?: string | null
          compliance_notes?: string | null
          container_no?: string | null
          contract_value?: number
          counterparty_email?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          destination_country?: string
          duty_estimate?: number | null
          eta?: string | null
          etd?: string | null
          funded_at?: string | null
          goods_description?: string
          gross_weight_kg?: number | null
          hs_code?: string | null
          id?: string
          incoterm?: Database["public"]["Enums"]["incoterm_2020"]
          insurance_clauses?: string | null
          insured_value?: number | null
          insurer?: string | null
          named_place?: string | null
          net_weight_kg?: number | null
          origin_country?: string
          package_count?: number | null
          payment_terms?: string | null
          pi_payment_id?: string | null
          pi_txid?: string | null
          policy_no?: string | null
          port_of_discharge?: string | null
          port_of_loading?: string | null
          quantity?: number
          reference?: string
          seller_legal_name?: string | null
          seller_org_id?: string | null
          seller_user_id?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          title?: string
          transport_doc_no?: string | null
          transport_mode?: Database["public"]["Enums"]["transport_mode"]
          unit?: string
          updated_at?: string
          vat_estimate?: number | null
          vessel_or_flight?: string | null
          volume_m3?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trade_contracts_buyer_org_id_fkey"
            columns: ["buyer_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_contracts_seller_org_id_fkey"
            columns: ["seller_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_contract_party: { Args: { _contract_id: string }; Returns: boolean }
    }
    Enums: {
      contract_status:
        | "draft"
        | "pending_counterparty"
        | "signed"
        | "funded"
        | "in_transit"
        | "customs"
        | "delivered"
        | "completed"
        | "cancelled"
        | "disputed"
      entity_type: "individual" | "company" | "institution" | "government"
      incoterm_2020:
        | "EXW"
        | "FCA"
        | "FAS"
        | "FOB"
        | "CFR"
        | "CIF"
        | "CPT"
        | "CIP"
        | "DAP"
        | "DPU"
        | "DDP"
      screening_outcome: "clear" | "review" | "blocked"
      trade_doc_type:
        | "commercial_invoice"
        | "packing_list"
        | "certificate_of_origin"
        | "bill_of_lading"
        | "air_waybill"
        | "insurance_certificate"
        | "inspection_certificate"
        | "phytosanitary"
        | "export_licence"
        | "customs_declaration"
        | "other"
      transport_mode: "sea" | "air" | "road" | "rail" | "multimodal" | "post"
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
      contract_status: [
        "draft",
        "pending_counterparty",
        "signed",
        "funded",
        "in_transit",
        "customs",
        "delivered",
        "completed",
        "cancelled",
        "disputed",
      ],
      entity_type: ["individual", "company", "institution", "government"],
      incoterm_2020: [
        "EXW",
        "FCA",
        "FAS",
        "FOB",
        "CFR",
        "CIF",
        "CPT",
        "CIP",
        "DAP",
        "DPU",
        "DDP",
      ],
      screening_outcome: ["clear", "review", "blocked"],
      trade_doc_type: [
        "commercial_invoice",
        "packing_list",
        "certificate_of_origin",
        "bill_of_lading",
        "air_waybill",
        "insurance_certificate",
        "inspection_certificate",
        "phytosanitary",
        "export_licence",
        "customs_declaration",
        "other",
      ],
      transport_mode: ["sea", "air", "road", "rail", "multimodal", "post"],
    },
  },
} as const
