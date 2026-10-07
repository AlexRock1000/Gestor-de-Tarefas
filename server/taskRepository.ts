import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ResultSetHeader, RowDataPacket } from 'mysql2'
import { pool, usesLegacyTaskPriorityColumns } from './db'

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
  importancia: number
  urgencia: number
  scoreGut: number
  tag: string
  checklist: Array<{ label: string; done: boolean }>
  promptIa: string
  observacoes: string
}

type TaskRow = RowDataPacket & Omit<Task, 'id' | 'checklist' | 'importancia'> & {
  id: number | string
  importancia?: number | string
  gravidade?: number | string
  checklist: Task['checklist'] | string
}

type TaskWrite = Omit<Task, 'id'>

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const seedFilePath = path.join(projectRoot, 'server', 'data', 'tasks.json')
const taskColumns = () => [
  '`title`', '`phase`', '`status`', '`due`', '`createdAt`', '`responsible`',
  usesLegacyTaskPriorityColumns ? '`gravidade`' : '`importancia`',
  '`urgencia`', '`scoreGut`', '`tag`', '`checklist`', '`promptIa`', '`observacoes`',
].join(', ')
const placeholders = () => Array(taskColumns().split(', ').length).fill('?').join(', ')

const mapTask = (row: TaskRow): Task => ({
  id: Number(row.id),
  title: row.title,
  phase: row.phase,
  status: row.status,
  due: row.due,
  createdAt: row.createdAt,
  responsible: row.responsible,
  importancia: Number(row.importancia ?? row.gravidade ?? 3),
  urgencia: Number(row.urgencia),
  scoreGut: Number(row.importancia ?? row.gravidade ?? 3) * Number(row.urgencia),
  tag: row.tag,
  checklist: typeof row.checklist === 'string' ? JSON.parse(row.checklist) as Task['checklist'] : row.checklist,
  promptIa: row.promptIa,
  observacoes: row.observacoes,
})

const writeValues = (task: TaskWrite) => [
  task.title,
  task.phase,
  task.status,
  task.due,
  task.createdAt,
  task.responsible,
  task.importancia,
  task.urgencia,
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
        importancia: task.importancia,
        urgencia: task.urgencia,
        scoreGut: task.importancia * task.urgencia,
        tag: task.tag,
        checklist: task.checklist,
        promptIa: task.promptIa,
        observacoes: task.observacoes,
      }
      await connection.execute(`INSERT INTO tasks (id, ${taskColumns()}) VALUES (?, ${placeholders()})`, [task.id, ...writeValues(taskWrite)])
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
  const [rows] = await pool.query<TaskRow[]>('SELECT * FROM tasks ORDER BY id ASC')
  return rows.map(mapTask).sort((left, right) => right.scoreGut - left.scoreGut || left.id - right.id)
}

export const findTask = async (id: number): Promise<Task | null> => {
  const [rows] = await pool.query<TaskRow[]>('SELECT * FROM tasks WHERE id = ?', [id])
  return rows[0] ? mapTask(rows[0]) : null
}

export const createTask = async (task: TaskWrite): Promise<Task> => {
  const [result] = await pool.execute<ResultSetHeader>(`INSERT INTO tasks (${taskColumns()}) VALUES (${placeholders()})`, writeValues(task))
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
        `INSERT INTO tasks (${taskColumns()}) VALUES (${placeholders()})`,
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
  const assignments = taskColumns().split(', ').map((column) => `${column} = ?`).join(', ')
  const [result] = await pool.query<ResultSetHeader>(`UPDATE tasks SET ${assignments} WHERE id = ?`, [...writeValues(task), id])
  return result.affectedRows ? { ...task, id } : null
}

export const deleteTask = async (id: number): Promise<boolean> => {
  const [result] = await pool.execute<ResultSetHeader>('DELETE FROM tasks WHERE id = ?', [id])
  return result.affectedRows > 0
}
