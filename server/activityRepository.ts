import type { ResultSetHeader, RowDataPacket } from 'mysql2'
import { pool } from './db'

export type ActivityTone = 'teal' | 'amber' | 'coral'

export type Activity = {
  id: number
  actor: string
  tone: ActivityTone
  message: string
  taskTitle: string
  time: string
  createdAt: string
}

type ActivityRow = RowDataPacket & Omit<Activity, 'createdAt'> & {
  id: number | string
  createdAt: Date | string
}

type NewActivity = Pick<Activity, 'actor' | 'tone' | 'message' | 'taskTitle'>

const mapActivity = (row: ActivityRow): Activity => ({
  actor: row.actor,
  tone: row.tone,
  message: row.message,
  taskTitle: row.taskTitle,
  createdAt: new Date(row.createdAt).toISOString(),
  time: formatActivityTime(new Date(row.createdAt)),
  id: Number(row.id),
})

const formatActivityTime = (createdAt: Date) => {
  const minutesAgo = Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / 60_000))
  if (minutesAgo < 1) return 'Agora'
  if (minutesAgo < 60) return `Há ${minutesAgo} min`
  const hoursAgo = Math.floor(minutesAgo / 60)
  if (hoursAgo < 24) return `Há ${hoursAgo} h`
  const daysAgo = Math.floor(hoursAgo / 24)
  if (daysAgo < 7) return `Há ${daysAgo} d`
  return createdAt.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export const listActivities = async (): Promise<Activity[]> => {
  const [rows] = await pool.query<ActivityRow[]>(
    'SELECT id, actor, tone, message, taskTitle, createdAt FROM activities ORDER BY createdAt DESC, id DESC',
  )
  return rows.map(mapActivity)
}

export const createActivity = async (activity: NewActivity): Promise<Activity> => {
  const [result] = await pool.execute<ResultSetHeader>(
    'INSERT INTO activities (actor, tone, message, taskTitle) VALUES (?, ?, ?, ?)',
    [activity.actor, activity.tone, activity.message, activity.taskTitle],
  )
  const [rows] = await pool.query<ActivityRow[]>(
    'SELECT id, actor, tone, message, taskTitle, createdAt FROM activities WHERE id = ?',
    [result.insertId],
  )
  return mapActivity(rows[0])
}
