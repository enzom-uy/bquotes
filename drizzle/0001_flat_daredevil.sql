CREATE TABLE "book_authors" (
	"book_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	CONSTRAINT "book_authors_book_id_author_id_pk" PRIMARY KEY("book_id","author_id")
);
--> statement-breakpoint
ALTER TABLE "books" DROP CONSTRAINT "authors_books_author_id_fk";
--> statement-breakpoint
ALTER TABLE "authors" ADD COLUMN "openlibrary_id" text;--> statement-breakpoint
ALTER TABLE "book_authors" ADD CONSTRAINT "book_authors_book_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_authors" ADD CONSTRAINT "book_authors_author_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books" DROP COLUMN "author_id";--> statement-breakpoint
ALTER TABLE "authors" ADD CONSTRAINT "authors_openlibrary_id_unique" UNIQUE("openlibrary_id");