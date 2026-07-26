import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getCustomerReservations, getCustomerQueueEntries } from "@/lib/data";
import { signOut } from "@/app/actions/auth";
import { cancelReservationAction, checkInAction } from "@/app/actions/customer";

const STATUS_LABEL: Record<string, string> = {
  reserved: "予約済み(未チェックイン)",
  checked_in: "チェックイン済み(先頭確約)",
  called: "呼出中です！お店へ",
  seated: "来店済み",
  cancelled: "キャンセル済み",
  no_show: "ノーショー",
  waiting: "待機中",
};

export default async function CustomerDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [reservations, queueEntries] = await Promise.all([
    getCustomerReservations(user.id),
    getCustomerQueueEntries(user.id),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">マイページ</p>
          <h1 className="text-2xl font-bold text-slate-900">予約・行列状況</h1>
        </div>
        <form action={signOut}>
          <button type="submit" className="text-sm text-slate-500 underline">
            ログアウト
          </button>
        </form>
      </div>

      <section className="mt-6">
        <h2 className="text-lg font-bold text-slate-900">予約(枠予約)</h2>
        <ul className="mt-3 space-y-3">
          {reservations.map((reservation: any) => (
            <li key={reservation.id} className="rounded border border-slate-200 p-4">
              <p className="font-bold text-slate-900">{reservation.shop?.name}</p>
              <p className="mt-1 text-sm text-slate-600">
                {new Date(reservation.start_at).toLocaleString("ja-JP")} / {reservation.table_type?.name} / {reservation.party_size}名
              </p>
              <p className="mt-1 text-sm font-bold text-blue-700">{STATUS_LABEL[reservation.status]}</p>
              <div className="mt-2 flex gap-3">
                {reservation.status === "reserved" && (
                  <form action={checkInAction.bind(null, reservation.id)}>
                    <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-sm font-bold text-white">
                      到着しました(チェックイン)
                    </button>
                  </form>
                )}
                {(reservation.status === "reserved" || reservation.status === "checked_in") && (
                  <form action={cancelReservationAction.bind(null, reservation.id)}>
                    <button type="submit" className="text-sm text-red-600">
                      キャンセル
                    </button>
                  </form>
                )}
              </div>
            </li>
          ))}
          {reservations.length === 0 && <p className="text-sm text-slate-500">まだ予約がありません。</p>}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-slate-900">当日行列(walk-in)</h2>
        <ul className="mt-3 space-y-3">
          {queueEntries.map((entry: any) => (
            <li key={entry.id} className="rounded border border-slate-200 p-4">
              <p className="font-bold text-slate-900">{entry.shop?.name}</p>
              <p className="mt-1 text-sm text-slate-600">{entry.party_size}名 / 受付 {new Date(entry.created_at).toLocaleString("ja-JP")}</p>
              <p className="mt-1 text-sm font-bold text-blue-700">{STATUS_LABEL[entry.status]}</p>
            </li>
          ))}
          {queueEntries.length === 0 && <p className="text-sm text-slate-500">行列への登録はありません。</p>}
        </ul>
      </section>
    </div>
  );
}
