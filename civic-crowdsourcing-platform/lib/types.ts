// ============================================================
// Civic Crowdsourcing Platform — Shared Types
// ============================================================

export type UserRole = 'citizen' | 'official' | 'editor' | 'admin';
export type IssueCategory = 'pothole' | 'streetlight' | 'water_tap' | 'bus_stop' | 'garbage' | 'other';
export type IssueStatus = 'pending' | 'threshold_met' | 'in_progress' | 'resolved';
export type RatingColor = 'red' | 'yellow' | 'green';
export type OfficialRole = 'worker' | 'engineer' | 'corporator' | 'mla' | 'minister' | 'cm';
export type ResponseAction = 'acknowledged' | 'work_started' | 'resolved';

export interface User {
  id: string;
  phone: string;             // masked in public responses
  role: UserRole;
  home_gps?: { lat: number; lng: number };
  preferred_language: string;
  created_at: string;
}

export interface Issue {
  id: string;
  photo_url: string;
  gps_coords: { lat: number; lng: number };
  category: IssueCategory;
  description_original: string;
  description_formal?: string;
  language_detected?: string;
  status: IssueStatus;
  created_by: string;
  created_at: string;
}

export interface IssueDetail extends Issue {
  rating_counts: { red: number; yellow: number; green: number; total: number };
  threshold_progress: number;  // 0-50
  officials: { name: string; role: OfficialRole }[];
  timeline: TimelineEntry[];
}

export interface TimelineEntry {
  action: ResponseAction;
  name: string;
  role: OfficialRole;
  message?: string;
  timestamp: string;
}

export interface Official {
  id: string;
  name: string;
  role: OfficialRole;
  phone?: string;      // NEVER exposed in public API
  email?: string;      // NEVER exposed in public API
  whatsapp?: string;   // NEVER exposed in public API
  geo_region: GeoJSON.Polygon;
  ward_number?: string;
  municipality?: string;
  state?: string;
  country?: string;
  is_verified: boolean;
}

// Public-safe official (no contact info)
export type PublicOfficial = Pick<Official, 'id' | 'name' | 'role' | 'ward_number' | 'municipality' | 'state'>;

export interface NotificationLog {
  id: string;
  issue_id: string;
  officials_notified: { id: string; name: string; role: OfficialRole; channel: string; delivery_status: string }[];
  pdf_url?: string;
  sent_at: string;
  delivery_status: string;
}

export interface OfficialResponse {
  id: string;
  issue_id: string;
  official_id: string;
  status_update: ResponseAction;
  message?: string;
  updated_at: string;
}
