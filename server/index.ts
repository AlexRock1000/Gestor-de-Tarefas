import cors from 'cors'
import express from 'express'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

type TaskStatus = 'Pendente' | 'Em Andamento' | 'Concluído'
type TaskPhase = 'Estoque' | 'Documentação' | 'Processos' | 'Automações'

type Task = {
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

const app = express()
const port = Number(process.env.PORT ?? 3001)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dataFilePath = path.join(__dirname, 'data', 'tasks.json')

const defaultTasks: Task[] = [
  {
    id: 1,
    title: 'Mapear itens sem giro há 90 dias',
    phase: 'Estoque',
    status: 'Em Andamento',
    due: 'Hoje',
    createdAt: '2026-09-12',
    responsible: 'Daniel Rocha',
    gravidade: 5,
    urgencia: 4,
    tendencia: 5,
    scoreGut: 100,
    tag: 'Diagnóstico',
    checklist: [
      { label: 'Exportar relatório do ERP', done: true },
      { label: 'Classificar itens por curva ABC', done: true },
      { label: 'Validar lista com compras', done: false },
    ],
    promptIa: 'Analise os itens sem giro há 90 dias e proponha uma ação de redução de estoque com base em risco financeiro, espaço e demanda real.',
    observacoes: 'Aular itens duplicados no ERP e confirmar data de última movimentação antes da decisão final.',
  },
  {
    id: 2,
    title: 'Definir política de inventário cíclico',
    phase: 'Estoque',
    status: 'Pendente',
    due: '18 set',
    createdAt: '2026-09-14',
    responsible: 'Ana Maria',
    gravidade: 4,
    urgencia: 3,
    tendencia: 5,
    scoreGut: 60,
    tag: 'Política',
    checklist: [
      { label: 'Levantar frequência atual', done: false },
      { label: 'Propor nova frequência', done: false },
      { label: 'Validar com área de compras', done: false },
    ],
    promptIa: 'Crie uma política de inventário cíclico para reduzir faltas e excesso, com critério por categoria e frequência de revisão.',
    observacoes: 'Precisa alinhar com a política fiscal e taxas de obsolescência da operação.',
  },
  {
    id: 3,
    title: 'Revisar contratos de fornecedores',
    phase: 'Documentação',
    status: 'Em Andamento',
    due: '20 set',
    createdAt: '2026-09-10',
    responsible: 'Lucas Costa',
    gravidade: 4,
    urgencia: 4,
    tendencia: 4,
    scoreGut: 64,
    tag: 'Contratos',
    checklist: [
      { label: 'Consolidar contratos vigentes', done: true },
      { label: 'Sinalizar cláusulas críticas', done: false },
      { label: 'Agendar revisão jurídica', done: false },
    ],
    promptIa: 'Revise os contratos de fornecedores e destaque riscos jurídicos, prazos e cláusulas que exigem renegociação.',
    observacoes: 'Alguns contratos ainda possuem cláusulas de penalidade sem data de revisão.',
  },
]

const ensureDataFile = async () => {
  await fs.mkdir(path.dirname(dataFilePath), { recursive: true })

  try {
    await fs.access(dataFilePath)
  } catch {
    await fs.writeFile(dataFilePath, JSON.stringify(defaultTasks, null, 2), 'utf8')
  }
}

const readTasks = async (): Promise<Task[]> => {
  await ensureDataFile()

  try {
    const raw = await fs.readFile(dataFilePath, 'utf8')
    const parsed = JSON.parse(raw) as Task[]
    return Array.isArray(parsed) ? parsed : defaultTasks
  } catch {
    return defaultTasks
  }
}

const writeTasks = async (tasks: Task[]) => {
  await ensureDataFile()
  await fs.writeFile(dataFilePath, JSON.stringify(tasks, null, 2), 'utf8')
}

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend do Gestor de Tarefas ativo',
    timestamp: new Date().toISOString(),
  })
})

app.get('/api/tasks', async (_req, res) => {
  const tasks = await readTasks()
  res.json(tasks)
})

app.get('/api/tasks/:id', async (req, res) => {
  const tasks = await readTasks()
  const task = tasks.find((item) => item.id === Number(req.params.id))

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

  const tasks = await readTasks()
  const newTask: Task = {
    id: Date.now(),
    title,
    phase: (req.body?.phase ?? 'Processos') as TaskPhase,
    status: (req.body?.status ?? 'Pendente') as TaskStatus,
    due: req.body?.due ?? 'Sem prazo',
    createdAt: new Date().toISOString().slice(0, 10),
    responsible: req.body?.responsible ?? 'Não atribuída',
    gravidade: Number(req.body?.gravidade ?? 3),
    urgencia: Number(req.body?.urgencia ?? 3),
    tendencia: Number(req.body?.tendencia ?? 3),
    scoreGut: Number(req.body?.scoreGut ?? 27),
    tag: req.body?.tag ?? 'Nova',
    checklist: Array.isArray(req.body?.checklist) ? req.body.checklist : [{ label: 'Definir próximo passo', done: false }],
    promptIa: req.body?.promptIa ?? 'Estruture os próximos passos práticos para esta tarefa.',
    observacoes: req.body?.observacoes ?? 'Tarefa criada pela API.',
  }

  const nextTasks = [...tasks, newTask]
  await writeTasks(nextTasks)
  res.status(201).json(newTask)
})

app.patch('/api/tasks/:id', async (req, res) => {
  const taskId = Number(req.params.id)
  const tasks = await readTasks()
  const index = tasks.findIndex((task) => task.id === taskId)

  if (index === -1) {
    res.status(404).json({ message: 'Tarefa não encontrada.' })
    return
  }

  const updatedTask = {
    ...tasks[index],
    ...req.body,
  } as Task

  tasks[index] = updatedTask
  await writeTasks(tasks)
  res.json(updatedTask)
})

app.delete('/api/tasks/:id', async (req, res) => {
  const taskId = Number(req.params.id)
  const tasks = await readTasks()
  const filtered = tasks.filter((task) => task.id !== taskId)

  if (filtered.length === tasks.length) {
    res.status(404).json({ message: 'Tarefa não encontrada.' })
    return
  }

  await writeTasks(filtered)
  res.status(204).send()
})

app.listen(port, () => {
  console.log(`Backend rodando em http://localhost:${port}`)
})
