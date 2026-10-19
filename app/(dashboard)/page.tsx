import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/feedback";
import { LinkButton } from "@/components/ui/Button";
import { IconBook, IconEye, IconImage, IconOrders, IconPlus } from "@/components/ui/icons";
import { getOverviewStats } from "@/lib/dashboard/stats";
import { formatMoney } from "@/lib/format";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/types/admin";
import { statusTone, titleCase } from "@/components/ui/utils";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const stats = await getOverviewStats();

  const revenueHint = "All non-cancelled orders";

  return (
    <div>
      <PageHeader
        title="Overview"
        description="Live figures from the Supabase backend shared with the public website."
        action={
          <LinkButton href="/books/new" size="md">
            <IconPlus width={16} height={16} />
            Add book
          </LinkButton>
        }
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Total books"
          value={stats.totalBooks}
          hint={`${stats.publishedBooks} published · ${stats.draftBooks} draft`}
          icon={<IconBook />}
        />
        <StatCard
          label="Total orders"
          value={stats.totalOrders}
          hint={`${stats.ordersByStatus.pending} pending`}
          tone="brand"
          icon={<IconOrders />}
        />
        <StatCard
          label="Revenue"
          value={formatMoney(stats.revenue, stats.currency)}
          hint={revenueHint}
          tone="positive"
          icon={<IconImage />}
        />
        <StatCard
          label="Published"
          value={stats.publishedBooks}
          hint="Visible to website visitors"
          tone="neutral"
          icon={<IconEye />}
        />
      </section>

      <section className="mt-5">
        <Card>
          <CardHeader title="Orders by status" description="Every order currently in the system." />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {ORDER_STATUSES.map((status) => (
              <Link
                key={status}
                href={`/orders?status=${status}`}
                className="rounded-xl border border-white/8 bg-white/4 p-3 transition hover:border-[var(--color-brand-soft)]"
              >
                <Badge tone={status}>{ORDER_STATUS_LABELS[status]}</Badge>
                <p className="mt-2 text-xl font-bold tabular-nums text-[var(--color-ink)]">
                  {stats.ordersByStatus[status]}
                </p>
              </Link>
            ))}
          </div>
        </Card>
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Card className="p-0">
          <div className="p-5 pb-0">
            <CardHeader
              title="Recent orders"
              description="Latest 6 orders across all books."
              action={
                <Link href="/orders" className="text-xs font-medium text-[var(--color-brand-soft)] hover:underline">
                  View all
                </Link>
              }
            />
          </div>
          {stats.recentOrders.length === 0 ? (
            <div className="p-5 pt-0">
              <EmptyState
                title="No orders yet"
                description="Orders placed on the website will appear here."
                icon={<IconOrders />}
              />
            </div>
          ) : (
            <ul className="divide-y divide-white/6">
              {stats.recentOrders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/orders/${order.id}`}
                    className="flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-white/4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--color-ink)]">
                        {order.customerName}
                      </p>
                      <p className="truncate text-xs text-[var(--color-ink-muted)]">
                        {order.bookTitle} · {order.customerPhone}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold tabular-nums text-[var(--color-ink)]">
                        {formatMoney(order.totalAmount, order.currency)}
                      </p>
                      <Badge tone={order.status} className="mt-1">
                        {titleCase(order.status)}
                      </Badge>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-0">
          <div className="p-5 pb-0">
            <CardHeader
              title="Recently updated books"
              description="Most recently edited catalog entries."
              action={
                <Link href="/books" className="text-xs font-medium text-[var(--color-brand-soft)] hover:underline">
                  Manage
                </Link>
              }
            />
          </div>
          {stats.recentlyUpdatedBooks.length === 0 ? (
            <div className="p-5 pt-0">
              <EmptyState
                title="No books yet"
                description="Create your first book to start managing content."
                icon={<IconBook />}
                action={
                  <LinkButton href="/books/new" size="sm">
                    <IconPlus width={14} height={14} />
                    Add book
                  </LinkButton>
                }
              />
            </div>
          ) : (
            <ul className="divide-y divide-white/6">
              {stats.recentlyUpdatedBooks.map((book) => (
                <li key={book.id}>
                  <Link
                    href={`/books/${book.id}`}
                    className="flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-white/4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--color-ink)]">{book.title}</p>
                      <p className="truncate text-xs text-[var(--color-ink-muted)]">
                        {book.id} · {book.pageCount ?? 0} pages
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold tabular-nums text-[var(--color-ink)]">
                        {formatMoney(book.offerPrice ?? book.price, book.currency)}
                      </p>
                      <span className={`text-xs ${statusTone(book.isPublished ? "published" : "draft")}`}>
                        {book.isPublished ? "Published" : "Draft"}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <p className="mt-5 text-xs text-[var(--color-ink-muted)]">
        Revenue counts all non-cancelled orders (pending, confirmed, packed, shipped, delivered).
        Cancelled orders are excluded. Figures are read directly from Supabase.
      </p>
    </div>
  );
}
