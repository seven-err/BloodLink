export type UserRole = 'donor' | 'recipient' | 'bloodbank' | 'admin';

export type BloodType =
  | 'A+'
  | 'A-'
  | 'B+'
  | 'B-'
  | 'AB+'
  | 'AB-'
  | 'O+'
  | 'O-';

export type BloodRequestStatus =
  | 'draft'
  | 'open'
  | 'matched'
  | 'fulfilled'
  | 'cancelled'
  | 'expired';

export type DonorVerificationStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'expired';

export type DonorMatchStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'cancelled'
  | 'completed';

export type DonationStatus =
  | 'scheduled'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type NotificationType =
  | 'blood_request'
  | 'donor_match'
  | 'donation'
  | 'verification'
  | 'system';

export type MessageStatus = 'sent' | 'read' | 'archived';

export type AvailabilityStatus = 'available' | 'unavailable' | 'scheduled';

export type ReportStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed';

export type ReportType =
  | 'user'
  | 'blood_request'
  | 'message'
  | 'donation'
  | 'system';

export type AnalyticsEventType =
  | 'screen_view'
  | 'auth'
  | 'blood_request'
  | 'donation'
  | 'matching'
  | 'notification'
  | 'system';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          full_name: string;
          phone: string | null;
          blood_type: BloodType | null;
          birthdate: string | null;
          organization_name: string | null;
          avatar_path: string | null;
          latitude: number | null;
          longitude: number | null;
          address: string | null;
          is_available: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: UserRole;
          full_name: string;
          phone?: string | null;
          blood_type?: BloodType | null;
          birthdate?: string | null;
          organization_name?: string | null;
          avatar_path?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          address?: string | null;
          is_available?: boolean;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: NotificationType;
          title: string;
          body: string;
          data: Json;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: NotificationType;
          title: string;
          body: string;
          data?: Json;
          read_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          sender_id: string;
          recipient_id: string;
          blood_request_id: string | null;
          donor_match_id: string | null;
          body: string;
          status: MessageStatus;
          read_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          recipient_id: string;
          blood_request_id?: string | null;
          donor_match_id?: string | null;
          body: string;
          status?: MessageStatus;
          read_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
        Relationships: [];
      };
      availability: {
        Row: {
          id: string;
          user_id: string;
          status: AvailabilityStatus;
          starts_at: string;
          ends_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          status?: AvailabilityStatus;
          starts_at: string;
          ends_at?: string | null;
          notes?: string | null;
        };
        Update: Partial<Database['public']['Tables']['availability']['Insert']>;
        Relationships: [];
      };
      faqs: {
        Row: {
          id: string;
          question: string;
          answer: string;
          category: string;
          display_order: number;
          is_published: boolean;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          question: string;
          answer: string;
          category?: string;
          display_order?: number;
          is_published?: boolean;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: Partial<Database['public']['Tables']['faqs']['Insert']>;
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          reported_user_id: string | null;
          blood_request_id: string | null;
          message_id: string | null;
          donation_id: string | null;
          type: ReportType;
          status: ReportStatus;
          reason: string;
          details: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          resolution_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          reported_user_id?: string | null;
          blood_request_id?: string | null;
          message_id?: string | null;
          donation_id?: string | null;
          type: ReportType;
          status?: ReportStatus;
          reason: string;
          details?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          resolution_notes?: string | null;
        };
        Update: Partial<Database['public']['Tables']['reports']['Insert']>;
        Relationships: [];
      };
      analytics: {
        Row: {
          id: string;
          user_id: string | null;
          event_type: AnalyticsEventType;
          event_name: string;
          metadata: Json;
          occurred_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          event_type: AnalyticsEventType;
          event_name: string;
          metadata?: Json;
          occurred_at?: string;
        };
        Update: Partial<Database['public']['Tables']['analytics']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      nearby_eligible_donors: {
        Args: {
          request_id: string;
          radius_km?: number;
          max_results?: number;
        };
        Returns: {
          donor_id: string;
          full_name: string;
          blood_type: BloodType;
          distance_meters: number;
        }[];
      };
    };
    Enums: {
      analytics_event_type: AnalyticsEventType;
      availability_status: AvailabilityStatus;
      blood_request_status: BloodRequestStatus;
      blood_type: BloodType;
      donation_status: DonationStatus;
      donor_match_status: DonorMatchStatus;
      donor_verification_status: DonorVerificationStatus;
      message_status: MessageStatus;
      notification_type: NotificationType;
      report_status: ReportStatus;
      report_type: ReportType;
      user_role: UserRole;
    };
    CompositeTypes: Record<string, never>;
  };
};

