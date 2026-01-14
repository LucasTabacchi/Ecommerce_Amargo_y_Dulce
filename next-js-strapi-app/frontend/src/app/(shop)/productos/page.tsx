import { Container } from "@/components/layout/Container";
import { HomeBestSellers } from "@/components/home/HomeBestSellers"; // (opcional si lo querés reutilizar)
import { ProductCard, type ProductCardItem } from "@/components/products/ProductCard";
import { SlidersHorizontal, ArrowUpDown } from "lucide-react";

const MOCK_PRODUCTS: (ProductCardItem & { category: string; off?: number })[] = [
  {
    slug: "bombon-noche-intensa",
    title: "Bombón Noche Intensa",
    description:
      "Bombón de chocolate 80% cacao, relleno de crema de avellana y licor de café.",
    price: 15000,
    category: "bombones",
    off: 45,
  },
  {
    slug: "bombon-coleccion-clasica",
    title: "Bombón Colección Clásica",
    description: "Bombón de chocolate 70% cacao, relleno de frambuesa líquida.",
    price: 15000,
    category: "bombones",
  },
  {
    slug: "bombon-fusion-moderna",
    title: "Bombón Fusión Moderna",
    description: "Bombón de chocolate, relleno de crema a base de whisky y nuez pecan.",
    price: 15000,
    category: "bombones",
  },
  {
    slug: "bombon-dulce-tentacion",
    title: "Bombón Dulce Tentación",
    description: "Bombón relleno de crema de almendras y miel, bañado en chocolate con leche.",
    price: 15000,
    category: "bombones",
  },
  {
    slug: "bombon-pasion-frutal",
    title: "Bombón Pasión Frutal",
    description: "Bombón relleno de ganache de frutilla, bañado en chocolate blanco.",
    price: 15000,
    category: "bombones",
    off: 15,
  },
  {
    slug: "bombon-esencia-argentina",
    title: "Bombón Esencia Argentina",
    description: "Bombón relleno de dulce de leche, bañado en chocolate.",
    price: 15000,
    category: "bombones",
  },
];

export default function ProductosPage({
  searchParams,
}: {
  searchParams: { cat?: string; sort?: string };
}) {
  // 1) Filtro por categoría (viene del footer: /productos?cat=bombones#listado)
  const cat = (searchParams.cat || "").toLowerCase();

  let products = [...MOCK_PRODUCTS];
  if (cat) {
    products = products.filter((p) => p.category === cat);
  }

  // 2) Orden (por ahora simple con sort=price_asc/price_desc)
  const sort = searchParams.sort || "";
  if (sort === "price_asc") products.sort((a, b) => a.price - b.price);
  if (sort === "price_desc") products.sort((a, b) => b.price - a.price);

  return (
    <main>
      <Container>
        {/* Encabezado de página */}
        <div className="py-8">
          <h1 className="text-2xl font-extrabold text-neutral-900">Productos</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Elegí tus favoritos. {cat ? `Mostrando categoría: ${cat}` : "Explorá todo el catálogo."}
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
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <div key={p.slug} className="rounded-lg bg-[#F7F2E9] p-6">
                {/* Badge OFF (si hay descuento) */}
                {p.off ? (
                  <div className="text-xs font-semibold text-neutral-700">
                    {p.off}% OFF
                  </div>
                ) : (
                  <div className="h-4" />
                )}

                <ProductCard item={p} />

                {/* Botón "Agregar al carrito" estilo mockup */}
                <div className="mt-4 flex justify-end">
                  <button className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700">
                    AGREGAR AL CARRITO
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </Container>
    </main>
  );
}
