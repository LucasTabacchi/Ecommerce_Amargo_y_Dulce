import { Container } from "@/components/layout/Container";
import { ProductCard } from "@/components/products/ProductCard";
import { SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { strapiGet } from "@/lib/strapi";
import { toCardItem } from "@/lib/strapi-mappers";
import { AddToCartButton } from "@/components/cart/AddToCartButton";

type StrapiCollection<T> = {
  data: T[];
  meta?: any;
};

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: { cat?: string; sort?: string };
}) {
  // 1) Filtro por categoría desde querystring
  const cat = (searchParams.cat || "").toLowerCase();

  // 2) Orden (mantenemos tu lógica: price_asc / price_desc)
  const sort = searchParams.sort || "";
  const sortParam =
    sort === "price_asc"
      ? "sort[0]=price:asc"
      : sort === "price_desc"
      ? "sort[0]=price:desc"
      : "sort[0]=createdAt:desc";

  // 3) Filtro por category (tu modelo Product tiene category Text)
  const filterQuery = cat
    ? `&filters[category][$eqi]=${encodeURIComponent(cat)}`
    : "";

  // 4) Fetch a Strapi (populate=* para traer images)
  const res = await strapiGet<StrapiCollection<any>>(
    `/api/products?populate=*&pagination[pageSize]=24&${sortParam}${filterQuery}`
  );

  // 5) Normalizamos para tu UI usando el mapper centralizado
  const products = (res?.data ?? []).map(toCardItem);

  return (
    <main>
      <Container>
        {/* Encabezado de página */}
        <div className="py-8">
          <h1 className="text-2xl font-extrabold text-neutral-900">Productos</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Elegí tus favoritos.{" "}
            {cat ? `Mostrando categoría: ${cat}` : "Explorá todo el catálogo."}
          </p>
        </div>

        {/* Barra de acciones (Filtrar / Ordenar) */}
        <div className="flex items-center justify-center gap-8 pb-6 text-sm text-neutral-800">
          <button className="inline-flex items-center gap-2 hover:text-neutral-950">
            <SlidersHorizontal className="h-4 w-4" />
            Filtrar
          </button>

          <button className="inline-flex items-center gap-2 hover:text-neutral-950">
            <ArrowUpDown className="h-4 w-4" />
            Ordenar
          </button>
        </div>

        {/* ANCLA: para que el footer te lleve directo al listado */}
        <div id="listado" className="scroll-mt-24" />

        {/* Grid de productos */}
        <section className="pb-14">
          {products.length === 0 ? (
            <div className="rounded-lg bg-[#F7F2E9] p-6 text-sm text-neutral-700">
              No hay productos para mostrar
              {cat ? ` en la categoría "${cat}"` : ""}.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => (
                <div key={p.slug} className="rounded-lg bg-[#F7F2E9] p-6">
                  <ProductCard item={p} />

                  {/* Botón real "Agregar al carrito" (Zustand) */}
                  <div className="mt-4 flex justify-end">
                    <AddToCartButton item={p} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </Container>
    </main>
  );
}


