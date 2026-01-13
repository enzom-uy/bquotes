import { uuid } from 'drizzle-orm/pg-core'
import {
    index,
    foreignKey,
    pgTable,
    text,
    varchar,
    boolean,
    timestamp,
} from 'drizzle-orm/pg-core'

export const users = pgTable(
    'users',
    {
        id: uuid('id').defaultRandom().primaryKey().notNull(),
        name: text('name').notNull(),
        email: varchar('email').notNull().unique(),
        profile_picture_url: varchar('profile_picture_url'),

        createdAt: timestamp().defaultNow().notNull(),
        updatedAt: timestamp(),
    },
    (table) => [index('users_email_idx').on(table.email)],
)

export const accounts = pgTable(
    'accounts',
    {
        id: uuid('id').defaultRandom().primaryKey().notNull(),
        provider: varchar('provider').notNull(),
        provider_id: varchar('provider_id').notNull(),
        user_id: uuid('user_id').notNull(),
        createdAt: timestamp().defaultNow().notNull(),
        updatedAt: timestamp(),
    },
    (table) => [
        foreignKey({
            columns: [table.user_id],
            foreignColumns: [users.id],
            name: 'users_accounts_user_id_fk',
        }).onDelete('cascade'),
    ],
)

export const sessions = pgTable(
    'sessions',
    {
        id: uuid('id').defaultRandom().primaryKey().notNull(),
        user_id: uuid('user_id').notNull(),
        token: text('token').notNull().unique(),
        expires_at: timestamp().notNull(),
        ip_address: varchar('ip_address').notNull(),
        user_agent: varchar('user_agent'),
        createdAt: timestamp().defaultNow().notNull(),
        updatedAt: timestamp(),
    },
    (table) => [
        foreignKey({
            columns: [table.user_id],
            foreignColumns: [users.id],
            name: 'users_sessions_user_id_fk',
        }).onDelete('cascade'),
    ],
)

export const Books = pgTable(
    'books',
    {
        id: uuid('id').defaultRandom().primaryKey().notNull(),
        title: text('title').notNull(),
        author_id: text('author_id').notNull(),
        summary: text('summary'),
        cover_url: text('cover_url'),
        openlibrary_id: text('openlibrary_id').notNull().unique(),

        createdAt: timestamp().defaultNow().notNull(),
        updatedAt: timestamp(),
    },
    (table) => [
        foreignKey({
            columns: [table.author_id],
            foreignColumns: [Authors.id],
            name: 'authors_books_author_id_fk',
        }).onDelete('cascade'),
    ],
)

export const Authors = pgTable('authors', {
    id: uuid('id').defaultRandom().primaryKey().notNull(),
    name: text('name').notNull(),
    born: text('born'),
    death: text('death'),
    image_url: text('image_url'),

    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp(),
})

export const Quotes = pgTable('quotes', {
    id: uuid('id').defaultRandom().primaryKey().notNull(),
    book_id: uuid('book_id').notNull(),
    user_id: uuid('user_id').notNull(),
    text: text('text').notNull(),
    chapter: text('chapter'),
    language: text('language'),
    is_public: boolean('is_public').default(false).notNull(),
    is_favorite: boolean('is_favorite').default(false).notNull(),
    tags: text('tags').array(),
})
