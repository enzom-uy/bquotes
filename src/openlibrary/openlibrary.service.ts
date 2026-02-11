import { Injectable, NotFoundException } from '@nestjs/common'
import {
    OpenLibraryAuthor,
    OpenLibraryBook,
    APIOpenLibrarySearchResponse,
    APIOpenLibraryAuthorResponse,
    APIOpenLibraryBookResponse,
} from './openlibrary.types'
import { PinoLogger } from 'nestjs-pino'

const FIELDS = 'title,author_name,key,isbn'

const OPENLIBRARY_BASE_URL = 'https://openlibrary.org'

@Injectable()
export class OpenlibraryService {
    constructor(private readonly logger: PinoLogger) {}

    async searchBook(query: string, limit?: number) {
        const url = new URL(
            `${OPENLIBRARY_BASE_URL}/search.json?q=${query}&sort=rating&lang=es&fields=${FIELDS}`,
        )
        if (limit) {
            url.searchParams.append('limit', limit.toString())
        }

        try {
            const response = await fetch(url)
            const data = (await response.json()) as APIOpenLibrarySearchResponse
            const transformedResults = data.docs.map((doc) => ({
                title: doc.title,
                author_name: doc.author_name || [],
                isbn: doc.isbn[0],
                coverUrl: `https://covers.openlibrary.org/b/isbn/${doc.isbn[0]}-L.jpg`,
            }))
            return transformedResults
        } catch (error) {
            this.logger.error({ error }, 'Error fetching search results')
            return null
        }
    }

    async getAuthor(authorId: string) {
        const authorDataURL = new URL(
            `${OPENLIBRARY_BASE_URL}/authors/${authorId}.json`,
        )
        try {
            const authorData = await fetch(authorDataURL).then((res) =>
                res.json(),
            )
            const formattedResponse: APIOpenLibraryAuthorResponse = {
                name: authorData.name,
                bio: authorData.bio,
                birth_date: authorData.birth_date,
                photos: authorData.photos,
                links: authorData.links,
                key: authorData.key,
                picture_url: `https://covers.openlibrary.org/a/olid/${authorId}-L.jpg`,
            }
            return formattedResponse
        } catch (error) {
            this.logger.error({ error }, 'Error fetching author data')
            throw new NotFoundException('Author not found.')
        }
    }

    async getBook(openlibraryId: string) {
        const url = new URL(`${OPENLIBRARY_BASE_URL}/books/${openlibraryId}`)

        try {
            const response = await fetch(url)
            const data = (await response.json()) as OpenLibraryBook
            const formattedResponse: APIOpenLibraryBookResponse = {
                title: data.title,
                description: data.description,
                covers: data.covers,
                subjects: data.subjects,
                key: data.key,
            }

            return formattedResponse
        } catch (error) {
            this.logger.error({ error }, 'Error fetching book data')
            return null
        }
    }
}
