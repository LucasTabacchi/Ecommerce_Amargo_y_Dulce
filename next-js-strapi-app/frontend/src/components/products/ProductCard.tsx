import Link from "next/link";

/**
 * Tipo simple para un producto.
 * Más adelante lo podés reemplazar por tu type real (ej: src/types/product.ts)
 * o lo que venga desde Strapi.
 */
export type ProductCardItem = {
  slug: string;
  title: string;
  description: string;
  price: number;
  imageUrl?: string; // opcional (por ahora podemos no tener imagen real)
};

/**
 * Card reutilizable de producto:
 * - Muestra imagen (o placeholder si no hay)
 * - Título, descripción y precio
 * - Click lleva a /productos/[slug]
 */
export function ProductCard({ item }: { item: ProductCardItem }) {
  return (
    <Link
      href={`/productos/${item.slug}`}
      className="group block rounded-lg border border-neutral-200 bg-white p-4 transition hover:shadow-sm"
    >
      {/* Imagen / Placeholder */}
      <div className="flex aspect-[4/3] items-center justify-center rounded-md bg-neutral-100">
        {item.imageUrl ? (
          // Si ya tenés imagen, la mostramos. (Después podemos pasar a next/image)
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.title}
            className="h-full w-full rounded-md object-cover"
          />
        ) : (
          <div className="text-xs text-neutral-500">Imagen próximamente</div>
        )}
      </div>

      {/* Texto */}
      <div className="mt-3">
        <h3 className="text-sm font-semibold text-neutral-900 group-hover:underline">
          {item.title}
        </h3>

        <p className="mt-1 line-clamp-2 text-xs text-neutral-600">
          {item.description}
        </p>

        <div className="mt-3 text-sm font-semibold text-neutral-900">
          ${item.price.toLocaleString("es-AR")}
        </div>
      </div>
    </Link>
  );
}
