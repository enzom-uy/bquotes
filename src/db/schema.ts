import { uuid, primaryKey } from 'drizzle-orm/pg-core'
import {
    index,
    foreignKey,
    pgTable,
    text,
    varchar,
    boolean,
    timestamp,
} from 'drizzle-orm/pg-core'

// ============================================
// Better Auth Tables
// ============================================

export const user = pgTable('user', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: boolean('emailVerified').notNull(),
    image: text('image'),
    createdAt: timestamp('createdAt').notNull(),
    updatedAt: timestamp('updatedAt').notNull(),
})

export const session = pgTable('session', {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expiresAt').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('createdAt').notNull(),
    updatedAt: timestamp('updatedAt').notNull(),
    ipAddress: text('ipAddress'),
    userAgent: text('userAgent'),
    userId: text('userId')
        .notNull()
        .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
    id: text('id').primaryKey(),
    accountId: text('accountId').notNull(),
    providerId: text('providerId').notNull(),
    userId: text('userId')
        .notNull()
        .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('accessToken'),
    refreshToken: text('refreshToken'),
    idToken: text('idToken'),
    accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
    refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('createdAt').notNull(),
    updatedAt: timestamp('updatedAt').notNull(),
})

export const verification = pgTable('verification', {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expiresAt').notNull(),
    createdAt: timestamp('createdAt'),
    updatedAt: timestamp('updatedAt'),
})

export const Books = pgTable('books', {
    id: uuid('id').defaultRandom().primaryKey().notNull(),
    title: text('title').notNull(),
    author_name: text('author_name'),
    summary: text('summary'),
    cover_url: text('cover_url'),
    openlibrary_id: text('openlibrary_id').notNull().unique(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at'),
})

export const Authors = pgTable('authors', {
    id: uuid('id').defaultRandom().primaryKey().notNull(),
    name: text('name').notNull(),
    openlibrary_id: text('openlibrary_id').unique(),
    born: text('born'),
    death: text('death'),
    image_url: text('image_url'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at'),
})

export const BookAuthors = pgTable(
    'book_authors',
    {
        book_id: uuid('book_id').notNull(),
        author_id: uuid('author_id').notNull(),
    },
    (table) => [
        primaryKey({ columns: [table.book_id, table.author_id] }),
        foreignKey({
            columns: [table.book_id],
            foreignColumns: [Books.id],
            name: 'book_authors_book_id_fk',
        }).onDelete('cascade'),
        foreignKey({
            columns: [table.author_id],
            foreignColumns: [Authors.id],
            name: 'book_authors_author_id_fk',
        }).onDelete('cascade'),
    ],
)

// ============================================
// Application Domain Tables
// ============================================

export const Quotes = pgTable('quotes', {
    id: uuid('id').defaultRandom().primaryKey().notNull(),
    book_id: uuid('book_id').notNull(),
    user_id: text('user_id')
        .notNull()
        .references(() => user.id, { onDelete: 'cascade' }),
    text: text('text').notNull(),
    chapter: text('chapter'),
    is_public: boolean('is_public').default(false).notNull(),
    is_favorite: boolean('is_favorite').default(false).notNull(),
    tags: text('tags').array(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at'),
})
