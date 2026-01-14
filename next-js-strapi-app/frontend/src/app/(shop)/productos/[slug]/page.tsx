import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { strapiGet } from "@/lib/strapi";
import { AddToCartDetail } from "./ui";
import { Gallery } from "./Gallery";

type StrapiCollection<T> = {
  data: T[];
  meta?: any;
};

type StrapiImage = {
  url?: string;
  alternativeText?: string | null;
  formats?: {
    thumbnail?: { url?: string };
    small?: { url?: string };
    medium?: { url?: string };
    large?: { url?: string };
  };
};

type StrapiProduct = {
  documentId?: string;
  id?: number;
  title?: string;
  slug?: string;
  description?: string;
  price?: number;
  stock?: number;
  off?: number;
  images?: StrapiImage[];
};

const STRAPI_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL ?? "http://localhost:1337";

function absUrl(url?: string) {
  if (!url) return undefined;
  return url.startsWith("http") ? url : `${STRAPI_URL}${url}`;
}

function priceWithOff(price: number, off?: number) {
  const hasOff = typeof off === "number" && off > 0;
  return hasOff ? Math.round(price * (1 - off / 100)) : price;
}

export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const slug = params.slug;

  const res = await strapiGet<StrapiCollection<StrapiProduct>>(
    `/api/products?filters[slug][$eq]=${encodeURIComponent(slug)}&populate=*`
  );

  const product = res?.data?.[0];
  if (!product) return notFound();

  const title = product.title ?? "Producto";
  const description = product.description ?? "";
  const price = Number(product.price ?? 0);
  const stock = Number(product.stock ?? 0);
  const off = typeof product.off === "number" ? product.off : undefined;

  const images = product.images ?? [];

  const finalPrice = priceWithOff(price, off);
  const hasOff = typeof off === "number" && off > 0;
  const outOfStock = stock <= 0;

  // Item que va al carrito (ProductCardItem shape)
  const cartItem = {
    slug: product.slug ?? slug,
    title,
    description,
    price,
    imageUrl: absUrl(images[0]?.formats?.thumbnail?.url || images[0]?.url),
    off,
  };

  return (
    <main>
      <Container>
        <div className="py-10">
          <div className="grid gap-10 lg:grid-cols-2">
            {/* Galería interactiva */}
            <Gallery images={images} title={title} />

            {/* Info */}
            <section>
              <h1 className="text-3xl font-extrabold text-neutral-900">
                {title}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                {hasOff ? (
                  <>
                    <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
                      {off}% OFF
                    </span>
                    <span className="text-sm text-neutral-400 line-through">
                      ${price.toLocaleString("es-AR")}
                    </span>
                    <span className="text-2xl font-extrabold text-neutral-900">
                      ${finalPrice.toLocaleString("es-AR")}
                    </span>
                  </>
                ) : (
                  <span className="text-2xl font-extrabold text-neutral-900">
                    ${price.toLocaleString("es-AR")}
                  </span>
                )}
              </div>

              <p className="mt-4 text-sm leading-relaxed text-neutral-700">
                {description}
              </p>

              <div className="mt-5 text-sm">
                <span className="font-semibold text-neutral-900">Stock: </span>
                <span
                  className={outOfStock ? "text-red-600" : "text-neutral-700"}
                >
                  {outOfStock ? "Sin stock" : `${stock} disponible(s)`}
                </span>
              </div>

              <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-5">
                <AddToCartDetail item={cartItem} disabled={outOfStock} />
                <p className="mt-3 text-xs text-neutral-500">
                  Tip: podés sumar varias unidades y se acumulan en el carrito.
                </p>
              </div>
            </section>
          </div>
        </div>
      </Container>
    </main>
  );
}
