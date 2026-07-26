export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
}

export interface Shop {
  id: number;
  owner_id: string;
  slug: string;
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  slot_interval_minutes: number;
  checkin_grace_minutes: number;
}

export interface TableType {
  id: number;
  shop_id: number;
  name: string;
  capacity_min: number;
  capacity_max: number;
  quantity: number;
  reservable_ratio: number;
}

export interface StaffMember {
  id: number;
  shop_id: number;
  email: string;
  user_id: string | null;
  display_name: string | null;
}

export type ReservationStatus = "reserved" | "checked_in" | "called" | "seated" | "cancelled" | "no_show";

export interface Reservation {
  id: number;
  shop_id: number;
  table_type_id: number;
  customer_id: string;
  party_size: number;
  start_at: string;
  status: ReservationStatus;
  checkin_code: string;
  checked_in_at: string | null;
}

export type QueueStatus = "waiting" | "called" | "seated" | "no_show" | "cancelled";

export interface QueueEntry {
  id: number;
  shop_id: number;
  table_type_id: number | null;
  customer_id: string;
  party_size: number;
  status: QueueStatus;
  created_at: string;
}
