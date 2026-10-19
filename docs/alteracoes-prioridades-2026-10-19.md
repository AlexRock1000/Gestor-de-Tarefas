# Correções das prioridades altas — 19/10/2026

## Kanban

O cartão registra o identificador da tarefa no início do arraste, e a coluna de destino atualiza o status. O indicador de coluna é limpo tanto após o drop quanto ao terminar/cancelar o arraste.

## Edição offline e sincronização

As operações de criação, atualização, exclusão e registro de atividade que falham por indisponibilidade da API são mantidas numa fila no `localStorage`. A fila é executada em ordem antes de baixar o estado do servidor; se uma operação ainda falhar, a sincronização não substitui os dados locais. Quando uma criação offline recebe o ID definitivo do servidor, as operações pendentes e a tarefa local são atualizadas para esse ID.

O armazenamento local também preserva arrays vazios. Assim, apagar todas as tarefas não restaura silenciosamente os exemplos de demonstração.

## Inicialização dos dados

O seed inicial é agora controlado pela configuração persistente `initial_tasks_seeded` na tabela `app_settings`. O primeiro arranque de uma base vazia continua a importar os exemplos; depois disso, apagar todas as tarefas não os importa novamente. Em uma base que já contém dados, a configuração é marcada sem fazer seed.

## Histórico de atividades

A API retorna o histórico inteiro, sem limite de 12 linhas. O horário de exibição é calculado a partir do `createdAt` automático do banco, em vez de confiar no texto "Agora" enviado pelo navegador. O frontend não trunca a lista; edições confirmadas no drawer também geram atividade. O nome do perfil corrente é usado como autor apresentado.

A tabela `activities` já possuía `createdAt`; não é preciso recriá-la para esta alteração. O `CREATE TABLE IF NOT EXISTS` para `app_settings` é aplicado pela inicialização existente.

## Proteção da API

Em produção (`NODE_ENV=production`), o servidor não inicia sem `TASK_APP_USERNAME`, `TASK_APP_PASSWORD` e `SESSION_SECRET` definidos. A API usa sessão assinada em cookie `HttpOnly`, `SameSite=Strict` e `Secure` em produção; as tentativas de login são limitadas a 10 por IP a cada 15 minutos. O CORS aceita somente `APP_ORIGIN` (padrão local: `http://localhost:5173`).

1. Copie `.env.example` para `.env` e configure uma senha forte, um `SESSION_SECRET` aleatório com pelo menos 32 caracteres e a origem real do frontend.
2. Em produção, sirva a aplicação por HTTPS e configure `APP_ORIGIN` com a origem exata do frontend.
3. Não use os valores demonstrativos de `.env.example` como credenciais reais. O arquivo `.env` não deve ser commitado.
4. No desenvolvimento local, se as três variáveis de autenticação estiverem ausentes, a API permanece sem login para facilitar o uso offline; se alguma delas for definida, todas são obrigatórias.

### Limites de segurança conhecidos

Esta implementação protege o acesso por uma conta compartilhada configurada no ambiente. Ainda não há usuários individuais, isolamento de tarefas por usuário/workspace ou gestão/recuperação de contas. O nome de perfil editável é um rótulo de interface, não uma identidade autorizada. Antes de oferecer colaboração multiusuário, implemente contas e autorização por workspace no modelo de dados. O proxy HTTPS e a gestão segura dos segredos continuam sendo responsabilidade do ambiente de deploy.

## Validação

Build e testes do projeto devem ser executados após as alterações. A persistência real do seed, cookies HTTPS e chamadas MySQL requer validação no ambiente de execução configurado.
