"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { useCartStore } from "@/store/cart.store";

function formatARS(n: number) {
  return n.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
}

function priceWithOff(price: number, off?: number) {
  const hasOff = typeof off === "number" && off > 0;
  return hasOff ? Math.round(price * (1 - off / 100)) : price;
}

function makeOrderNumber(id: number | string) {
  const n = Number(id);
  const padded = String(isNaN(n) ? id : n).padStart(4, "0");
  return `AMG-${padded}`;
}

// Intenta extraer un mensaje útil de errores de Strapi/MP
function pickErrorMessage(payload: any, fallback: string) {
  if (!payload) return fallback;

  // Tu route.ts puede devolver { error: "..." }
  if (typeof payload.error === "string") return payload.error;

  // Cuando devolvemos { mp: {...} }
  const mp = payload.mp ?? payload.error ?? payload;

  // Errores típicos MP
  if (typeof mp?.message === "string") return mp.message;
  if (typeof mp?.error === "string") return mp.error;
  if (typeof mp?.cause?.[0]?.description === "string") return mp.cause[0].description;
  if (typeof mp?.cause?.[0]?.message === "string") return mp.cause[0].message;

  // Strapi
  if (typeof payload?.error?.message === "string") return payload.error.message;

  try {
    return JSON.stringify(payload);
  } catch {
    return fallback;
  }
}

export default function CheckoutPage() {
  const items = useCartStore((s) => s.items);
  const clear = useCartStore((s) => s.clear);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Totales
  const subtotal = useMemo(() => {
    return items.reduce((acc, it) => {
      const unit = priceWithOff(it.price, it.off);
      return acc + unit * it.qty;
    }, 0);
  }, [items]);

  const cajas = useMemo(() => items.reduce((acc, it) => acc + it.qty, 0), [items]);

  const promoMontoOk = subtotal >= 50000;
  const promoCajasOk = cajas >= 3;
  const discountRate = Math.max(promoMontoOk ? 0.1 : 0, promoCajasOk ? 0.05 : 0);

  const discount = Math.round(subtotal * discountRate);
  const total = subtotal - discount;

  const trimmedName = name.trim();
  const trimmedEmail = email.trim();

  const canSubmit =
    items.length > 0 &&
    trimmedName.length >= 2 &&
    trimmedEmail.includes("@") &&
    !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (items.length === 0) {
      setError("Tu carrito está vacío.");
      return;
    }

    if (trimmedName.length < 2) {
      setError("Ingresá un nombre válido.");
      return;
    }

    if (!trimmedEmail.includes("@")) {
      setError("Ingresá un email válido.");
      return;
    }

    const strapiBase = process.env.NEXT_PUBLIC_STRAPI_URL ?? "http://localhost:1337";

    try {
      setLoading(true);

      // 1) Crear orden en Strapi (pending)
      const createPayload = {
        data: {
          name: trimmedName,
          email: trimmedEmail,
          orderStatus: "pending",
          total,
          items: items.map((it) => ({
            slug: it.slug,
            title: it.title,
            // guardamos precio original y off (trazabilidad)
            price: it.price,
            off: it.off,
            qty: it.qty,
          })),
        },
      };

      const createRes = await fetch("/api/orders/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(createPayload),
    });


      let created: any = null;
      try {
        created = await createRes.json();
      } catch {
        const text = await createRes.text().catch(() => "");
        throw new Error(text || "Respuesta inválida de Strapi");
      }

      if (!createRes.ok) {
        throw new Error(pickErrorMessage(created, "No se pudo crear la orden"));
      }

      const id: number | undefined = created?.data?.id;
      if (!id) {
        throw new Error("La orden se creó pero Strapi no devolvió un id.");
      }

      // 2) Generar orderNumber
      const orderNumber = makeOrderNumber(id);

      // 3) Guardar orderNumber (si falla, seguimos igual)
      fetch(`${strapiBase}/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: { orderNumber } }),
      }).catch(() => {});

      // 4) Crear preferencia de MercadoPago desde Next API
      const normalizedItems = items
        .map((it) => ({
          title: it.title,
          qty: Number(it.qty ?? 1),
          unit_price: Number(priceWithOff(it.price, it.off)),
        }))
        .filter((x) => x.qty > 0 && Number.isFinite(x.unit_price) && x.unit_price > 0);

      if (normalizedItems.length === 0) {
        throw new Error("No hay items válidos para MercadoPago (precio/cantidad).");
      }

      const prefRes = await fetch("/api/mp/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: id, // external_reference para el webhook
          orderNumber,
          items: normalizedItems,
        }),
      });

      let pref: any = null;
      try {
        pref = await prefRes.json();
      } catch {
        const text = await prefRes.text().catch(() => "");
        throw new Error(text || "Respuesta inválida de /api/mp/create-preference");
      }

      if (!prefRes.ok) {
        throw new Error(
          pickErrorMessage(pref, "No se pudo crear la preferencia de MercadoPago")
        );
      }

    const checkoutUrl: string | undefined = pref?.sandbox_init_point;

    if (!checkoutUrl) {
    throw new Error("MercadoPago no devolvió sandbox_init_point.");
    }

    window.location.href = checkoutUrl;

    } catch (err: any) {
      setError(err?.message || "Error iniciando el pago");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <Container>
        <div className="py-10">
          <h1 className="text-3xl font-extrabold text-neutral-900">Checkout</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Confirmá tus datos y continuá al pago con MercadoPago.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="rounded-xl border bg-white p-6 text-sm text-neutral-700">
            Tu carrito está vacío. Volvé a{" "}
            <Link className="underline" href="/productos">
              productos
            </Link>
            .
          </div>
        ) : (
          <div className="grid gap-8 pb-14 lg:grid-cols-[1fr_380px]">
            {/* Form */}
            <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-6">
              <h2 className="text-lg font-extrabold text-neutral-900">Tus datos</h2>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-sm font-semibold text-neutral-800">Nombre</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 h-11 w-full rounded-md border border-neutral-300 px-3 text-sm"
                    placeholder="Tu nombre"
                    autoComplete="name"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-neutral-800">Email</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 h-11 w-full rounded-md border border-neutral-300 px-3 text-sm"
                    placeholder="tu@email.com"
                    type="email"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                className="mt-6 w-full rounded-full bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? "Redirigiendo..." : "Ir a pagar con MercadoPago"}
              </button>

              <div className="mt-4 flex items-center justify-between gap-3">
                <Link
                  href="/carrito"
                  className="text-sm font-semibold text-neutral-700 underline underline-offset-2 hover:text-neutral-900"
                >
                  Volver al carrito
                </Link>

                <button
                  type="button"
                  onClick={() => clear()}
                  className="text-sm font-semibold text-neutral-500 underline underline-offset-2 hover:text-neutral-700"
                >
                  Vaciar carrito
                </button>
              </div>

              <p className="mt-3 text-center text-xs text-neutral-500">
                MercadoPago Sandbox (pruebas). No se cobra dinero real.
              </p>
            </form>

            {/* Resumen */}
            <aside className="h-fit rounded-xl border bg-white p-6">
              <h2 className="text-lg font-extrabold text-neutral-900">Resumen</h2>

              <div className="mt-4 space-y-3">
                {items.map((it) => {
                  const unit = priceWithOff(it.price, it.off);
                  return (
                    <div key={it.slug} className="flex justify-between gap-4 text-sm">
                      <div className="text-neutral-700">
                        <div className="font-semibold text-neutral-900">{it.title}</div>
                        <div className="text-xs text-neutral-500">
                          {it.qty} × {formatARS(unit)}
                        </div>
                      </div>
                      <div className="font-semibold text-neutral-900">
                        {formatARS(unit * it.qty)}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="my-5 h-px bg-neutral-200" />

              <div className="space-y-2 text-sm">
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
                <div className="flex justify-between text-base">
                  <span className="font-extrabold text-neutral-900">Total</span>
                  <span className="font-extrabold text-neutral-900">
                    {formatARS(total)}
                  </span>
                </div>
              </div>
            </aside>
          </div>
        )}
      </Container>
    </main>
  );
}
