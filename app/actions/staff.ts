"use server";

import { revalidatePath } from "next/cache";
import {
  callQueueEntry,
  callReservation,
  markQueueEntryNoShow,
  markReservationNoShow,
  seatQueueEntry,
  seatReservation,
} from "@/lib/data";

export async function callReservationAction(reservationId: number) {
  await callReservation(reservationId);
  revalidatePath("/dashboard/staff");
}

export async function seatReservationAction(reservationId: number) {
  await seatReservation(reservationId);
  revalidatePath("/dashboard/staff");
}

export async function noShowReservationAction(reservationId: number) {
  await markReservationNoShow(reservationId);
  revalidatePath("/dashboard/staff");
}

export async function callQueueAction(entryId: number) {
  await callQueueEntry(entryId);
  revalidatePath("/dashboard/staff");
}

export async function seatQueueAction(entryId: number) {
  await seatQueueEntry(entryId);
  revalidatePath("/dashboard/staff");
}

export async function noShowQueueAction(entryId: number) {
  await markQueueEntryNoShow(entryId);
  revalidatePath("/dashboard/staff");
}
