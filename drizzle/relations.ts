import { relations } from 'drizzle-orm/relations'
import {
    user,
    account,
    books,
    quotes,
    session,
    bookAuthors,
    authors,
} from './schema'

export const accountRelations = relations(account, ({ one }) => ({
    user: one(user, {
        fields: [account.userId],
        references: [user.id],
    }),
}))

export const userRelations = relations(user, ({ many }) => ({
    accounts: many(account),
    quotes_userId: many(quotes, {
        relationName: 'quotes_userId_user_id',
    }),
    sessions: many(session),
}))

export const quotesRelations = relations(quotes, ({ one }) => ({
    book: one(books, {
        fields: [quotes.bookId],
        references: [books.id],
    }),
    user_userId: one(user, {
        fields: [quotes.userId],
        references: [user.id],
        relationName: 'quotes_userId_user_id',
    }),
}))

export const booksRelations = relations(books, ({ many }) => ({
    quotes: many(quotes),
    bookAuthors_bookId: many(bookAuthors, {
        relationName: 'bookAuthors_bookId_books_id',
    }),
}))

export const sessionRelations = relations(session, ({ one }) => ({
    user: one(user, {
        fields: [session.userId],
        references: [user.id],
    }),
}))

export const bookAuthorsRelations = relations(bookAuthors, ({ one }) => ({
    book_bookId: one(books, {
        fields: [bookAuthors.bookId],
        references: [books.id],
        relationName: 'bookAuthors_bookId_books_id',
    }),
    author_authorId: one(authors, {
        fields: [bookAuthors.authorId],
        references: [authors.id],
        relationName: 'bookAuthors_authorId_authors_id',
    }),
}))

export const authorsRelations = relations(authors, ({ many }) => ({
    bookAuthors_authorId: many(bookAuthors, {
        relationName: 'bookAuthors_authorId_authors_id',
    }),
}))

