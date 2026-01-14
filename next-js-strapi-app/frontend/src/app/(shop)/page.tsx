import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { InfoStrip } from "@/components/home/InfoStrip";
import { HomeBestSellers } from "@/components/home/HomeBestSellers";
import { strapiGet } from "@/lib/strapi";
import { toCardItem } from "@/lib/strapi-mappers";

type HomePageData = {
  bestSellers?: any[];
};

export default async function HomePage() {
  // Traemos el single type home-page con la relación bestSellers poblada
  const res = await strapiGet<{ data: HomePageData }>(
    "/api/home-page?populate[bestSellers][populate]=*"
  );

  const bestSellers = (res?.data?.bestSellers ?? []).map(toCardItem);

  return (
    <>
      {/* HERO / PRESENTACIÓN */}
      <Container>
        <div className="py-10">
          <h1 className="text-3xl font-bold">Amargo y Dulce</h1>
          <p className="mt-2 text-neutral-600">
            Base de Next.js lista para conectar con Strapi.
          </p>

          <div className="mt-6 flex gap-3">
            <Link
              className="rounded-md bg-red-600 px-4 py-2 text-white"
              href="/productos"
            >
              Ver productos
            </Link>
            <Link
              className="rounded-md border px-4 py-2"
              href="/login"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      </Container>

      {/* BANDA DE INFORMACIÓN */}
      <Container>
        <div className="mb-10">
          <InfoStrip />
        </div>
      </Container>

      {/* PRODUCTOS MÁS COMPRADOS */}
      <Container>
        <HomeBestSellers products={bestSellers} />
      </Container>
    </>
  );
}

