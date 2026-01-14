import { NextResponse } from "next/server";

/**
 * /api/mp/create-preference
 * Crea una preferencia de Checkout Pro (MercadoPago)
 *
 * Requisitos:
 * - MP_ACCESS_TOKEN (server-only)
 * - NEXT_PUBLIC_SITE_URL (ideal: https://... ngrok o dominio real)
 */

function normalizeBaseUrl(url: string) {
  const u = String(url ?? "").trim();
  const noTrailing = u.endsWith("/") ? u.slice(0, -1) : u;
  return noTrailing;
}

function isHttpUrl(url: string) {
  return /^https?:\/\//i.test(url);
}

function isLikelyLocalhost(url: string) {
  const u = url.toLowerCase();
  return u.includes("localhost") || u.includes("127.0.0.1");
}

export async function POST(req: Request) {
  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Body inválido (se esperaba JSON)" },
      { status: 400 }
    );
  }

  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json(
      { error: "Falta MP_ACCESS_TOKEN en .env.local" },
      { status: 500 }
    );
  }

  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const siteUrl = normalizeBaseUrl(rawSiteUrl);

  if (!isHttpUrl(siteUrl)) {
    return NextResponse.json(
      {
        error:
          "NEXT_PUBLIC_SITE_URL inválida. Debe empezar con http:// o https:// (ej: https://xxxxx.ngrok-free.dev)",
        got: rawSiteUrl,
      },
      { status: 500 }
    );
  }

  const { orderId, orderNumber, items } = body ?? {};

  // ✅ IMPORTANTE: el webhook debe poder identificar la orden por ID numérico.
  if (!orderId) {
    return NextResponse.json(
      { error: "Falta orderId (id numérico de Strapi) para external_reference" },
      { status: 400 }
    );
  }

  const normalizedItems = (items ?? [])
    .map((it: any) => ({
      title: String(it?.title ?? "Producto"),
      quantity: Number(it?.qty ?? it?.quantity ?? 1),
      unit_price: Number(it?.unit_price ?? it?.price ?? 0),
      currency_id: "ARS",
    }))
    .filter(
      (it: any) =>
        Number.isFinite(it.quantity) &&
        it.quantity > 0 &&
        Number.isFinite(it.unit_price) &&
        it.unit_price >= 0
    );

  if (normalizedItems.length === 0) {
    return NextResponse.json(
      { error: "No hay items válidos para crear la preferencia" },
      { status: 400 }
    );
  }

  // ✅ external_reference: usar SIEMPRE orderId (string)
  const external_reference = String(orderId);

  const back_urls = {
    success: `${siteUrl}/checkout/success`,
    failure: `${siteUrl}/checkout/failure`,
    pending: `${siteUrl}/checkout/pending`,
  };

  // En local MP suele rechazar notification_url apuntando a localhost.
  // Con ngrok o dominio real sí lo mandamos.
  const shouldSendNotificationUrl = !isLikelyLocalhost(siteUrl);

  const notification_url = `${siteUrl}/api/mp/webhook`;

  // ⚠️ NO mezclar auto_return con back_urls
  // Opción 1: back_urls sin auto_return (usuario ve botón "Volver")
  // Opción 2: auto_return sin back_urls (redirige automático)
  // Usaremos Opción 1 por seguridad
  const preferenceBody: any = {
    items: normalizedItems,
    external_reference,
    back_urls,
    metadata: {
      orderId: String(orderId),
      orderNumber: orderNumber ? String(orderNumber) : "",
    },
  };

  if (shouldSendNotificationUrl) {
    preferenceBody.notification_url = notification_url;
  }

  const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(preferenceBody),
  });

  console.log("[MP API] Request body:", JSON.stringify(preferenceBody, null, 2));
  console.log("[MP API] Response status:", res.status);

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    const text = await res.text().catch(() => "");
    return NextResponse.json(
      { error: "Respuesta inválida de MercadoPago", details: text },
      { status: 502 }
    );
  }

  console.log("[MP API] Response body:", JSON.stringify(data, null, 2));

  if (!res.ok) {
    console.error("❌ MP preference error:", JSON.stringify(data, null, 2));
    return NextResponse.json(
      {
        error: "MercadoPago rechazó la preferencia",
        mp: data,
        sent: {
          siteUrl,
          external_reference,
          back_urls,
          notification_url: shouldSendNotificationUrl ? notification_url : null,
          items: normalizedItems,
        },
      },
      { status: res.status || 500 }
    );
  }

  return NextResponse.json({
    id: data.id,
    init_point: data.init_point,
    sandbox_init_point: data.sandbox_init_point,
  });
}
