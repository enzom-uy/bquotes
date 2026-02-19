import {
    BadGatewayException,
    HttpException,
    Injectable,
    NotFoundException,
} from '@nestjs/common'
import {
    OpenLibraryAuthor,
    OpenLibraryBook,
    APIOpenLibrarySearchResponse,
    APIOpenLibraryAuthorResponse,
    APIOpenLibraryBookResponse,
} from './openlibrary.types'
import { PinoLogger } from 'nestjs-pino'
import { extractOLIDFromKey } from './openlibrary.utils'

const FIELDS = 'author_name,author_key,cover_i,key,title'

const OPENLIBRARY_BASE_URL = 'https://openlibrary.org'

@Injectable()
export class OpenlibraryService {
    constructor(private readonly logger: PinoLogger) {}

    async searchBook(query: string, limit?: number) {
        const url = new URL(
            `${OPENLIBRARY_BASE_URL}/search.json?q=${query}&fields=${FIELDS}`,
        )
        if (limit) {
            url.searchParams.append('limit', limit.toString())
        }

        try {
            const response = await fetch(url.href)
            const data = (await response.json()) as APIOpenLibrarySearchResponse
            console.log('Raw API data:', data.docs)
            const transformedResults = data.docs.map((doc) => ({
                title: doc.title,
                authorName:
                    doc.author_name && doc.author_name.length > 0
                        ? doc.author_name
                        : null,
                openlibraryId: extractOLIDFromKey(doc.key) || null,
                coverUrl: doc.cover_i
                    ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
                    : null,
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
                birthDate: authorData.birth_date,
                photos: authorData.photos,
                links: authorData.links,
                key: authorData.key,
                pictureUrl: `https://covers.openlibrary.org/a/olid/${authorId}-L.jpg`,
            }
            return formattedResponse
        } catch (error) {
            this.logger.error({ error }, 'Error fetching author data')
            throw new NotFoundException('Author not found.')
        }
    }

    async getBook(openlibraryId: string) {
        const url = new URL(
            `${OPENLIBRARY_BASE_URL}/books/${openlibraryId}.json`,
        )

        try {
            const response = await fetch(url)

            if (response.status === 404) {
                throw new NotFoundException('Book not found.')
            }

            if (!response.ok)
                throw new BadGatewayException('Openlibrary API error.')

            const data = (await response.json()) as OpenLibraryBook
            const formattedResponse: APIOpenLibraryBookResponse = {
                title: data.title,
                description: data.description,
                covers: data.covers,
                subjects: data.subjects,
                key: data.key,
                authors: data.authors,
            }

            return formattedResponse
        } catch (error) {
            if (error instanceof HttpException) throw error
            this.logger.error({ error }, 'Error fetching book data')
            throw new BadGatewayException('Could not reach OpenLibrary API.')
        }
    }
}
