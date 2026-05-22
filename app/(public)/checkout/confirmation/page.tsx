import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { Button } from "@/components/ui/button";
import { getDb } from "@/lib/db/client";
import { orders } from "@/lib/db/schema";
import { readDraftOrderId } from "@/lib/orders/draft";
import { submitOrder } from "@/lib/orders/draft-actions";

export const dynamic = "force-dynamic";

export default async function CheckoutConfirmationPage() {
  const orderId = await readDraftOrderId();
  if (!orderId) redirect("/");

  const db = getDb();
  const [current] = await db
    .select({ id: orders.id, status: orders.status })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!current) redirect("/");

  if (current.status === "Draft") {
    const result = await submitOrder();
    if (!result.ok) {
      return (
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-semibold tracking-tight text-mahalo-navy-900 sm:text-3xl">
            No pudimos enviar tu pedido
          </h1>
          <p className="text-sm text-muted-foreground">{result.error}</p>
          <div>
            <Button render={<Link href="/checkout/schedule" />}>
              Volver a la programación
            </Button>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-mahalo-navy-900 sm:text-3xl">
          Tu pedido está confirmado
        </h1>
      </header>

      <div className="rounded-lg border bg-card p-6 text-sm leading-relaxed text-foreground">
        <p>
          ¡Gracias! Uno de nuestros agentes te contactará pronto para verificar
          tu identidad (SSN y fecha de nacimiento) antes de activar el servicio.
          Recibirás una confirmación por correo en cuanto se cree el pedido con
          tu proveedor.
        </p>
        <p className="mt-3 text-muted-foreground">
          Referencia:{" "}
          <span className="font-mono text-xs">{orderId.slice(0, 8)}</span>
        </p>
      </div>

      <div>
        <Button render={<Link href="/" />} variant="outline">
          Volver al inicio
        </Button>
      </div>
    </div>
  );
}
