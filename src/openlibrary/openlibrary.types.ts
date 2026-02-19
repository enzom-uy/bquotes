export interface APIOpenLibrarySearchResponse {
    numFound: number
    docs: {
        title: string
        author_name?: string[]
        author_key?: string[]
        cover_i?: number
        key: string
    }[]
}

export interface OpenLibraryBook {
    title: string
    description: string
    covers: number[]
    subjects: string[]
    key: string
    authors: Array<{ author: { key: string }; type: { key: string } }>
}

export type APIOpenLibraryBookResponse = OpenLibraryBook

export interface OpenLibraryAuthor {
    name: string
    bio: string
    birthDate: string
    photos: number[]
    links: Array<{ title: string; url: string; type: { key: string } }>
    key: string
}

export interface APIOpenLibraryAuthorResponse extends OpenLibraryAuthor {
    pictureUrl: string
}
