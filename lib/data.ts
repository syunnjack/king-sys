import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Shop, TableType, StaffMember } from "@/lib/types";

function randomCheckinCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function getShopByOwner(ownerId: string): Promise<Shop | null> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase.from("kng_shops").select("*").eq("owner_id", ownerId).maybeSingle();
  return data;
}

export async function getShopBySlug(slug: string): Promise<Shop | null> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase.from("kng_shops").select("*").eq("slug", slug).maybeSingle();
  return data;
}

export async function getShopById(shopId: number): Promise<Shop | null> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase.from("kng_shops").select("*").eq("id", shopId).maybeSingle();
  return data;
}

export async function listShops(): Promise<Shop[]> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase.from("kng_shops").select("*").order("id");
  return data ?? [];
}

export async function createShop(params: {
  ownerId: string;
  name: string;
  slug: string;
  description?: string;
  address?: string;
  phone?: string;
}): Promise<{ shop: Shop | null; error: string | null }> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("kng_shops")
    .insert({
      owner_id: params.ownerId,
      name: params.name,
      slug: params.slug,
      description: params.description ?? null,
      address: params.address ?? null,
      phone: params.phone ?? null,
    })
    .select("*")
    .single();
  if (error) {
    return {
      shop: null,
      error: error.code === "23505" ? "このURL(スラッグ)は既に使われています。" : "作成に失敗しました。",
    };
  }
  return { shop: data, error: null };
}

export async function getTableTypes(shopId: number): Promise<TableType[]> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase.from("kng_table_types").select("*").eq("shop_id", shopId).order("id");
  return data ?? [];
}

export async function createTableType(params: {
  shopId: number;
  name: string;
  capacityMin: number;
  capacityMax: number;
  quantity: number;
  reservableRatio: number;
}) {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("kng_table_types").insert({
    shop_id: params.shopId,
    name: params.name,
    capacity_min: params.capacityMin,
    capacity_max: params.capacityMax,
    quantity: params.quantity,
    reservable_ratio: params.reservableRatio,
  });
  return { error: error ? "卓タイプの追加に失敗しました。" : null };
}

export async function getStaffMembers(shopId: number): Promise<StaffMember[]> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase.from("kng_staff_members").select("*").eq("shop_id", shopId).order("id");
  return data ?? [];
}

export async function inviteStaff(shopId: number, email: string, displayName?: string) {
  const supabase = createServiceRoleClient();
  const { data: profile } = await supabase.from("kng_profiles").select("id").eq("email", email).maybeSingle();
  const { error } = await supabase.from("kng_staff_members").insert({
    shop_id: shopId,
    email,
    display_name: displayName ?? null,
    user_id: profile?.id ?? null,
  });
  return { error: error ? (error.code === "23505" ? "既に招待済みです。" : "招待に失敗しました。") : null };
}

export async function getStaffMembershipsForUser(userId: string) {
  const supabase = createServiceRoleClient();
  const { data } = await supabase.from("kng_staff_members").select("*, shop:kng_shops(*)").eq("user_id", userId);
  return data ?? [];
}

export async function linkStaffInvitesForNewUser(userId: string, email: string) {
  const supabase = createServiceRoleClient();
  await supabase.from("kng_staff_members").update({ user_id: userId }).eq("email", email).is("user_id", null);
}

// 予約可能な残数を計算する。table_type.quantity のうち reservable_ratio 分だけを
// 事前予約に割り当て、残りは当日行列(kng_queue_entries)用に確保する。
export async function getSlotAvailability(
  tableTypeId: number,
  startAt: Date
): Promise<{ capacity: number; reserved: number; available: number }> {
  const supabase = createServiceRoleClient();
  const { data: tableType } = await supabase
    .from("kng_table_types")
    .select("quantity, reservable_ratio")
    .eq("id", tableTypeId)
    .single();
  if (!tableType) return { capacity: 0, reserved: 0, available: 0 };

  const capacity = Math.max(1, Math.floor(tableType.quantity * tableType.reservable_ratio));

  const { count } = await supabase
    .from("kng_reservations")
    .select("id", { count: "exact", head: true })
    .eq("table_type_id", tableTypeId)
    .eq("start_at", startAt.toISOString())
    .not("status", "in", "(cancelled,no_show)");

  const reserved = count ?? 0;
  return { capacity, reserved, available: Math.max(0, capacity - reserved) };
}

// 指定日の全卓タイプ×全時間帯の空き枠を一括計算する(店舗ページ表示用)。
export async function getDayAvailability(
  shopId: number,
  tableTypes: TableType[],
  dateStr: string
): Promise<Map<string, number>> {
  const supabase = createServiceRoleClient();
  const dayStart = new Date(`${dateStr}T00:00:00`);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const { data: reservations } = await supabase
    .from("kng_reservations")
    .select("table_type_id, start_at")
    .eq("shop_id", shopId)
    .gte("start_at", dayStart.toISOString())
    .lt("start_at", dayEnd.toISOString())
    .not("status", "in", "(cancelled,no_show)");

  const reservedCounts = new Map<string, number>();
  for (const reservation of reservations ?? []) {
    const key = `${reservation.table_type_id}|${reservation.start_at}`;
    reservedCounts.set(key, (reservedCounts.get(key) ?? 0) + 1);
  }

  const availability = new Map<string, number>();
  for (const tableType of tableTypes) {
    const capacity = Math.max(1, Math.floor(tableType.quantity * tableType.reservable_ratio));
    const times = buildSlotTimes(15);
    for (const time of times) {
      const startAt = new Date(`${dateStr}T${time}:00`);
      const key = `${tableType.id}|${time}`;
      const reserved = reservedCounts.get(`${tableType.id}|${startAt.toISOString()}`) ?? 0;
      availability.set(key, Math.max(0, capacity - reserved));
    }
  }
  return availability;
}

export function buildSlotTimes(intervalMinutes: number, openHour = 11, closeHour = 22): string[] {
  const slots: string[] = [];
  for (let minutes = openHour * 60; minutes < closeHour * 60; minutes += intervalMinutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
  return slots;
}

export async function createReservation(params: {
  shopId: number;
  tableTypeId: number;
  customerId: string;
  partySize: number;
  startAt: Date;
}) {
  const availability = await getSlotAvailability(params.tableTypeId, params.startAt);
  if (availability.available <= 0) {
    return { error: "その時間帯は満席です。他の時間をお選びください。", reservation: null };
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("kng_reservations")
    .insert({
      shop_id: params.shopId,
      table_type_id: params.tableTypeId,
      customer_id: params.customerId,
      party_size: params.partySize,
      start_at: params.startAt.toISOString(),
      checkin_code: randomCheckinCode(),
    })
    .select("*")
    .single();
  if (error) return { error: "予約に失敗しました。", reservation: null };
  return { error: null, reservation: data };
}

export async function getReservation(reservationId: number) {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("kng_reservations")
    .select("*, shop:kng_shops(name, slug, checkin_grace_minutes), table_type:kng_table_types(name)")
    .eq("id", reservationId)
    .maybeSingle();
  return data;
}

export async function checkInReservation(reservationId: number, customerId: string) {
  const supabase = createServiceRoleClient();
  const { data: reservation } = await supabase
    .from("kng_reservations")
    .select("customer_id, status")
    .eq("id", reservationId)
    .single();
  if (!reservation || reservation.customer_id !== customerId) return { error: "予約が見つかりません。" };
  if (reservation.status !== "reserved") return { error: "この予約はチェックインできません。" };

  await supabase
    .from("kng_reservations")
    .update({ status: "checked_in", checked_in_at: new Date().toISOString() })
    .eq("id", reservationId);
  return { error: null };
}

export async function cancelReservation(reservationId: number, customerId: string) {
  const supabase = createServiceRoleClient();
  await supabase
    .from("kng_reservations")
    .update({ status: "cancelled" })
    .eq("id", reservationId)
    .eq("customer_id", customerId);
}

export async function getCustomerReservations(customerId: string) {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("kng_reservations")
    .select("*, shop:kng_shops(name, slug), table_type:kng_table_types(name)")
    .eq("customer_id", customerId)
    .order("start_at", { ascending: false });
  return data ?? [];
}

export async function joinQueue(params: {
  shopId: number;
  customerId: string;
  partySize: number;
  tableTypeId?: number;
}) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("kng_queue_entries")
    .insert({
      shop_id: params.shopId,
      customer_id: params.customerId,
      party_size: params.partySize,
      table_type_id: params.tableTypeId ?? null,
    })
    .select("*")
    .single();
  return { error: error ? "行列への登録に失敗しました。" : null, entry: data };
}

export async function getCustomerQueueEntries(customerId: string) {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("kng_queue_entries")
    .select("*, shop:kng_shops(name, slug)")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

// スタッフ用の本日ボード: チェックイン済み予約(先頭確約)を最優先、
// 次に当日行列を並び順(先着)で返す。
export async function getShopBoard(shopId: number) {
  const supabase = createServiceRoleClient();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  const { data: reservations } = await supabase
    .from("kng_reservations")
    .select("*, customer:kng_profiles(full_name, email, phone), table_type:kng_table_types(name)")
    .eq("shop_id", shopId)
    .gte("start_at", startOfDay.toISOString())
    .lt("start_at", endOfDay.toISOString())
    .order("start_at", { ascending: true });

  const { data: queueEntries } = await supabase
    .from("kng_queue_entries")
    .select("*, customer:kng_profiles(full_name, email, phone), table_type:kng_table_types(name)")
    .eq("shop_id", shopId)
    .gte("created_at", startOfDay.toISOString())
    .order("created_at", { ascending: true });

  return { reservations: reservations ?? [], queueEntries: queueEntries ?? [] };
}

export async function callReservation(reservationId: number) {
  const supabase = createServiceRoleClient();
  await supabase
    .from("kng_reservations")
    .update({ status: "called", called_at: new Date().toISOString() })
    .eq("id", reservationId);
}

export async function seatReservation(reservationId: number) {
  const supabase = createServiceRoleClient();
  await supabase
    .from("kng_reservations")
    .update({ status: "seated", seated_at: new Date().toISOString() })
    .eq("id", reservationId);
}

export async function markReservationNoShow(reservationId: number) {
  const supabase = createServiceRoleClient();
  await supabase.from("kng_reservations").update({ status: "no_show" }).eq("id", reservationId);
}

export async function callQueueEntry(entryId: number) {
  const supabase = createServiceRoleClient();
  await supabase.from("kng_queue_entries").update({ status: "called", called_at: new Date().toISOString() }).eq("id", entryId);
}

export async function seatQueueEntry(entryId: number) {
  const supabase = createServiceRoleClient();
  await supabase.from("kng_queue_entries").update({ status: "seated", seated_at: new Date().toISOString() }).eq("id", entryId);
}

export async function markQueueEntryNoShow(entryId: number) {
  const supabase = createServiceRoleClient();
  await supabase.from("kng_queue_entries").update({ status: "no_show" }).eq("id", entryId);
}

export async function getShopAnalytics(shopId: number) {
  const supabase = createServiceRoleClient();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: reservations } = await supabase
    .from("kng_reservations")
    .select("status")
    .eq("shop_id", shopId)
    .gte("created_at", since);

  const total = reservations?.length ?? 0;
  const noShow = reservations?.filter((r) => r.status === "no_show").length ?? 0;
  const seated = reservations?.filter((r) => r.status === "seated").length ?? 0;

  return {
    totalReservations: total,
    noShowCount: noShow,
    noShowRate: total > 0 ? Math.round((noShow / total) * 1000) / 10 : 0,
    seatedCount: seated,
  };
}
