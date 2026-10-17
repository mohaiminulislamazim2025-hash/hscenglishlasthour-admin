import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/dal";
import { getOrder } from "@/lib/orders/repository";
import { getStoreSettings } from "@/lib/settings/repository";
import { PrintButton } from "@/components/orders/PrintButton";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { titleCase } from "@/components/ui/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Invoice" };

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();
  const settings = await getStoreSettings();
  const currency = order.currency || settings.currency;

  return (
    <main className="min-h-dvh px-4 py-8 print:px-0 print:py-0">
      <div className="mx-auto max-w-2xl">
        <div className="no-print mb-4 flex items-center justify-between">
          <Link
            href={`/orders/${order.id}`}
            className="text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
          >
            ← Back to order
          </Link>
          <PrintButton />
        </div>

        <div className="print-sheet card rounded-2xl bg-white p-8 text-slate-900">
          <header className="flex items-start justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <h1 className="text-xl font-bold tracking-tight">Nuri Shirt Store</h1>
              <p className="mt-1 text-sm text-slate-500">Order invoice</p>
            </div>
            <div className="text-right text-sm">
              <p className="font-semibold">Invoice #{order.id.slice(0, 8).toUpperCase()}</p>
              <p className="text-slate-500">{formatDateTime(order.createdAt)}</p>
              <p className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                {titleCase(order.status)}
              </p>
            </div>
          </header>

          <section className="mt-6 grid grid-cols-2 gap-6 text-sm">
            <div>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Billed to
              </h2>
              <p className="font-medium">{order.customerName}</p>
              <p className="text-slate-600">{order.customerMobile}</p>
              <p className="mt-1 whitespace-pre-line text-slate-600">{order.customerAddress}</p>
            </div>
            <div className="text-right">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Payment
              </h2>
              <p className="font-medium">{titleCase(order.paymentMethod)}</p>
              <p className="text-slate-600">Currency: {currency}</p>
              <p className="text-slate-600">Placed: {formatDate(order.createdAt)}</p>
            </div>
          </section>

          <table className="mt-8 w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="py-2">Item</th>
                <th className="py-2 text-right">Qty</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.items.length === 0 ? (
                <tr className="border-b border-slate-100">
                  <td className="py-3 text-slate-600">No line items</td>
                  <td className="py-3 text-right tabular-nums text-slate-600">—</td>
                  <td className="py-3 text-right tabular-nums">{formatMoney(order.subtotalBdt, currency)}</td>
                </tr>
              ) : (
                order.items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="py-3">
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-xs text-slate-500">{formatMoney(item.unitPriceBdt, currency)} each</p>
                    </td>
                    <td className="py-3 text-right tabular-nums">{item.quantity}</td>
                    <td className="py-3 text-right tabular-nums">{formatMoney(item.lineTotalBdt, currency)}</td>
                  </tr>
                ))
              )}
              <tr className="border-b border-slate-100">
                <td className="py-3 text-slate-600" colSpan={2}>
                  Delivery charge
                </td>
                <td className="py-3 text-right tabular-nums text-slate-600">
                  {formatMoney(order.deliveryChargeBdt, currency)}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td className="pt-4 text-right font-semibold" colSpan={2}>
                  Total
                </td>
                <td className="pt-4 text-right text-lg font-bold tabular-nums">
                  {formatMoney(order.totalBdt, currency)}
                </td>
              </tr>
            </tfoot>
          </table>

          <p className="mt-8 border-t border-slate-200 pt-4 text-center text-xs text-slate-400">
            Thank you for your order. This invoice was generated by the admin dashboard.
          </p>
        </div>
      </div>
    </main>
  );
}
