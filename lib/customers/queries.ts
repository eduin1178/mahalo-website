import { and, count, desc, eq, ilike, max, ne, or, sql, type SQL } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import {
  customers,
  orders,
  plans,
  providers,
  type Customer,
  type Order,
  type OrderStatus,
} from "@/lib/db/schema";

export const CUSTOMERS_PAGE_SIZE = 20;

export type CustomerListRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  orderCount: number;
  lastOrderAt: Date | null;
};

export type CustomerListPage = {
  rows: CustomerListRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type CustomerListFilters = {
  search?: string;
  page?: number;
  pageSize?: number;
};

export async function listCustomers(
  filters: CustomerListFilters = {},
): Promise<CustomerListPage> {
  const db = getDb();
  const pageSize = filters.pageSize ?? CUSTOMERS_PAGE_SIZE;
  const page = Math.max(1, filters.page ?? 1);

  const conditions: SQL[] = [];
  const search = (filters.search ?? "").trim();
  if (search) {
    const pattern = `%${search}%`;
    const cond = or(
      ilike(customers.firstName, pattern),
      ilike(customers.lastName, pattern),
      ilike(customers.email, pattern),
      ilike(customers.phone, pattern),
    );
    if (cond) conditions.push(cond);
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(customers)
    .where(where);

  // Exclude Draft orders from "last order" / count metrics: drafts aren't
  // committed orders and would inflate the agent-facing numbers.
  const nonDraft = ne(orders.status, "Draft" as OrderStatus);

  const rows = await db
    .select({
      id: customers.id,
      firstName: customers.firstName,
      lastName: customers.lastName,
      email: customers.email,
      phone: customers.phone,
      createdAt: customers.createdAt,
      orderCount: sql<number>`coalesce(count(${orders.id})::int, 0)`,
      lastOrderAt: max(orders.createdAt),
    })
    .from(customers)
    .leftJoin(orders, and(eq(orders.customerId, customers.id), nonDraft))
    .where(where)
    .groupBy(customers.id)
    .orderBy(desc(customers.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    rows: rows.map((r) => ({
      id: r.id,
      firstName: r.firstName,
      lastName: r.lastName,
      email: r.email,
      phone: r.phone,
      orderCount: Number(r.orderCount ?? 0),
      lastOrderAt: r.lastOrderAt,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export type CustomerOrderRow = {
  id: string;
  status: OrderStatus;
  createdAt: Date;
  scheduledAt: Date | null;
  preferredCallAt: Date | null;
  provider: { id: string; name: string } | null;
  plan: { id: string; name: string } | null;
};

export type CustomerDetail = {
  customer: Customer;
  orders: CustomerOrderRow[];
};

export async function getCustomerById(
  id: string,
): Promise<CustomerDetail | null> {
  const db = getDb();

  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, id))
    .limit(1);
  if (!customer) return null;

  const orderRows = await db
    .select({
      id: orders.id,
      status: orders.status,
      createdAt: orders.createdAt,
      scheduledAt: orders.scheduledAt,
      preferredCallAt: orders.preferredCallAt,
      providerId: providers.id,
      providerName: providers.name,
      planId: plans.id,
      planName: plans.name,
    })
    .from(orders)
    .leftJoin(providers, eq(providers.id, orders.providerId))
    .leftJoin(plans, eq(plans.id, orders.planId))
    .where(eq(orders.customerId, id))
    .orderBy(desc(orders.createdAt));

  return {
    customer,
    orders: orderRows.map((r) => ({
      id: r.id,
      status: r.status,
      createdAt: r.createdAt,
      scheduledAt: r.scheduledAt,
      preferredCallAt: r.preferredCallAt,
      provider: r.providerId ? { id: r.providerId, name: r.providerName! } : null,
      plan: r.planId ? { id: r.planId, name: r.planName! } : null,
    })),
  };
}

export type { Customer, Order };
