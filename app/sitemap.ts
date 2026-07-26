import type { MetadataRoute } from "next";
import { listShops } from "@/lib/data";
import { resolveBaseUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = resolveBaseUrl();
  const shops = await listShops();
  return [
    { url: `${baseUrl}/`, changeFrequency: "hourly", priority: 1 },
    { url: `${baseUrl}/signup`, changeFrequency: "monthly", priority: 0.5 },
    ...shops.map((shop) => ({
      url: `${baseUrl}/shops/${shop.slug}`,
      changeFrequency: "hourly" as const,
      priority: 0.8,
    })),
  ];
}
