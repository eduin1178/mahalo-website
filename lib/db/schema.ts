import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const orderStatusValues = [
  "Draft",
  "Pending",
  "Created",
  "Scheduled",
  "Installed",
  "Completed",
  "Cancelled",
] as const;
export type OrderStatus = (typeof orderStatusValues)[number];

export const phoneTypeValues = ["mobile", "landline"] as const;
export type PhoneType = (typeof phoneTypeValues)[number];

export const providers = pgTable("providers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 120 }).notNull().unique(),
  logoUrl: text("logo_url"),
  primaryColor: varchar("primary_color", { length: 9 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const plans = pgTable("plans", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  providerId: uuid("provider_id")
    .notNull()
    .references(() => providers.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 160 }).notNull(),
  speed: varchar("speed", { length: 64 }).notNull(),
  priceStandard: numeric("price_standard", { precision: 10, scale: 2 }).notNull(),
  priceAutopay: numeric("price_autopay", { precision: 10, scale: 2 }).notNull(),
  features: jsonb("features").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("plans_provider_id_idx").on(t.providerId),
]);

export const addOns = pgTable("add_ons", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  providerId: uuid("provider_id")
    .notNull()
    .references(() => providers.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 160 }).notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("add_ons_provider_id_idx").on(t.providerId),
]);

export const providerCoverage = pgTable("provider_coverage", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  providerId: uuid("provider_id")
    .notNull()
    .references(() => providers.id, { onDelete: "cascade" }),
  zipCode: varchar("zip_code", { length: 5 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("provider_coverage_zip_idx").on(t.zipCode),
  unique("provider_coverage_provider_zip_uniq").on(t.providerId, t.zipCode),
]);

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: varchar("first_name", { length: 80 }).notNull(),
  lastName: varchar("last_name", { length: 80 }).notNull(),
  email: varchar("email", { length: 254 }).notNull().unique(),
  phone: varchar("phone", { length: 32 }).notNull(),
  phoneType: varchar("phone_type", { length: 16 }).notNull().$type<PhoneType>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AddressJson = {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
};

export type CardPayment = {
  type: "card";
  number: string;
  holder: string;
  exp: string;
  cvv: string;
};
export type AchPayment = {
  type: "ach";
  routing: string;
  account: string;
  accountType: "checking" | "savings";
};
export type PaymentData = CardPayment | AchPayment;

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
  providerId: uuid("provider_id").references(() => providers.id, { onDelete: "set null" }),
  planId: uuid("plan_id").references(() => plans.id, { onDelete: "set null" }),
  addOnIds: jsonb("add_on_ids").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  status: varchar("status", { length: 24 }).notNull().default("Draft").$type<OrderStatus>(),
  autopayEnabled: boolean("autopay_enabled").notNull().default(false),
  paymentData: jsonb("payment_data").$type<PaymentData | null>(),
  installationAddress: jsonb("installation_address").$type<AddressJson | null>(),
  billingAddress: jsonb("billing_address").$type<AddressJson | null>(),
  zipCode: varchar("zip_code", { length: 5 }),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  // Proof-of-consent captured when the customer submits the order: acceptance of
  // the Terms of Service + Privacy Policy and the transactional contact opt-in.
  termsAcceptedAt: timestamp("terms_accepted_at", { withTimezone: true }),
  termsVersion: varchar("terms_version", { length: 32 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("orders_status_idx").on(t.status),
  index("orders_customer_id_idx").on(t.customerId),
  index("orders_provider_id_idx").on(t.providerId),
]);

export const orderStatusHistory = pgTable("order_status_history", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 24 }).notNull().$type<OrderStatus>(),
  changedBy: varchar("changed_by", { length: 128 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("order_status_history_order_id_idx").on(t.orderId),
]);

export const settings = pgTable("settings", {
  key: varchar("key", { length: 80 }).notNull(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.key] }),
]);

export const contactMessageStatusValues = ["new", "read", "archived"] as const;
export type ContactMessageStatus = (typeof contactMessageStatusValues)[number];

export const contactMessages = pgTable("contact_messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: varchar("first_name", { length: 80 }).notNull(),
  lastName: varchar("last_name", { length: 80 }).notNull(),
  // Deliberately NOT unique: a lead may submit the contact form multiple times.
  email: varchar("email", { length: 254 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  zipCode: varchar("zip_code", { length: 5 }).notNull(),
  message: text("message").notNull(),
  // Proof-of-consent for the TCPA disclaimer accepted at submit time.
  consent: boolean("consent").notNull(),
  status: varchar("status", { length: 16 })
    .notNull()
    .default("new")
    .$type<ContactMessageStatus>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("contact_messages_status_idx").on(t.status),
  index("contact_messages_created_at_idx").on(t.createdAt),
]);

export type Provider = typeof providers.$inferSelect;
export type NewProvider = typeof providers.$inferInsert;
export type Plan = typeof plans.$inferSelect;
export type NewPlan = typeof plans.$inferInsert;
export type AddOn = typeof addOns.$inferSelect;
export type ProviderCoverage = typeof providerCoverage.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderStatusHistoryRow = typeof orderStatusHistory.$inferSelect;
export type Setting = typeof settings.$inferSelect;
export type ContactMessage = typeof contactMessages.$inferSelect;
export type NewContactMessage = typeof contactMessages.$inferInsert;
