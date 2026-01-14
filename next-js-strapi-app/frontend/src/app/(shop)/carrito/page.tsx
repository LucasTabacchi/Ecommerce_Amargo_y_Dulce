import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Minus, Plus, Trash2, ShoppingCart, BadgePercent } from "lucide-react";

type CartItem = {
  id: string;
  title: string;
  description: string;
  price: number;
  qty: number;
};

const MOCK_ITEMS: CartItem[] = [
  {
    id: "bombon-noche-intensa",
    title: "Bombón Noche Intensa",
    description: "80% cacao, relleno de crema de avellana y licor de café.",
    price: 15000,
    qty: 1,
  },
  {
    id: "bombon-coleccion-clasica",
    title: "Bombón Colección Clásica",
    description: "70% cacao, relleno de frambuesa líquida.",
    price: 15000,
    qty: 2,
  },
];

function formatARS(n: number) {
  return n.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
}

export default function CarritoPage() {
  // Totales mock (cuando conectemos store, esto sale del estado real)
  const subtotal = MOCK_ITEMS.reduce((acc, it) => acc + it.price * it.qty, 0);
  const cajas = MOCK_ITEMS.reduce((acc, it) => acc + it.qty, 0);

  // Promos (las que vos definiste)
  const promoMontoOk = subtotal >= 50000;
  const promoCajasOk = cajas >= 3;

  // Reglas simples: aplicamos el mayor descuento (para no “doble descontar” por ahora)
  const montoDesc = promoMontoOk ? 0.1 : 0; // 10%
  const cajasDesc = promoCajasOk ? 0.05 : 0; // 5%
  const discountRate = Math.max(montoDesc, cajasDesc);

  const discount = Math.round(subtotal * discountRate);
  const total = subtotal - discount;

  return (
    <main>
      <Container>
        {/* Header */}
        <div className="py-10">
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-6 w-6 text-neutral-900" />
            <h1 className="text-3xl font-extrabold text-neutral-900">Carrito</h1>
          </div>
          <p className="mt-2 text-sm text-neutral-600">
            Revisá tus bombones antes de finalizar la compra.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 pb-14 lg:grid-cols-[1fr_380px]">
          {/* LISTA */}
          <section className="space-y-4">
            {MOCK_ITEMS.length === 0 ? (
              <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
                <p className="text-sm text-neutral-600">Tu carrito está vacío.</p>
                <Link
                  href="/productos#listado"
                  className="mt-4 inline-flex rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Ver bombones
                </Link>
              </div>
            ) : (
              MOCK_ITEMS.map((it) => (
                <div
                  key={it.id}
                  className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    {/* Imagen placeholder */}
                    <div className="h-20 w-20 shrink-0 rounded-lg bg-neutral-100 ring-1 ring-neutral-200" />

                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-bold text-neutral-900">{it.title}</div>
                          <div className="mt-1 text-sm text-neutral-600">
                            {it.description}
                          </div>
                        </div>

                        <button
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-neutral-50"
                          aria-label="Eliminar"
                          title="Eliminar"
                          type="button"
                        >
                          <Trash2 className="h-5 w-5 text-neutral-500" />
                        </button>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        {/* Cantidad */}
                        <div className="flex items-center gap-2">
                          <button
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-neutral-200 bg-white hover:bg-neutral-50"
                            aria-label="Restar"
                            type="button"
                          >
                            <Minus className="h-4 w-4" />
                          </button>

                          <div className="min-w-[34px] text-center text-sm font-semibold">
                            {it.qty}
                          </div>

                          <button
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-neutral-200 bg-white hover:bg-neutral-50"
                            aria-label="Sumar"
                            type="button"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Precio */}
                        <div className="text-sm font-bold text-neutral-900">
                          {formatARS(it.price * it.qty)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Botón seguir comprando */}
            {MOCK_ITEMS.length > 0 && (
              <div className="pt-2">
                <Link
                  href="/productos#listado"
                  className="inline-flex rounded-full border border-neutral-300 bg-white px-5 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-50"
                >
                  Seguir comprando
                </Link>
              </div>
            )}
          </section>

          {/* RESUMEN */}
          <aside className="h-fit rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-extrabold text-neutral-900">Resumen</h2>

            {/* Promos */}
            <div className="mt-4 rounded-xl bg-[#FAF7F2] p-4">
              <div className="flex items-center gap-2 font-bold text-neutral-900">
                <BadgePercent className="h-5 w-5" />
                Promociones disponibles
              </div>

              <ul className="mt-3 space-y-2 text-sm text-neutral-700">
                <li className="flex items-start gap-2">
                  <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-neutral-400" />
                  <span>
                    <span className="font-semibold">10% OFF</span> desde{" "}
                    <span className="font-semibold">{formatARS(50000)}</span>
                    {promoMontoOk ? " ✅" : ""}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-neutral-400" />
                  <span>
                    <span className="font-semibold">5% OFF</span> llevando{" "}
                    <span className="font-semibold">3 cajas</span> o más
                    {promoCajasOk ? " ✅" : ""}
                  </span>
                </li>
              </ul>

              {!promoMontoOk && (
                <div className="mt-3 text-xs text-neutral-600">
                  Te faltan{" "}
                  <span className="font-semibold">
                    {formatARS(50000 - subtotal)}
                  </span>{" "}
                  para el 10% OFF por monto.
                </div>
              )}

              {!promoCajasOk && (
                <div className="mt-1 text-xs text-neutral-600">
                  Te faltan{" "}
                  <span className="font-semibold">{3 - cajas}</span> caja(s) para el
                  5% OFF por cantidad.
                </div>
              )}
            </div>

            {/* Totales */}
            <div className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between text-neutral-700">
                <span>Subtotal</span>
                <span className="font-semibold text-neutral-900">
                  {formatARS(subtotal)}
                </span>
              </div>

              <div className="flex justify-between text-neutral-700">
                <span>Descuento</span>
                <span className="font-semibold text-neutral-900">
                  -{formatARS(discount)}
                </span>
              </div>

              <div className="my-3 h-px bg-neutral-200" />

              <div className="flex justify-between text-base">
                <span className="font-extrabold text-neutral-900">Total</span>
                <span className="font-extrabold text-neutral-900">
                  {formatARS(total)}
                </span>
              </div>
            </div>

            <button
              className="mt-6 w-full rounded-full bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700"
              type="button"
            >
              Finalizar compra
            </button>

            <p className="mt-3 text-center text-xs text-neutral-500">
              El descuento se calcula automáticamente en el checkout.
            </p>
          </aside>
        </div>
      </Container>
    </main>
  );
}
