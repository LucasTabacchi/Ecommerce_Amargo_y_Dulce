// src/app/api/mp/webhook/route.ts
import { NextResponse } from "next/server";

// (Opcional) evitamos que Next cachee / optimice esta route
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);

    // MP puede mandar:
    // - ?type=payment&data.id=123
    // - ?topic=payment&id=123
    const type = url.searchParams.get("type") || url.searchParams.get("topic");

    const qpId =
      url.searchParams.get("data.id") ||
      url.searchParams.get("id") ||
      url.searchParams.get("data[id]");

    // Body (a veces viene vacío o no es JSON)
    let body: any = null;
    try {
      body = await req.json();
    } catch {}

    const bodyId = body?.data?.id || body?.id;
    const paymentId = qpId || bodyId;

    // Responder rápido para que MP no reintente
    if (!paymentId) return NextResponse.json({ ok: true });

    // Solo nos interesa payment
    if (type && type !== "payment") return NextResponse.json({ ok: true });

    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      console.error("Webhook: falta MP_ACCESS_TOKEN");
      return NextResponse.json({ ok: true });
    }

    // 1) Consultar el pago real en MP
    const payRes = await fetch(
      `https://api.mercadopago.com/v1/payments/${encodeURIComponent(
        String(paymentId)
      )}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    const payment = await payRes.json().catch(() => null);

    if (!payRes.ok || !payment) {
      const errText = payment ? JSON.stringify(payment) : "";
      console.error("Webhook: MP payment fetch failed", payRes.status, errText);
      return NextResponse.json({ ok: true });
    }

    const status: string | undefined = payment?.status; // approved / pending / rejected
    const externalRef: string | undefined =
      payment?.external_reference ?? payment?.metadata?.orderId;

    // Marcamos como paid solo si está aprobado
    if (status !== "approved" || !externalRef) {
      return NextResponse.json({ ok: true });
    }

    // 2) Update en Strapi (server-to-server)
    // IMPORTANTE: NO uses NEXT_PUBLIC_STRAPI_URL acá si podés evitarlo.
    const strapi =
      process.env.STRAPI_URL ||
      process.env.NEXT_PUBLIC_STRAPI_URL ||
      "http://localhost:1337";

    const token = process.env.STRAPI_TOKEN;
    if (!token) {
      console.error("Webhook: falta STRAPI_TOKEN (API Token de Strapi)");
      return NextResponse.json({ ok: true });
    }

    // Armamos patch: si tenés orderNumber vacío, lo generamos desde el id (externalRef)
    // (si externalRef es el id numérico, esto te completa el orderNumber)
    const numericId = Number(externalRef);
    const orderNumber =
      Number.isFinite(numericId) && numericId > 0
        ? `AMG-${String(numericId).padStart(4, "0")}`
        : undefined;

    const updatePayload: any = {
      data: {
        orderStatus: "paid",
        mpPaymentId: String(paymentId),
        mpStatus: String(status),
      },
    };

    // Solo setea orderNumber si lo pudimos construir
    if (orderNumber) updatePayload.data.orderNumber = orderNumber;

    const updateRes = await fetch(
      `${strapi}/api/orders/${encodeURIComponent(String(externalRef))}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatePayload),
        cache: "no-store",
      }
    );

    if (!updateRes.ok) {
      const text = await updateRes.text().catch(() => "");
      console.error(
        "Webhook: Strapi update failed",
        updateRes.status,
        text || "(no body)"
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Webhook: fatal error", err?.message || err);
    // Igual respondemos 200 para que MP no reintente eternamente
    return NextResponse.json({ ok: true });
  }
}
