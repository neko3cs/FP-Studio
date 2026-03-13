import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const projectsTable = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  productivity: real('productivity').notNull().default(1)
})

export const functionEntriesTable = sqliteTable('function_entries', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projectsTable.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  functionType: text('function_type', {
    enum: ['EI', 'EO', 'EQ', 'ILF', 'EIF']
  }).notNull(),
  det: integer('det').notNull(),
  referenceCount: integer('reference_count').notNull(),
  difficulty: text('difficulty', {
    enum: ['Low', 'Average', 'High']
  }).notNull(),
  functionPoints: integer('function_points').notNull(),
  note: text('note').notNull().default(''),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
})

export const settingsTable = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: text('updated_at').notNull()
})
