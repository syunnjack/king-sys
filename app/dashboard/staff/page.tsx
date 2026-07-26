import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getStaffMembershipsForUser, getShopBoard } from "@/lib/data";
import { signOut } from "@/app/actions/auth";
import {
  callQueueAction,
  callReservationAction,
  noShowQueueAction,
  noShowReservationAction,
  seatQueueAction,
  seatReservationAction,
} from "@/app/actions/staff";

const STATUS_LABEL: Record<string, string> = {
  reserved: "予約済み",
  checked_in: "チェックイン済み(先頭確約)",
  called: "呼出中",
  seated: "着席済み",
  cancelled: "キャンセル",
  no_show: "ノーショー",
  waiting: "待機中",
};

export default async function StaffDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const memberships = await getStaffMembershipsForUser(user.id);
  if (memberships.length === 0) redirect("/dashboard/customer");

  const boards = await Promise.all(
    memberships.map(async (membership: any) => ({
      membership,
      board: await getShopBoard(membership.shop_id),
    }))
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">スタッフ用 本日ボード</p>
          <h1 className="text-2xl font-bold text-slate-900">受付・呼び出し管理</h1>
        </div>
        <form action={signOut}>
          <button type="submit" className="text-sm text-slate-500 underline">
            ログアウト
          </button>
        </form>
      </div>

      {boards.map(({ membership, board }) => {
        // チェックイン済み予約(先頭確約)を最優先、次に予約待ち、最後に行列
        const sortedReservations = [...board.reservations].sort((a: any, b: any) => {
          const priority = (status: string) => (status === "checked_in" ? 0 : status === "called" ? 1 : 2);
          return priority(a.status) - priority(b.status);
        });

        return (
          <section key={membership.id} className="mt-8">
            <h2 className="text-lg font-bold text-slate-900">{membership.shop.name}</h2>

            <h3 className="mt-4 text-sm font-bold text-slate-700">予約(枠予約)</h3>
            <ul className="mt-2 space-y-2">
              {sortedReservations.map((reservation: any) => (
                <li
                  key={reservation.id}
                  className={`rounded border p-3 ${reservation.status === "checked_in" ? "border-blue-400 bg-blue-50" : "border-slate-200"}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">
                        {new Date(reservation.start_at).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })} -{" "}
                        {reservation.table_type?.name} / {reservation.party_size}名
                      </p>
                      <p className="text-sm text-slate-500">
                        {reservation.customer?.full_name || reservation.customer?.email} / {STATUS_LABEL[reservation.status]}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {reservation.status === "checked_in" && (
                        <form action={callReservationAction.bind(null, reservation.id)}>
                          <button type="submit" className="rounded bg-blue-600 px-3 py-1 text-sm text-white">
                            呼び出す
                          </button>
                        </form>
                      )}
                      {reservation.status === "called" && (
                        <form action={seatReservationAction.bind(null, reservation.id)}>
                          <button type="submit" className="rounded bg-green-600 px-3 py-1 text-sm text-white">
                            着席
                          </button>
                        </form>
                      )}
                      {(reservation.status === "reserved" || reservation.status === "called") && (
                        <form action={noShowReservationAction.bind(null, reservation.id)}>
                          <button type="submit" className="rounded border border-red-300 px-3 py-1 text-sm text-red-600">
                            ノーショー
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </li>
              ))}
              {sortedReservations.length === 0 && <p className="text-sm text-slate-500">本日の予約はありません。</p>}
            </ul>

            <h3 className="mt-6 text-sm font-bold text-slate-700">当日行列(walk-in)</h3>
            <ul className="mt-2 space-y-2">
              {board.queueEntries.map((entry: any) => (
                <li key={entry.id} className="rounded border border-slate-200 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">
                        {new Date(entry.created_at).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })} 受付 /{" "}
                        {entry.party_size}名
                      </p>
                      <p className="text-sm text-slate-500">
                        {entry.customer?.full_name || entry.customer?.email} / {STATUS_LABEL[entry.status]}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {entry.status === "waiting" && (
                        <form action={callQueueAction.bind(null, entry.id)}>
                          <button type="submit" className="rounded bg-blue-600 px-3 py-1 text-sm text-white">
                            呼び出す
                          </button>
                        </form>
                      )}
                      {entry.status === "called" && (
                        <form action={seatQueueAction.bind(null, entry.id)}>
                          <button type="submit" className="rounded bg-green-600 px-3 py-1 text-sm text-white">
                            着席
                          </button>
                        </form>
                      )}
                      {(entry.status === "waiting" || entry.status === "called") && (
                        <form action={noShowQueueAction.bind(null, entry.id)}>
                          <button type="submit" className="rounded border border-red-300 px-3 py-1 text-sm text-red-600">
                            ノーショー
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </li>
              ))}
              {board.queueEntries.length === 0 && <p className="text-sm text-slate-500">当日行列はありません。</p>}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
