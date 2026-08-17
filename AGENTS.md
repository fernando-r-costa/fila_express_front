# Contexto do projeto — Fila Express Frontend

Este projeto é o frontend do Fila Express.

O Fila Express está em produção e mudanças devem ser pequenas, controladas e compatíveis com o backend existente.

## Integração com backend

O backend está na frc-api, módulo:

src/modules/fila-express

Antes de alterar o frontend para suportar uma nova funcionalidade, serviço ou configuração:

1. verificar se o backend já fornece o dado;
2. verificar se o frontend já consome/renderiza isso dinamicamente;
3. preferir configuração/dados antes de adicionar lógica nova;
4. evitar listas fixas quando o catálogo já é dinâmico.

Não duplicar no frontend regras críticas de negócio que pertencem ao backend.

## Catálogo e serviços

O catálogo deve ser tratado como dinâmico sempre que a implementação atual permitir.

Serviços atualmente conhecidos incluem:

- manicure
- pedicure
- brush
- maquiagem
- corte de cabelo

Mas não assumir que essa lista permanecerá fixa.

Antes de adicionar suporte a um novo serviço:

- verificar se basta cadastrá-lo no banco/backend;
- verificar se o frontend já o exibe automaticamente;
- não criar labels, enums, unions ou arrays fixos sem necessidade comprovada.

## Regras de negócio

Regras críticas como:

- FIFO;
- Tetris;
- ordem de serviços;
- simultaneidade;
- disponibilidade;
- profissionais;
- cálculo de horários;

devem permanecer no backend.

O frontend deve apenas refletir o resultado e contratos da API, salvo comportamento estritamente visual.

## Fluxos críticos

Preservar:

- seleção de serviços;
- estimate-time;
- aceite da estimativa;
- join-queue;
- acompanhamento da fila;
- painel administrativo;
- configuração de atendentes;
- relatórios;
- mensagens de erro;
- confirmação/check-in quando aplicável.

## Diagnóstico

Se algo não funcionar:

1. verificar se o dado veio da API;
2. verificar Network/payload/response;
3. verificar console;
4. só então alterar frontend.

Não corrigir backend a partir deste projeto.

## Modo obrigatório de trabalho

Para cada tarefa:

1. auditar;
2. mostrar achados;
3. propor menor alteração;
4. aguardar aprovação;
5. alterar somente o autorizado;
6. validar;
7. mostrar resultado;
8. parar.

Não avançar automaticamente para outra etapa.

## Filosofia

Preferir:

1. comportamento já existente;
2. dados/configuração;
3. pequena mudança de frontend;
4. refatoração apenas com autorização.

Não fazer melhorias paralelas.

Não reorganizar componentes por estética.

Não instalar dependências sem autorização.

Não alterar design system ou arquitetura sem necessidade direta.

## Git

Antes de editar:
git status

Preservar alterações existentes.

Depois:

- revisar git diff;
- executar git diff --check;
- não incluir arquivos não relacionados.

## Validação

Usar os scripts reais encontrados no projeto.

Scripts disponíveis no `package.json`:

- `npm run dev`: `next dev -p 3001 -H 0.0.0.0 --experimental-https`;
- `npm run build`: `next build`;
- `npm run start`: `next start`;
- `npm run lint`: `eslint`;
- `npm run prepare`: `husky`.

Não há scripts dedicados de typecheck ou testes no `package.json`. Quando necessário, a verificação TypeScript deve ocorrer pelo script de build existente, sem inventar um novo comando de projeto.

Conforme a tarefa, validar:

- lint;
- TypeScript;
- build;
- testes existentes;
- smoke test manual.

Não inventar comandos que não existam no package.json.

## Deploy

Fluxo preferido:

local
→ develop
→ validação
→ produção

Não alterar configuração de produção, Vercel ou variáveis de ambiente como efeito colateral de tarefa funcional pequena.

## Regra operacional principal

“Não transformar uma necessidade simples em uma mudança estrutural global.”

Já houve uma situação em que adicionar um serviço levou a mudanças desnecessárias em várias camadas. Isso não deve se repetir.

Se o sistema já suporta uma demanda dinamicamente, usar esse comportamento antes de alterar código.
