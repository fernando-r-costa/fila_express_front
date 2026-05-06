# Fila Express - Frontend

> Interface web do Fila Express, desenvolvida para atender o fluxo das clientes e da equipe do salão em uma experiência única, responsiva e integrada ao backend compartilhado.

Este projeto permite que as clientes entrem na fila remotamente, escolham serviços, acompanhem a estimativa em tempo real, confirmem presença e façam check-in por QR Code. Também oferece um painel administrativo para a equipe gerenciar a fila, atendentes, catálogo e configurações do salão.

## ✨ Funcionalidades

### Para Clientes

- Entrar na fila de atendimento remotamente através do site do salão.
- Escolher os serviços antes de entrar na fila.
- Visualizar a posição atual, o tempo estimado e o status do atendimento.
- Confirmar presença na hora certa e registrar check-in no salão por QR Code.
- Cancelar o agendamento, quando necessário.

### Para o Salão

- Painel de controle exclusivo para a equipe gerenciar a fila em tempo real.
- Adicionar clientes à fila manualmente para atendimentos presenciais.
- Chamar o próximo cliente, finalizar atendimentos e avançar a ordem da fila.
- Gerenciar atendentes, catálogo de serviços e configurações do salão.
- Consultar histórico, relatórios e informações operacionais do dia.

## 🔌 Integração

O front consome a API compartilhada do ecossistema, com base configurável por ambiente. Em desenvolvimento, ele usa o backend local ou o prefixo `/api/fila-express`; em produção, a URL pode ser ajustada por `NEXT_PUBLIC_API_URL`.

## 💻 Tecnologias Utilizadas

**Frontend:**

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Radix UI
- Lucide React
- Axios

**Backend consumido:**

- API compartilhada em Node.js + Express
- JWT (JSON Web Token)
- Endpoints do módulo `fila-express`

**Ferramentas (Tooling):**

- ESLint (para qualidade de código)
- Prettier (para formatação de código)
- Husky + lint-staged (para automação de qualidade com Git Hooks)
