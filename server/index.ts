// Carrega .env antes da configuração de autenticação e do banco.
import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { createActivity, listActivities, type ActivityTone } from './activityRepository'
import {
  clearSessionCookie,
  createSessionToken,
  getSessionUsername,
  isAuthenticationEnabled,
  requireSession,
  setSessionCookie,
  verifyCredentials,
} from './auth'
import { initializeDatabase, pool } from './db'
import {
  createTasks,
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

const allowedOrigin = process.env.APP_ORIGIN ?? 'http://localhost:5173'
app.use(cors({ origin: allowedOrigin, credentials: true }))
app.use(express.json())

app.get('/api/auth/session', (req, res) => {
  const username = getSessionUsername(req)
  res.json({
    authenticated: Boolean(username),
    authenticationEnabled: isAuthenticationEnabled,
    username: username === 'local' ? null : username,
  })
})

const failedLoginAttempts = new Map<string, { count: number; resetAt: number }>()
app.post('/api/auth/login', (req, res) => {
  const clientKey = req.ip ?? 'unknown'
  const now = Date.now()
  const attempts = failedLoginAttempts.get(clientKey)
  if (attempts && attempts.resetAt > now && attempts.count >= 10) {
    res.status(429).json({ message: 'Muitas tentativas. Aguarde 15 minutos e tente novamente.' })
    return
  }

  const username = String(req.body?.username ?? '')
  const password = String(req.body?.password ?? '')
  if (!verifyCredentials(username, password)) {
    const current = attempts && attempts.resetAt > now ? attempts : { count: 0, resetAt: now + 15 * 60_000 }
    failedLoginAttempts.set(clientKey, { ...current, count: current.count + 1 })
    res.status(401).json({
      message: 'Usuário ou senha inválidos. Se a senha no .env contém #, coloque o valor entre aspas e reinicie o servidor.',
    })
    return
  }

  failedLoginAttempts.delete(clientKey)
  setSessionCookie(res, createSessionToken(username))
  res.json({ authenticated: true, authenticationEnabled: true, username })
})

app.post('/api/auth/logout', (_req, res) => {
  clearSessionCookie(res)
  res.status(204).send()
})

app.use('/api', requireSession)

app.get('/api/health', async (_req, res) => {
  await pool.query('SELECT 1')
  res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() })
})

app.get('/api/tasks', async (_req, res) => {
  res.json(await listTasks())
})

app.get('/api/activities', async (_req, res) => {
  res.json(await listActivities())
})

app.post('/api/activities', async (req, res) => {
  const actor = String(req.body?.actor ?? '').trim()
  const message = String(req.body?.message ?? '').trim()
  const tone = req.body?.tone as ActivityTone
  if (!actor || !message || !['teal', 'amber', 'coral'].includes(tone)) {
    res.status(400).json({ message: 'Dados da atividade inválidos.' })
    return
  }

  const activity = await createActivity({
    actor,
    tone,
    message,
    taskTitle: String(req.body?.taskTitle ?? ''),
  })
  res.status(201).json(activity)
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
    importancia: Number(req.body?.importancia ?? req.body?.gravidade ?? 3),
    urgencia: Number(req.body?.urgencia ?? 3),
    scoreGut: Number(req.body?.importancia ?? req.body?.gravidade ?? 3) * Number(req.body?.urgencia ?? 3),
    tag: req.body?.tag ?? 'Nova',
    checklist: Array.isArray(req.body?.checklist) ? req.body.checklist : [{ label: 'Definir próximo passo', done: false }],
    promptIa: req.body?.promptIa ?? 'Estruture os próximos passos práticos para esta tarefa.',
    observacoes: req.body?.observacoes ?? 'Tarefa criada pela API.',
  }

  const created = await createTask(newTask)
  res.status(201).json(created)
})

app.post('/api/tasks/bulk', async (req, res) => {
  if (!Array.isArray(req.body?.tasks) || req.body.tasks.some((task: unknown) => !task || typeof task !== 'object' || typeof (task as { title?: unknown }).title !== 'string')) {
    res.status(400).json({ message: 'A lista de tarefas para importação é inválida.' })
    return
  }

  const created = await createTasks(req.body.tasks as Omit<Task, 'id'>[])
  res.status(201).json(created)
})

app.patch('/api/tasks/:id', async (req, res) => {
  const taskId = Number(req.params.id)
  const current = await findTask(taskId)
  if (!current) {
    res.status(404).json({ message: 'Tarefa não encontrada.' })
    return
  }

  const updatedTask = {
    ...Object.fromEntries(
      Object.entries({ ...current, ...req.body }).filter(([key]) => key !== 'gravidade' && key !== 'tendencia'),
    ),
    id: taskId,
  } as Task
  updatedTask.importancia = Number(req.body?.importancia ?? req.body?.gravidade ?? updatedTask.importancia)
  updatedTask.urgencia = Number(req.body?.urgencia ?? updatedTask.urgencia)
  updatedTask.scoreGut = updatedTask.importancia * updatedTask.urgencia

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
