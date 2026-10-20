# Checklist de implementação

## Interface local

- [x] Abrir o histórico completo pelo menu de atividade.
- [x] Exportar atividades em CSV.
- [x] Editar o nome do perfil e do workspace neste navegador.
- [x] Abrir as referências da área de documentos.
- [x] Revisar acessibilidade e navegação por teclado em todas as telas.
- [x] Validar estados vazios e mensagens de erro nos fluxos principais.

## Integração com backend

- [x] Persistir tarefas e atividades pela API.
- [x] Exibir estados de carregamento e erro durante operações remotas.
- [x] Enfileirar gravações offline e reaplicá-las antes de sincronizar dados do servidor.
- [x] Preservar uma lista vazia sem restaurar tarefas de demonstração após exclusão total.
- [x] Disponibilizar o histórico integral com horários derivados do timestamp do banco.
- [x] Exigir sessão autenticada na API em produção e restringir a origem CORS.
- [ ] Sincronizar perfil e workspace entre usuários e dispositivos.

Ver detalhes das alterações e dos limites conhecidos em [alteracoes-prioridades-2026-10-19.md](alteracoes-prioridades-2026-10-19.md).