import { relations } from 'drizzle-orm/relations'
import {
    user,
    account,
    Books,
    Quotes,
    session,
    BookAuthors,
    Authors,
} from './schema'

export const accountRelations = relations(account, ({ one }) => ({
    user: one(user, {
        fields: [account.userId],
        references: [user.id],
    }),
}))

export const userRelations = relations(user, ({ many }) => ({
    accounts: many(account),
    quotes_userId: many(Quotes, {
        relationName: 'quotes_userId_user_id',
    }),
    sessions: many(session),
}))

export const quotesRelations = relations(Quotes, ({ one }) => ({
    book: one(Books, {
        fields: [Quotes.book_id],
        references: [Books.id],
    }),
    user_userId: one(user, {
        fields: [Quotes.user_id],
        references: [user.id],
        relationName: 'quotes_userId_user_id',
    }),
}))

export const booksRelations = relations(Books, ({ many }) => ({
    quotes: many(Quotes),
    bookAuthors_bookId: many(BookAuthors, {
        relationName: 'bookAuthors_bookId_books_id',
    }),
}))

export const sessionRelations = relations(session, ({ one }) => ({
    user: one(user, {
        fields: [session.userId],
        references: [user.id],
    }),
}))

export const bookAuthorsRelations = relations(BookAuthors, ({ one }) => ({
    book_bookId: one(Books, {
        fields: [BookAuthors.book_id],
        references: [Books.id],
        relationName: 'bookAuthors_bookId_books_id',
    }),
    author_authorId: one(Authors, {
        fields: [BookAuthors.author_id],
        references: [Authors.id],
        relationName: 'bookAuthors_authorId_authors_id',
    }),
}))

export const authorsRelations = relations(Authors, ({ many }) => ({
    bookAuthors_authorId: many(BookAuthors, {
        relationName: 'bookAuthors_authorId_authors_id',
    }),
}))
