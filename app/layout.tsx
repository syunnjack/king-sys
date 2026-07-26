import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { SITE_DESCRIPTION, SITE_NAME, resolveBaseUrl } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(resolveBaseUrl()),
  title: { default: SITE_NAME, template: `%s｜${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
            <Link href="/" className="font-bold text-slate-900">
              {SITE_NAME}
            </Link>
            <nav className="flex gap-4 text-sm text-slate-600">
              <Link href="/dashboard">マイページ</Link>
              <Link href="/login">ログイン</Link>
              <Link href="/signup">新規登録</Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-4xl px-4 py-6 text-xs text-slate-500">
            <p>{SITE_NAME} は高回転飲食店向けの枠予約×行列保証MVPです。</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
