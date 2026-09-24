# Diretrizes de experiência do usuário

## Objetivo

Este documento orienta as próximas evoluções do Gestor de Tarefas. A experiência deve ajudar as pessoas a entender o que precisa de atenção, encontrar a próxima ação e concluir o trabalho com o mínimo de esforço.

Toda mudança de interface deve partir de uma necessidade de uso. Aparência e tecnologia devem apoiar essa necessidade, com clareza, confiança, acessibilidade e consistência.

## Direção atual da interface

A interface usa a organização visual do Spotify como referência de navegação: menu lateral, biblioteca de atalhos, área principal de trabalho, busca em destaque e uma paleta escura com verde para ações importantes. É uma inspiração de padrões de uso, não uma reprodução da marca ou de seus elementos proprietários.

A experiência atual organiza o trabalho assim:

- A aplicação abre em **Minhas tarefas**, onde a pessoa pode começar a trabalhar imediatamente.
- A navegação lateral separa as áreas do produto e a biblioteca de tarefas.
- A biblioteca oferece atalhos para **Todas as tarefas**, **Para hoje**, **Prioritárias** e **Concluídas**.
- A busca fica disponível no topo e pesquisa tarefas enquanto a pessoa digita.
- **Nova tarefa** é uma ação primária fácil de localizar.
- Os filtros mais usados aparecem como opções rápidas; fase, status, responsável, prazo e prioridade ficam em **Mais filtros** até serem necessários.
- Atividade recente e ajuda com prompts ficam como apoio ao fluxo principal, sem competir com a lista.
- Em telas menores, a navegação passa para uma faixa rolável e o conteúdo ocupa uma coluna.

Os contadores, filtros e estados devem sempre refletir os mesmos dados. Ao abrir um atalho da biblioteca, filtros avançados anteriores são limpos para evitar resultados inesperados.

## Princípios de produto

### 1. Mostrar primeiro o próximo passo

Priorize as tarefas e ações do dia a dia na tela inicial. Relatórios e indicadores ajudam a entender o contexto, mas não devem empurrar a lista de trabalho para baixo nem competir com a ação principal.

### 2. Tornar a navegação previsível

Use nomes curtos e familiares. A pessoa deve conseguir identificar onde está, voltar a uma visão conhecida e antecipar o resultado de cada atalho. Mantenha a seleção ativa visível.

### 3. Revelar complexidade quando fizer falta

Deixe as opções frequentes à vista. Agrupe filtros e configurações menos usados atrás de controles claramente nomeados, como **Mais filtros**. Sempre indique quando um filtro está ativo e ofereça uma maneira simples de limpá-lo.

### 4. Dar retorno claro a cada ação

Depois de criar, editar, concluir, excluir, copiar ou importar dados, informe o resultado de forma visível e imediata. Preserve o contexto da pessoa sempre que possível e permita desfazer ações destrutivas quando o fluxo comportar isso.

### 5. Usar visual para orientar, não decorar

Use cor, contraste, tamanho e espaçamento para indicar prioridade, estado e hierarquia. Reserve a cor de destaque para ações principais e informação relevante. Não dependa somente da cor para comunicar status.

### 6. Projetar para diferentes pessoas e dispositivos

Mantenha textos legíveis, controles nomeados, foco de teclado visível e ordem de navegação lógica. Em telas pequenas, preserve acesso às funções importantes sem exigir precisão excessiva ou rolagem horizontal da página inteira.

### 7. Mostrar informação verdadeira

Contadores, datas, progresso, nomes e indicadores devem vir dos dados atuais. Evite datas fixas, exemplos apresentados como informação real e números que não correspondam ao filtro mostrado.

## Diretrizes para próximas alterações

Antes de implementar uma mudança:

1. Identifique quem está usando a função, em que situação e qual tarefa deseja concluir.
2. Descreva o caminho atual e a dificuldade que a mudança deve resolver.
3. Prefira a solução que exige menos decisões e etapas sem esconder controles importantes.
4. Reutilize padrões visuais e de interação que já existem no produto.
5. Considere estados carregando, vazio, sucesso, erro e sem permissão quando forem aplicáveis.
6. Confira o fluxo em desktop e celular, incluindo teclado e leitor de tela nos controles interativos.
7. Avalie a mudança pelo efeito no tempo, na compreensão ou na confiança da pessoa, não só pela quantidade de componentes alterados.

### Checklist de revisão

- A ação principal da tela está clara?
- Os rótulos descrevem o resultado esperado?
- A seleção atual e os filtros ativos ficam visíveis?
- A busca, os atalhos e os contadores correspondem aos resultados apresentados?
- A pessoa recebe feedback depois de uma ação?
- É possível completar o fluxo com teclado e identificar o foco?
- Os controles continuam fáceis de encontrar e usar em telas estreitas?
- Os textos, exemplos e dados exibidos são corretos e compreensíveis?
- O novo elemento ajuda no fluxo principal sem criar distração ou duplicação?

## Próximas oportunidades

As próximas melhorias devem continuar priorizando a experiência de ponta a ponta, com atenção especial a:

- simplificar a criação e a edição de tarefas;
- facilitar a identificação da próxima tarefa importante;
- melhorar a edição rápida de status e prazo;
- apresentar estados vazios e resultados de busca sem ambiguidade;
- validar acessibilidade, legibilidade e navegação por teclado;
- manter uma experiência consistente entre desktop e celular;
- tornar relatórios e atividade úteis sem sobrecarregar a tela inicial.

## Registro da atualização de interface

A atualização inspirada na navegação do Spotify reorganizou a entrada do produto para abrir na lista de tarefas, acrescentou atalhos da biblioteca, tornou a criação mais visível, recolheu filtros avançados e ajustou a navegação para telas menores. A inspiração visual foi aplicada ao contexto de gestão de tarefas, mantendo os nomes, estados e ações próprios do produto.
