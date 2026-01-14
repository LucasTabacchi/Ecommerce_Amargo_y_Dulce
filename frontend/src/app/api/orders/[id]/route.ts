import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const strapiBase = process.env.NEXT_PUBLIC_STRAPI_URL ?? "http://localhost:1337";

  const res = await fetch(`${strapiBase}/api/orders/${params.id}`, {
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    return NextResponse.json({ error: "Strapi error", details: data }, { status: res.status });
  }

  return NextResponse.json(data);
}
