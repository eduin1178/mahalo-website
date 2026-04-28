import { and, count, desc, eq, gte, ilike, inArray, lte, or, type SQL } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import {
  customers,
  orders,
  plans,
  providers,
  type OrderStatus,
} from "@/lib/db/schema";

export const ORDERS_PAGE_SIZE = 20;

export type OrderListRow = {
  id: string;
  status: OrderStatus;
  scheduledAt: Date | null;
  createdAt: Date;
  customer: { id: string; firstName: string; lastName: string; email: string } | null;
  provider: { id: string; name: string } | null;
  plan: { id: string; name: string } | null;
};

export type OrderListPage = {
  rows: OrderListRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type OrderListFilters = {
  statuses?: OrderStatus[];
  providerId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  page?: number;
  pageSize?: number;
};

export async function listOrders(filters: OrderListFilters = {}): Promise<OrderListPage> {
  const db = getDb();
  const pageSize = filters.pageSize ?? ORDERS_PAGE_SIZE;
  const page = Math.max(1, filters.page ?? 1);

  const conditions: SQL[] = [];
  if (filters.statuses && filters.statuses.length > 0) {
    conditions.push(inArray(orders.status, filters.statuses));
  }
  if (filters.providerId) {
    conditions.push(eq(orders.providerId, filters.providerId));
  }
  if (filters.dateFrom) {
    conditions.push(gte(orders.createdAt, filters.dateFrom));
  }
  if (filters.dateTo) {
    conditions.push(lte(orders.createdAt, filters.dateTo));
  }
  const search = (filters.search ?? "").trim();
  if (search) {
    const pattern = `%${search}%`;
    const searchCond = or(
      ilike(customers.firstName, pattern),
      ilike(customers.lastName, pattern),
      ilike(customers.email, pattern),
    );
    if (searchCond) conditions.push(searchCond);
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(orders)
    .leftJoin(customers, eq(customers.id, orders.customerId))
    .where(where);

  const rows = await db
    .select({
      id: orders.id,
      status: orders.status,
      scheduledAt: orders.scheduledAt,
      createdAt: orders.createdAt,
      customerId: customers.id,
      customerFirstName: customers.firstName,
      customerLastName: customers.lastName,
      customerEmail: customers.email,
      providerId: providers.id,
      providerName: providers.name,
      planId: plans.id,
      planName: plans.name,
    })
    .from(orders)
    .leftJoin(customers, eq(customers.id, orders.customerId))
    .leftJoin(providers, eq(providers.id, orders.providerId))
    .leftJoin(plans, eq(plans.id, orders.planId))
    .where(where)
    .orderBy(desc(orders.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const mapped: OrderListRow[] = rows.map((r) => ({
    id: r.id,
    status: r.status,
    scheduledAt: r.scheduledAt,
    createdAt: r.createdAt,
    customer: r.customerId
      ? {
          id: r.customerId,
          firstName: r.customerFirstName!,
          lastName: r.customerLastName!,
          email: r.customerEmail!,
        }
      : null,
    provider: r.providerId ? { id: r.providerId, name: r.providerName! } : null,
    plan: r.planId ? { id: r.planId, name: r.planName! } : null,
  }));

  return {
    rows: mapped,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
