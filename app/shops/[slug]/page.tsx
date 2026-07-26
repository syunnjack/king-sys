import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDayAvailability, getShopBySlug, getTableTypes } from "@/lib/data";
import { createReservationAction, joinQueueAction } from "@/app/actions/customer";

export const revalidate = 30;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const shop = await getShopBySlug(slug);
  if (!shop) return {};
  return {
    title: shop.name,
    description: shop.description ?? undefined,
    alternates: { canonical: `/shops/${shop.slug}` },
  };
}

export default async function ShopPublicPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string; date?: string }>;
}) {
  const { slug } = await params;
  const { error, date } = await searchParams;
  const shop = await getShopBySlug(slug);
  if (!shop) notFound();

  const tableTypes = await getTableTypes(shop.id);
  const today = new Date().toISOString().slice(0, 10);
  const selectedDate = date || today;
  const availability = await getDayAvailability(shop.id, tableTypes, selectedDate);

  const boundReserve = createReservationAction.bind(null, shop.id, shop.slug);
  const boundJoinQueue = joinQueueAction.bind(null, shop.id, shop.slug);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">{shop.name}</h1>
      {shop.description && <p className="mt-2 text-slate-600">{shop.description}</p>}
      <div className="mt-2 text-sm text-slate-500">
        {shop.address && <p>{shop.address}</p>}
        {shop.phone && <p>{shop.phone}</p>}
      </div>

      {error && (
        <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">
          {decodeURIComponent(error) || "予約できませんでした。"}
        </p>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-bold text-slate-900">枠予約(先着でチェックインすると行列の先頭を確約)</h2>
        <form method="get" className="mt-3">
          <label className="text-sm">
            日付
            <input type="date" name="date" defaultValue={selectedDate} className="ml-2 rounded border border-slate-300 px-2 py-1" />
          </label>
          <button type="submit" className="ml-2 rounded border border-slate-300 px-3 py-1 text-sm">
            表示
          </button>
        </form>

        <div className="mt-4 space-y-6">
          {tableTypes.map((tableType) => {
            const times = Array.from({ length: 44 }, (_, i) => {
              const minutes = 11 * 60 + i * 15;
              const h = Math.floor(minutes / 60);
              const m = minutes % 60;
              return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
            }).filter((_, i) => 11 * 60 + i * 15 < 22 * 60);

            return (
              <div key={tableType.id}>
                <p className="font-bold text-slate-900">
                  {tableType.name}({tableType.capacity_min}〜{tableType.capacity_max}名)
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {times.map((time) => {
                    const available = availability.get(`${tableType.id}|${time}`) ?? 0;
                    if (available <= 0) return null;
                    return (
                      <form key={time} action={boundReserve}>
                        <input type="hidden" name="tableTypeId" value={tableType.id} />
                        <input type="hidden" name="date" value={selectedDate} />
                        <input type="hidden" name="time" value={time} />
                        <input type="hidden" name="partySize" value={tableType.capacity_min} />
                        <button
                          type="submit"
                          className="rounded border border-blue-300 px-3 py-1 text-sm text-blue-700 hover:bg-blue-50"
                          title={`残り${available}枠`}
                        >
                          {time}
                        </button>
                      </form>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {tableTypes.length === 0 && <p className="text-sm text-slate-500">現在予約可能な卓タイプがありません。</p>}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold text-slate-900">今から並ぶ(当日行列)</h2>
        <p className="mt-1 text-sm text-slate-500">枠予約なしで、今すぐ行列に並びます。順番が近づいたら呼び出されます。</p>
        <form action={boundJoinQueue} className="mt-3 flex items-end gap-3">
          <label className="text-sm">
            人数
            <input type="number" name="partySize" defaultValue={2} min={1} className="ml-2 w-20 rounded border border-slate-300 px-2 py-1" />
          </label>
          <button type="submit" className="rounded bg-slate-800 px-4 py-2 text-sm font-bold text-white">
            行列に並ぶ
          </button>
        </form>
      </section>
    </div>
  );
}
