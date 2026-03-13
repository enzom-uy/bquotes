if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from 'drizzle/schema'
import { migrate } from 'drizzle-orm/node-postgres/migrator'

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
})

export const db = drizzle(pool, { schema })

if (process.env.NODE_ENV === 'production') {
    migrate(db, {
        migrationsFolder: 'drizzle',
    })
}

export type DrizzleDB = typeof db
