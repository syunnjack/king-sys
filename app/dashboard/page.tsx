import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getShopByOwner, getStaffMembershipsForUser } from "@/lib/data";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const shop = await getShopByOwner(user.id);
  if (shop) redirect("/dashboard/owner");

  const staffMemberships = await getStaffMembershipsForUser(user.id);
  if (staffMemberships.length > 0) redirect("/dashboard/staff");

  redirect("/dashboard/customer");
}
