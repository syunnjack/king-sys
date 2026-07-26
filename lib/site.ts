export const SITE_NAME = "キングシス";
export const SITE_DESCRIPTION =
  "高回転・行列のできる飲食店向けの、枠予約×行列保証システム。予約した時間にチェックインすると、行列の先頭が確約されます。";

const FALLBACK_BASE_URL = "http://localhost:3000";

export function resolveBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  if (!url) return FALLBACK_BASE_URL;
  try {
    new URL(url);
    return url;
  } catch {
    return FALLBACK_BASE_URL;
  }
}
