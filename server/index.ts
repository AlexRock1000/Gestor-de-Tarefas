import cors from 'cors'
import express from 'express'
import { initializeDatabase, pool } from './db'
import {
  createTask,
  deleteTask,
  findTask,
  listTasks,
  seedTasksIfEmpty,
  updateTask,
  type Task,
  type TaskPhase,
  type TaskStatus,
} from './taskRepository'

const app = express()
const port = Number(process.env.PORT ?? 3001)

app.use(cors())
app.use(express.json())

app.get('/api/health', async (_req, res) => {
  await pool.query('SELECT 1')
  res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() })
})

app.get('/api/tasks', async (_req, res) => {
  res.json(await listTasks())
})

app.get('/api/tasks/:id', async (req, res) => {
  const task = await findTask(Number(req.params.id))

  if (!task) {
    res.status(404).json({ message: 'Tarefa não encontrada' })
    return
  }

  res.json(task)
})

app.post('/api/tasks', async (req, res) => {
  const title = String(req.body?.title ?? '').trim()

  if (!title) {
    res.status(400).json({ message: 'O título da tarefa é obrigatório.' })
    return
  }

  const newTask: Task = {
    id: 0,
    title,
    phase: (req.body?.phase ?? 'Processos') as TaskPhase,
    status: (req.body?.status ?? 'Pendente') as TaskStatus,
    due: req.body?.due ?? 'Sem prazo',
    createdAt: new Date().toISOString().slice(0, 10),
    responsible: req.body?.responsible ?? 'Não atribuída',
    gravidade: Number(req.body?.gravidade ?? 3),
    urgencia: Number(req.body?.urgencia ?? 3),
    tendencia: Number(req.body?.tendencia ?? 3),
    scoreGut: Number(req.body?.gravidade ?? 3) * Number(req.body?.urgencia ?? 3) * Number(req.body?.tendencia ?? 3),
    tag: req.body?.tag ?? 'Nova',
    checklist: Array.isArray(req.body?.checklist) ? req.body.checklist : [{ label: 'Definir próximo passo', done: false }],
    promptIa: req.body?.promptIa ?? 'Estruture os próximos passos práticos para esta tarefa.',
    observacoes: req.body?.observacoes ?? 'Tarefa criada pela API.',
  }

  const created = await createTask(newTask)
  res.status(201).json(created)
})

app.patch('/api/tasks/:id', async (req, res) => {
  const taskId = Number(req.params.id)
  const current = await findTask(taskId)
  if (!current) {
    res.status(404).json({ message: 'Tarefa não encontrada.' })
    return
  }

  const updatedTask: Task = {
    ...current,
    ...req.body,
    id: taskId,
  }
  updatedTask.scoreGut = Number(updatedTask.gravidade) * Number(updatedTask.urgencia) * Number(updatedTask.tendencia)

  const saved = await updateTask(taskId, updatedTask)
  if (!saved) {
    res.status(404).json({ message: 'Tarefa não encontrada.' })
    return
  }
  res.json(saved)
})

app.delete('/api/tasks/:id', async (req, res) => {
  const taskId = Number(req.params.id)
  const deleted = await deleteTask(taskId)
  if (!deleted) {
    res.status(404).json({ message: 'Tarefa não encontrada.' })
    return
  }

  res.status(204).send()
})

const startServer = async () => {
  try {
    await initializeDatabase()
    await seedTasksIfEmpty()
    app.listen(port, () => console.log(`Backend conectado ao MySQL e ativo em http://localhost:${port}`))
  } catch (error) {
    console.error('Não foi possível iniciar o backend conectado ao MySQL.', error)
    process.exitCode = 1
    await pool.end()
  }
}

void startServer()
