import { signUp } from "@/app/actions/auth";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-bold text-slate-900">アカウント作成</h1>
      <p className="mt-2 text-sm text-slate-600">
        お店のオーナー・スタッフとしても、予約するお客さんとしても、まずはこちらから登録してください。
      </p>
      {error && <p className="mt-3 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <form action={signUp} className="mt-6 space-y-4">
        <label className="block text-sm">
          お名前
          <input name="fullName" required className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
        </label>
        <label className="block text-sm">
          メールアドレス
          <input type="email" name="email" required className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
        </label>
        <label className="block text-sm">
          パスワード(8文字以上)
          <input type="password" name="password" required minLength={8} className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
        </label>
        <button type="submit" className="w-full rounded bg-blue-600 py-2 font-bold text-white">
          登録する
        </button>
      </form>
      <p className="mt-4 text-sm text-slate-500">
        すでにアカウントをお持ちですか？ <a href="/login" className="text-blue-600">ログイン</a>
      </p>
    </div>
  );
}
