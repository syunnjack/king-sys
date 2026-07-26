"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { cancelReservation, checkInReservation, createReservation, joinQueue } from "@/lib/data";

export async function createReservationAction(shopId: number, shopSlug: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/shops/${shopSlug}`);

  const tableTypeId = Number(formData.get("tableTypeId"));
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const partySize = Number(formData.get("partySize") ?? 1);

  if (!tableTypeId || !date || !time) {
    redirect(`/shops/${shopSlug}?error=invalid`);
  }

  const startAt = new Date(`${date}T${time}:00`);
  const { error } = await createReservation({ shopId, tableTypeId, customerId: user.id, partySize, startAt });

  if (error) redirect(`/shops/${shopSlug}?error=${encodeURIComponent(error)}`);
  redirect("/dashboard/customer");
}

export async function joinQueueAction(shopId: number, shopSlug: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/shops/${shopSlug}`);

  const partySize = Number(formData.get("partySize") ?? 1);
  const { error } = await joinQueue({ shopId, customerId: user.id, partySize });
  if (error) redirect(`/shops/${shopSlug}?error=${encodeURIComponent(error)}`);
  redirect("/dashboard/customer");
}

export async function checkInAction(reservationId: number) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await checkInReservation(reservationId, user.id);
  revalidatePath("/dashboard/customer");
}

export async function cancelReservationAction(reservationId: number) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await cancelReservation(reservationId, user.id);
  revalidatePath("/dashboard/customer");
}
