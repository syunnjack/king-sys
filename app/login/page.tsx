import { signIn } from "@/app/actions/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-bold text-slate-900">ログイン</h1>
      {message === "confirm_email" && (
        <p className="mt-3 rounded bg-blue-50 p-3 text-sm text-blue-700">
          確認メールを送信しました。メール内のリンクを開いてからログインしてください。
        </p>
      )}
      {error && <p className="mt-3 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <form action={signIn} className="mt-6 space-y-4">
        <label className="block text-sm">
          メールアドレス
          <input type="email" name="email" required className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
        </label>
        <label className="block text-sm">
          パスワード
          <input type="password" name="password" required className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
        </label>
        <button type="submit" className="w-full rounded bg-blue-600 py-2 font-bold text-white">
          ログイン
        </button>
      </form>
      <p className="mt-4 text-sm text-slate-500">
        アカウントをお持ちでないですか？ <a href="/signup" className="text-blue-600">新規登録</a>
      </p>
    </div>
  );
}
