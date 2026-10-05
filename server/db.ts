import 'dotenv/config'
import mysql from 'mysql2/promise'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const requiredEnv = ['MYSQL_HOST', 'MYSQL_USER', 'MYSQL_PASSWORD', 'MYSQL_DATABASE'] as const
const missingEnv = requiredEnv.filter((name) => process.env[name] === undefined)

if (missingEnv.length) {
  throw new Error(`Configuração MySQL ausente: ${missingEnv.join(', ')}. Copie .env.example para .env e preencha os dados locais.`)
}

export const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT ?? 3306),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
})

export const initializeDatabase = async () => {
  const schemaUrl = new URL('./schema.sql', import.meta.url)
  const schema = await readFile(fileURLToPath(schemaUrl), 'utf8')
  const statements = schema.split(';').map((statement) => statement.trim()).filter(Boolean)
  for (const statement of statements) {
    await pool.query(statement)
  }
  await pool.query('SELECT 1')
}
