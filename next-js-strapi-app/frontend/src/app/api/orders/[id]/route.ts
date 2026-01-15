import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const strapi =
    (process.env.STRAPI_URL ||
      process.env.NEXT_PUBLIC_STRAPI_URL ||
      "http://localhost:1337").replace(/\/$/, "");

  const token = process.env.STRAPI_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "Falta STRAPI_TOKEN en frontend/.env.local" },
      { status: 500 }
    );
  }

  const id = encodeURIComponent(params.id);

  // ✅ En vez de /api/orders/:id, usamos filtro (más compatible)
  const res = await fetch(`${strapi}/api/orders?filters[id][$eq]=${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    return NextResponse.json(
      { error: "Strapi error", status: res.status, details: data },
      { status: res.status }
    );
  }

  // ✅ agarramos el primer resultado
  const row = data?.data?.[0];
  if (!row) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Compatible v4/v5
  const order = row?.attributes ? { id: row.id, ...row.attributes } : row;

  return NextResponse.json(order);
}
