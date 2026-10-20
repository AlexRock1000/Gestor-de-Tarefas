import { parse } from 'dotenv'
import { afterEach, describe, expect, it, vi } from 'vitest'

const authEnvironmentKeys = ['TASK_APP_USERNAME', 'TASK_APP_PASSWORD', 'SESSION_SECRET'] as const
const originalEnvironment = Object.fromEntries(
  [...authEnvironmentKeys, 'NODE_ENV'].map((key) => [key, process.env[key]]),
)

afterEach(() => {
  for (const [key, value] of Object.entries(originalEnvironment)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
  vi.resetModules()
})

describe('autenticação com senha contendo #', () => {
  it('preserva # quando a senha do .env está entre aspas', () => {
    const parsed = parse('TASK_APP_PASSWORD="senha#com#dois-hifens"')
    expect(parsed.TASK_APP_PASSWORD).toBe('senha#com#dois-hifens')
  })

  it('aceita a senha integral, incluindo #, para autenticar', async () => {
    process.env.NODE_ENV = 'test'
    process.env.TASK_APP_USERNAME = 'conta-teste'
    process.env.TASK_APP_PASSWORD = 'senha#com#dois-hifens'
    process.env.SESSION_SECRET = 'segredo-de-teste-com-mais-de-trinta-e-dois-caracteres'
    vi.resetModules()

    const { verifyCredentials, createSessionToken, getSessionUsername } = await import('./auth')
    expect(verifyCredentials('conta-teste', 'senha#com#dois-hifens')).toBe(true)
    expect(verifyCredentials('conta-teste', 'senha')).toBe(false)

    const token = createSessionToken('conta-teste')
    const username = getSessionUsername({
      headers: { cookie: `gestor_session=${token}` },
    } as never)
    expect(username).toBe('conta-teste')
  })
})
