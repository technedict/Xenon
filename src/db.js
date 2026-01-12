import pkg from 'pg'
import { configDotenv } from 'dotenv'
const { Pool } = pkg

export const offlineDB = new Pool({connectionString: process.env.OFFLINE_DATABASE_URL})
export const onlineDB = new Pool({connectionString: process.env.ONLINE_DATABASE_URL})