import { Container } from "@/components/layout/Container";

export default function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  return (
    <Container>
      <div className="py-10">
        <h1 className="text-2xl font-bold">Detalle: {params.slug}</h1>
        <p className="mt-2 text-neutral-600">Pendiente: galería, precio, stock y agregar al carrito.</p>
      </div>
    </Container>
  );
}
