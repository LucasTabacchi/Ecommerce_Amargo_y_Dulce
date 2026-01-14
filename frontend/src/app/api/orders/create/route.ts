import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const strapiBase = process.env.NEXT_PUBLIC_STRAPI_URL ?? "http://localhost:1337";

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Body inválido (se esperaba JSON)" },
      { status: 400 }
    );
  }

  console.log("[orders/create] Enviando a Strapi:", JSON.stringify(body, null, 2));

  const res = await fetch(`${strapiBase}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  console.log("[orders/create] Strapi response status:", res.status);

  let data: any = null;
  try {
    data = await res.json();
  } catch (e) {
    const text = await res.text().catch(() => "");
    console.error("❌ [orders/create] Strapi devolvió respuesta inválida:", text);
    return NextResponse.json(
      { error: "Strapi devolvió respuesta inválida", details: text },
      { status: 502 }
    );
  }

  console.log("[orders/create] Strapi response body:", JSON.stringify(data, null, 2));

  if (!res.ok) {
    console.error("❌ [orders/create] Strapi error status:", res.status);
    return NextResponse.json(
      { error: "Strapi error", details: data },
      { status: res.status }
    );
  }

  // Strapi v5: envuelve en { data: {...} }
  // Pasar la respuesta tal cual (Next se la recibirá el cliente)
  console.log("[orders/create] ✅ Orden creada exitosamente");
  return NextResponse.json(data);
}
