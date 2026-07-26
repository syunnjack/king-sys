import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getShopByOwner, getTableTypes, getStaffMembers, getShopAnalytics } from "@/lib/data";
import { createShopAction, createTableTypeAction, inviteStaffAction } from "@/app/actions/owner";
import { signOut } from "@/app/actions/auth";

export default async function OwnerDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const shop = await getShopByOwner(user.id);

  if (!shop) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <h1 className="text-2xl font-bold text-slate-900">お店を開設する</h1>
        <p className="mt-2 text-sm text-slate-600">高回転・行列のできる飲食店向けの枠予約×行列システムです。</p>
        {error && <p className="mt-3 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <form action={createShopAction} className="mt-6 space-y-4">
          <label className="block text-sm">
            店舗名
            <input name="name" required className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
          </label>
          <label className="block text-sm">
            紹介文
            <textarea name="description" rows={3} className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
          </label>
          <label className="block text-sm">
            住所
            <input name="address" className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
          </label>
          <label className="block text-sm">
            電話番号
            <input name="phone" className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
          </label>
          <button type="submit" className="w-full rounded bg-blue-600 py-2 font-bold text-white">
            開設する
          </button>
        </form>
      </div>
    );
  }

  const [tableTypes, staff, analytics] = await Promise.all([
    getTableTypes(shop.id),
    getStaffMembers(shop.id),
    getShopAnalytics(shop.id),
  ]);

  const boundCreateTableType = createTableTypeAction.bind(null, shop.id);
  const boundInviteStaff = inviteStaffAction.bind(null, shop.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">オーナーダッシュボード</p>
          <h1 className="text-2xl font-bold text-slate-900">{shop.name}</h1>
          <a href={`/shops/${shop.slug}`} className="text-sm text-blue-600">
            店舗ページを見る: /shops/{shop.slug}
          </a>
        </div>
        <form action={signOut}>
          <button type="submit" className="text-sm text-slate-500 underline">
            ログアウト
          </button>
        </form>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-bold text-slate-900">直近30日の分析</h2>
        <div className="mt-3 grid grid-cols-3 gap-3 text-center">
          <div className="rounded border border-slate-200 p-3">
            <p className="text-2xl font-bold text-slate-900">{analytics.totalReservations}</p>
            <p className="text-xs text-slate-500">予約数</p>
          </div>
          <div className="rounded border border-slate-200 p-3">
            <p className="text-2xl font-bold text-slate-900">{analytics.seatedCount}</p>
            <p className="text-xs text-slate-500">来店数</p>
          </div>
          <div className="rounded border border-slate-200 p-3">
            <p className="text-2xl font-bold text-red-600">{analytics.noShowRate}%</p>
            <p className="text-xs text-slate-500">ノーショー率</p>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold text-slate-900">卓タイプ・予約枠設定</h2>
        <ul className="mt-3 space-y-2">
          {tableTypes.map((tableType) => (
            <li key={tableType.id} className="rounded border border-slate-200 p-3">
              <p className="font-bold text-slate-900">{tableType.name}</p>
              <p className="text-sm text-slate-500">
                {tableType.capacity_min}〜{tableType.capacity_max}名 / 卓数{tableType.quantity} / 事前予約割当
                {Math.round(tableType.reservable_ratio * 100)}%
              </p>
            </li>
          ))}
        </ul>
        <form action={boundCreateTableType} className="mt-4 grid gap-2 rounded border border-slate-200 p-4 sm:grid-cols-2">
          <input name="name" placeholder="卓タイプ名(例: 2名卓)" required className="rounded border border-slate-300 px-3 py-2 sm:col-span-2" />
          <input name="capacityMin" type="number" placeholder="最小人数" defaultValue={1} required className="rounded border border-slate-300 px-3 py-2" />
          <input name="capacityMax" type="number" placeholder="最大人数" defaultValue={2} required className="rounded border border-slate-300 px-3 py-2" />
          <input name="quantity" type="number" placeholder="卓数" defaultValue={5} required className="rounded border border-slate-300 px-3 py-2" />
          <label className="text-xs text-slate-500">
            事前予約に割り当てる比率(%)
            <input name="reservableRatio" type="number" placeholder="30" defaultValue={30} min={0} max={100} className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
          </label>
          <button type="submit" className="rounded bg-blue-600 py-2 font-bold text-white sm:col-span-2">
            卓タイプを追加
          </button>
        </form>
        <p className="mt-2 text-xs text-slate-500">
          残り{100}% - {Math.round((tableTypes.reduce((s, t) => s + t.reservable_ratio, 0) / Math.max(1, tableTypes.length)) * 100) || 0}%
          は当日行列(walk-in)用に確保されます。
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold text-slate-900">スタッフ管理</h2>
        <ul className="mt-3 space-y-2">
          {staff.map((member) => (
            <li key={member.id} className="rounded border border-slate-200 p-3">
              <p className="font-bold text-slate-900">{member.display_name || member.email}</p>
              <p className="text-sm text-slate-500">
                {member.email} / {member.user_id ? "登録済み" : "招待中(未ログイン)"}
              </p>
            </li>
          ))}
        </ul>
        <form action={boundInviteStaff} className="mt-4 grid gap-2 rounded border border-slate-200 p-4 sm:grid-cols-2">
          <input name="email" type="email" placeholder="スタッフのメールアドレス" required className="rounded border border-slate-300 px-3 py-2" />
          <input name="displayName" placeholder="表示名" className="rounded border border-slate-300 px-3 py-2" />
          <button type="submit" className="rounded bg-blue-600 py-2 font-bold text-white sm:col-span-2">
            招待する
          </button>
        </form>
      </section>
    </div>
  );
}
