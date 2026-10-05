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
}

type ActivityRow = RowDataPacket & Activity & { id: number | string }

type NewActivity = Omit<Activity, 'id'>

const mapActivity = (row: ActivityRow): Activity => ({
  ...row,
  id: Number(row.id),
})

export const listActivities = async (): Promise<Activity[]> => {
  const [rows] = await pool.query<ActivityRow[]>(
    'SELECT id, actor, tone, message, taskTitle, time FROM activities ORDER BY id DESC LIMIT 12',
  )
  return rows.map(mapActivity)
}

export const createActivity = async (activity: NewActivity): Promise<Activity> => {
  const [result] = await pool.execute<ResultSetHeader>(
    'INSERT INTO activities (actor, tone, message, taskTitle, time) VALUES (?, ?, ?, ?, ?)',
    [activity.actor, activity.tone, activity.message, activity.taskTitle, activity.time],
  )
  return { ...activity, id: result.insertId }
}
