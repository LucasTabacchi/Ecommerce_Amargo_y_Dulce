import type { ProductCardItem } from "@/components/products/ProductCard";

const STRAPI_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL ?? "http://localhost:1337";

export function getStrapiImageUrl(product: any): string | undefined {
  const image = product?.images?.[0];

  if (!image) return undefined;

  // Preferimos thumbnail si existe
  const url =
    image.formats?.thumbnail?.url ??
    image.url;

  if (!url) return undefined;

  return url.startsWith("http") ? url : `${STRAPI_URL}${url}`;
}

export function toCardItem(product: any) {
  return {
    slug:
      product.slug ??
      product.documentId ??
      String(product.id ?? ""),
    title: product.title ?? "Producto",
    description: product.description ?? "",
    price: Number(product.price ?? 0),
    imageUrl: getStrapiImageUrl(product),
    off: typeof product.off === "number" ? product.off : undefined,
  };
}

