"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createShop, createTableType, inviteStaff } from "@/lib/data";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

export async function createShopAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  const baseSlug = slugify(name) || `shop-${Date.now()}`;
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

  const { error } = await createShop({ ownerId: user.id, name, slug, description, address, phone });
  if (error) redirect(`/dashboard/owner?error=${encodeURIComponent(error)}`);
  revalidatePath("/dashboard/owner");
  redirect("/dashboard/owner");
}

export async function createTableTypeAction(shopId: number, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const capacityMin = Number(formData.get("capacityMin") ?? 1);
  const capacityMax = Number(formData.get("capacityMax") ?? 4);
  const quantity = Number(formData.get("quantity") ?? 1);
  const reservableRatio = Number(formData.get("reservableRatio") ?? 30) / 100;

  await createTableType({ shopId, name, capacityMin, capacityMax, quantity, reservableRatio });
  revalidatePath("/dashboard/owner");
}

export async function inviteStaffAction(shopId: number, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const displayName = String(formData.get("displayName") ?? "").trim();
  await inviteStaff(shopId, email, displayName);
  revalidatePath("/dashboard/owner");
}
