import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, doublePrecision, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone').notNull().default(''),
  profilePic: text('profile_pic').default(''),
  role: text('role').notNull().default('Normal User'),
  walletBalance: doublePrecision('wallet_balance').notNull().default(0),
  pin: text('pin').notNull().default('1234'),
  status: text('status').notNull().default('Active'),
  commissionRate: doublePrecision('commission_rate').default(0),
  walletLimit: doublePrecision('wallet_limit').default(100000),
  createdAt: timestamp('created_at').defaultNow(),
});

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderIdStr: text('order_id_str').notNull().unique(),
  type: text('type').notNull(),
  userEmail: text('user_email').notNull(),
  userPhone: text('user_phone').notNull().default(''),
  serviceName: text('service_name').notNull(),
  paymentMethod: text('payment_method').notNull().default(''),
  amount: doublePrecision('amount').notNull(),
  trxId: text('trx_id').default(''),
  account: text('account').default(''),
  routingNumber: text('routing_number').default(''),
  accountHolder: text('account_holder').default(''),
  ref: text('ref').default(''),
  status: text('status').notNull().default('Pending'),
  cancellationReason: text('cancellation_reason').default(''),
  date: text('date').notNull(),
  commissionDeducted: doublePrecision('commission_deducted').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const offers = pgTable('offers', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  operator: text('operator').notNull(),
  category: text('category').notNull(),
  mb: text('mb').notNull().default(''),
  min: text('min').notNull().default(''),
  regularPrice: doublePrecision('regular_price').notNull(),
  resellerPrice: doublePrecision('reseller_price').notNull(),
  validity: text('validity').notNull(),
  isEnabled: boolean('is_enabled').notNull().default(true),
  description: text('description').default(''),
  createdAt: timestamp('created_at').defaultNow(),
});

export const tickets = pgTable('tickets', {
  id: serial('id').primaryKey(),
  ticketIdStr: text('ticket_id_str').notNull().unique(),
  userEmail: text('user_email').notNull(),
  userPhone: text('user_phone').default(''),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  status: text('status').notNull().default('Pending'),
  date: text('date').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  tickets: many(tickets),
}));
