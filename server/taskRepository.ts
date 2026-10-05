import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ResultSetHeader, RowDataPacket } from 'mysql2'
import { pool } from './db'

export type TaskStatus = 'Pendente' | 'Em Andamento' | 'Concluído'
export type TaskPhase = 'Estoque' | 'Documentação' | 'Processos' | 'Automações'

export type Task = {
  id: number
  title: string
  phase: TaskPhase
  status: TaskStatus
  due: string
  createdAt: string
  responsible: string
  gravidade: number
  urgencia: number
  tendencia: number
  scoreGut: number
  tag: string
  checklist: Array<{ label: string; done: boolean }>
  promptIa: string
  observacoes: string
}

type TaskRow = RowDataPacket & Omit<Task, 'id' | 'checklist'> & {
  id: number | string
  checklist: Task['checklist'] | string
}

type TaskWrite = Omit<Task, 'id'>

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const seedFilePath = path.join(projectRoot, 'server', 'data', 'tasks.json')
const columns = '`title`, `phase`, `status`, `due`, `createdAt`, `responsible`, `gravidade`, `urgencia`, `tendencia`, `scoreGut`, `tag`, `checklist`, `promptIa`, `observacoes`'
const values = '?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?'

const mapTask = (row: TaskRow): Task => ({
  ...row,
  id: Number(row.id),
  gravidade: Number(row.gravidade),
  urgencia: Number(row.urgencia),
  tendencia: Number(row.tendencia),
  scoreGut: Number(row.scoreGut),
  checklist: typeof row.checklist === 'string' ? JSON.parse(row.checklist) as Task['checklist'] : row.checklist,
})

const writeValues = (task: TaskWrite) => [
  task.title,
  task.phase,
  task.status,
  task.due,
  task.createdAt,
  task.responsible,
  task.gravidade,
  task.urgencia,
  task.tendencia,
  task.scoreGut,
  task.tag,
  JSON.stringify(task.checklist),
  task.promptIa,
  task.observacoes,
]

export const seedTasksIfEmpty = async () => {
  const [countRows] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) AS total FROM tasks')
  if (Number(countRows[0]?.total ?? 0) > 0) return

  const rawTasks = await fs.readFile(seedFilePath, 'utf8')
  const seedTasks = JSON.parse(rawTasks) as Task[]
  if (!seedTasks.length) return

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    for (const task of seedTasks) {
      const taskWrite: TaskWrite = {
        title: task.title,
        phase: task.phase,
        status: task.status,
        due: task.due,
        createdAt: task.createdAt,
        responsible: task.responsible,
        gravidade: task.gravidade,
        urgencia: task.urgencia,
        tendencia: task.tendencia,
        scoreGut: task.gravidade * task.urgencia * task.tendencia,
        tag: task.tag,
        checklist: task.checklist,
        promptIa: task.promptIa,
        observacoes: task.observacoes,
      }
      await connection.execute(`INSERT INTO tasks (id, ${columns}) VALUES (?, ${values})`, [task.id, ...writeValues(taskWrite)])
    }
    await connection.commit()
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export const listTasks = async (): Promise<Task[]> => {
  const [rows] = await pool.query<TaskRow[]>('SELECT * FROM tasks ORDER BY scoreGut DESC, id ASC')
  return rows.map(mapTask)
}

export const findTask = async (id: number): Promise<Task | null> => {
  const [rows] = await pool.execute<TaskRow[]>('SELECT * FROM tasks WHERE id = ?', [id])
  return rows[0] ? mapTask(rows[0]) : null
}

export const createTask = async (task: TaskWrite): Promise<Task> => {
  const [result] = await pool.execute<ResultSetHeader>(`INSERT INTO tasks (${columns}) VALUES (${values})`, writeValues(task))
  return { ...task, id: result.insertId }
}

export const createTasks = async (tasks: TaskWrite[]): Promise<Task[]> => {
  if (!tasks.length) return []

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const createdTasks: Task[] = []
    for (const task of tasks) {
      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO tasks (${columns}) VALUES (${values})`,
        writeValues(task),
      )
      createdTasks.push({ ...task, id: result.insertId })
    }
    await connection.commit()
    return createdTasks
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export const updateTask = async (id: number, task: TaskWrite): Promise<Task | null> => {
  const assignments = columns.split(', ').map((column) => `${column} = ?`).join(', ')
  const [result] = await pool.execute<ResultSetHeader>(`UPDATE tasks SET ${assignments} WHERE id = ?`, [...writeValues(task), id])
  return result.affectedRows ? { ...task, id } : null
}

export const deleteTask = async (id: number): Promise<boolean> => {
  const [result] = await pool.execute<ResultSetHeader>('DELETE FROM tasks WHERE id = ?', [id])
  return result.affectedRows > 0
}
