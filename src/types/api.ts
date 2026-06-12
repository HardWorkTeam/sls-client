export interface Paginated<T> {
  data: T[];
  links: { first: string | null; last: string | null; prev: string | null; next: string | null };
  meta: {
    current_page: number;
    from: number | null;
    last_page: number;
    per_page: number;
    to: number | null;
    total: number;
  };
}

export interface Permission {
  id: number;
  key: string;
  description: string | null;
}

export interface Role {
  id: number;
  key: "super_admin" | "organizer" | "couple" | string;
  name: string;
  permissions?: Permission[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  avatar_path: string | null;
  is_active: boolean;
  roles?: Role[];
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export type WeddingStatus = "draft" | "published" | "completed" | "cancelled";

export interface Package {
  id: number;
  name: string;
  description: string | null;
  price: number | null;
  currency: string | null;
  features: string[] | null;
  is_active: boolean;
}

export interface InvitationTemplate {
  id: number;
  slug: string;
  name: string;
  preview_image_path: string | null;
  config: Record<string, unknown> | null;
  is_active: boolean;
}

export interface WeddingMember {
  id: number;
  wedding_id: number;
  member_role: "bride" | "groom" | "organizer";
  is_primary: boolean;
  user?: User;
}

export interface Wedding {
  id: number;
  wedding_code: string;
  wedding_name: string;
  bride_name: string;
  groom_name: string;
  bride_photo_path: string | null;
  groom_photo_path: string | null;
  phone: string | null;
  email: string | null;
  wedding_date: string | null;
  wedding_time: string | null;
  ceremony_venue: string | null;
  reception_venue: string | null;
  google_map_link: string | null;
  story_description: string | null;
  status: WeddingStatus;
  published_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  package?: Package | null;
  created_by?: User | null;
  members?: WeddingMember[];
  guests_count?: number;
  invitations_count?: number;
  created_at?: string;
  updated_at?: string;
}

export type InvitationStatus = "draft" | "published" | "archived";

export interface Invitation {
  id: number;
  wedding_id: number;
  invitation_code: string;
  title: string | null;
  cover_image_path: string | null;
  settings: Record<string, unknown> | null;
  status: InvitationStatus;
  published_at: string | null;
  public_url: string;
  template?: InvitationTemplate | null;
  guests_count?: number;
  rsvp_responses_count?: number;
  created_at?: string;
}

export type GuestGroupType = "family" | "friends" | "vip" | "company" | "custom";

export interface GuestGroup {
  id: number;
  wedding_id: number;
  name: string;
  type: GuestGroupType;
  sort_order: number;
  guests_count?: number;
}

export interface WeddingTable {
  id: number;
  wedding_id: number;
  table_name: string;
  table_number: number | null;
  capacity: number;
  layout: Record<string, unknown> | null;
  seatings?: GuestSeating[];
  seatings_count?: number;
}

export interface GuestSeating {
  id: number;
  guest_id: number;
  wedding_table_id: number;
  seat_number: number | null;
  table?: WeddingTable;
  guest?: Guest;
}

export interface Guest {
  id: number;
  wedding_id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  note: string | null;
  is_vip: boolean;
  group?: GuestGroup | null;
  invitation?: Invitation | null;
  seating?: GuestSeating | null;
  rsvp_responses_count?: number;
  created_at?: string;
}

export type RsvpStatus = "pending" | "accepted" | "declined" | "maybe";

export interface RsvpResponse {
  id: number;
  wedding_id: number;
  invitation_id: number;
  guest_id: number | null;
  guest_name: string;
  phone: string | null;
  number_of_guests: number;
  message: string | null;
  status: RsvpStatus;
  responded_at: string | null;
  guest?: Guest | null;
  invitation?: Invitation | null;
  created_at?: string;
}

export interface RsvpStats {
  total_guests: number;
  confirmed: number;
  declined: number;
  maybe: number;
  pending: number;
  expected_attendees: number;
}

export type GiftType = "cash" | "bank_transfer" | "item";

export interface Gift {
  id: number;
  wedding_id: number;
  guest_id: number | null;
  gift_type: GiftType;
  amount: number | null;
  item_name: string | null;
  note: string | null;
  received_at: string | null;
  guest?: Guest | null;
}

export interface GiftSummary {
  total_gifts: number;
  total_cash_amount: number;
  by_type: Record<GiftType, { count: number; amount: number }>;
}

export type TimelineCategory =
  | "engagement"
  | "ceremony"
  | "reception"
  | "after_party"
  | "custom";

export interface TimelineEvent {
  id: number;
  wedding_id: number;
  category: TimelineCategory;
  title: string;
  description: string | null;
  starts_at: string | null;
  location: string | null;
  sort_order: number;
  is_public: boolean;
}

export interface Album {
  id: number;
  wedding_id: number;
  name: string;
  description: string | null;
  is_public: boolean;
  media_items_count?: number;
  media_items?: MediaItem[];
}

export interface MediaItem {
  id: number;
  wedding_id: number;
  album_id: number | null;
  media_type: "photo" | "video";
  url: string;
  thumbnail_url: string | null;
  original_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  is_public: boolean;
  album?: Album | null;
  uploaded_by?: User | null;
  created_at?: string;
}

export type AnnouncementChannel = "email" | "sms" | "in_app";
export type AnnouncementStatus = "draft" | "scheduled" | "sending" | "sent" | "failed";

export interface Announcement {
  id: number;
  wedding_id: number;
  title: string;
  body: string;
  channel: AnnouncementChannel;
  status: AnnouncementStatus;
  scheduled_at: string | null;
  sent_at: string | null;
  created_by?: User | null;
  notification_logs_count?: number;
  created_at?: string;
}

export interface DashboardOverview {
  cards: {
    total_weddings: number;
    total_guests: number;
    total_rsvp: number;
    attendance_rate: number;
  };
  charts: {
    rsvp_trend: { date: string; total: number }[];
    guest_distribution: Record<string, number>;
    wedding_status: Record<WeddingStatus, number>;
  };
}

export interface WeddingDashboard {
  rsvp: RsvpStats;
  rsvp_trend: { date: string; accepted: number; declined: number; maybe: number }[];
  gifts: GiftSummary;
  guests_by_group: { group: string; type: GuestGroupType; total: number }[];
  tables: { total: number; capacity: number };
}

export interface SeatingReport {
  tables: {
    id: number;
    table_name: string;
    table_number: number | null;
    capacity: number;
    seated: number;
    available: number | null;
  }[];
  total_capacity: number;
  total_seated: number;
  unseated_guests: number;
}
