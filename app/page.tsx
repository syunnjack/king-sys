import Link from "next/link";
import { listShops } from "@/lib/data";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export const revalidate = 60;

export default async function Home() {
  const shops = await listShops();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold text-slate-900">{SITE_NAME}</h1>
      <p className="mt-3 text-lg text-slate-600">{SITE_DESCRIPTION}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 p-4">
          <p className="font-bold text-slate-900">枠予約×行列保証</p>
          <p className="mt-1 text-sm text-slate-600">時間帯を指定して予約でき、予約時間にチェックインすれば行列の先頭を確約します。</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-4">
          <p className="font-bold text-slate-900">当日行列にも対応</p>
          <p className="mt-1 text-sm text-slate-600">予約なしでも今すぐ行列に並べます。事前予約枠とは比率で公平に管理されます。</p>
        </div>
      </div>

      <div className="mt-8 flex gap-4">
        <Link href="/signup" className="rounded bg-blue-600 px-6 py-3 font-bold text-white">
          無料で始める
        </Link>
        <Link href="/login" className="rounded border border-slate-300 px-6 py-3 font-bold text-slate-700">
          ログイン
        </Link>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-bold text-slate-900">掲載店舗</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {shops.map((shop) => (
            <li key={shop.id} className="rounded-lg border border-slate-200 p-4">
              <Link href={`/shops/${shop.slug}`} className="font-bold text-slate-900">
                {shop.name}
              </Link>
              {shop.description && <p className="mt-1 text-sm text-slate-600">{shop.description}</p>}
            </li>
          ))}
          {shops.length === 0 && <p className="text-sm text-slate-500">まだ掲載店舗がありません。</p>}
        </ul>
      </section>
    </div>
  );
}
