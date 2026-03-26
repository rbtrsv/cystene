import { pgTable, smallserial, text, varchar, timestamp, numeric, date, boolean, integer, uuid, jsonb, index, uniqueIndex, pgEnum, pgSchema, primaryKey } from 'drizzle-orm/pg-core';
import { USER_ROLES } from '../schema-constants';

// ===============================================
// AUTHENTICATION SYSTEM
// ===============================================

// Supabase Auth schema
export const authSchema = pgSchema('auth');

export const supabaseUsers = authSchema.table('users', {
  id: uuid('id').primaryKey(),
});

export const userProfiles = pgTable('user_profiles', {
  id: smallserial('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => supabaseUsers.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).notNull(),
  name: varchar('name', { length: 100 }),
  role: varchar('role', { length: 50 }).default(USER_ROLES.VIEWER),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  deletedAt: timestamp('deleted_at'),
}, (table) => [
  uniqueIndex('idx_user_profiles_user').on(table.userId)
]);

// ===============================================
// AUDIT SYSTEM
// ===============================================

export const auditLog = pgTable('audit_log', {
  id: smallserial('id').primaryKey(),
  tableName: text('table_name').notNull(),
  recordId: integer('record_id').notNull(),
  action: text('action').notNull(),
  oldData: jsonb('old_data'),
  newData: jsonb('new_data'),
  changedBy: uuid('changed_by'),
  changedAt: timestamp('changed_at', { withTimezone: true }).defaultNow()
}, (table) => [
  index('idx_audit_log_table_name').on(table.tableName),
  index('idx_audit_log_record_id').on(table.recordId),
  index('idx_audit_log_action').on(table.action),
  index('idx_audit_log_changed_by').on(table.changedBy),
  index('idx_audit_log_changed_at').on(table.changedAt)
]);