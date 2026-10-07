import 'dotenv/config'
import mysql from 'mysql2/promise'
import type { RowDataPacket } from 'mysql2'
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

  const [columnRows] = await pool.query<RowDataPacket[]>(
    'SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = \'tasks\'',
  )
  const columns = new Set(columnRows.map((row) => String(row.COLUMN_NAME)))
  const [constraintRows] = await pool.query<RowDataPacket[]>(
    'SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = \'tasks\' AND CONSTRAINT_TYPE = \'CHECK\'',
  )
  const constraints = new Set(constraintRows.map((row) => String(row.CONSTRAINT_NAME)))
  const dropCheck = async (name: string) => {
    if (constraints.has(name)) {
      await pool.query(`ALTER TABLE tasks DROP CHECK \`${name}\``)
      constraints.delete(name)
    }
  }

  if (columns.has('gravidade') && !columns.has('importancia')) {
    await dropCheck('chk_tasks_gravidade')
    await pool.query('ALTER TABLE tasks CHANGE COLUMN gravidade importancia TINYINT UNSIGNED NOT NULL DEFAULT 3')
    columns.delete('gravidade')
    columns.add('importancia')
  }

  if (columns.has('tendencia')) {
    await dropCheck('chk_tasks_tendencia')
    await pool.query('ALTER TABLE tasks DROP COLUMN tendencia')
    columns.delete('tendencia')
  }

  if (!constraints.has('chk_tasks_importancia')) {
    await pool.query('ALTER TABLE tasks ADD CONSTRAINT chk_tasks_importancia CHECK (importancia BETWEEN 1 AND 5)')
  }
  await pool.query('UPDATE tasks SET scoreGut = importancia * urgencia')
  await pool.query('ALTER TABLE tasks MODIFY scoreGut SMALLINT UNSIGNED NOT NULL DEFAULT 9')
  await pool.query('SELECT 1')
}
