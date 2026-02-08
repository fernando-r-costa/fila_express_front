# Notificacoes WhatsApp - Decisoes e Notas

## Escopo

Enviar mensagens de WhatsApp para a cliente em tres momentos:

1. Entrada na fila confirmada.
2. Quando faltarem 30 minutos e o backend sinalizar esse estado.
3. Confirmacao de presenca (manual ou automatica).

## Provedor

- Selecionado: Meta Cloud API (oficial).
- Motivo: suporta mensagens por template e e estavel.

## Emissor e Pontos de Disparo (apenas backend)

- Evento 1: apos sucesso no POST /join (agendamento criado).
- Evento 2: quando o backend marcar notified=true ou detectar a condicao de 30 minutos.
- Evento 3: quando o PATCH /appointments/:id/confirm for bem sucedido ou quando ocorrer a confirmacao automatica.

## Mensagens Template (provisorias)

Todas as mensagens incluem um link de rastreamento.

1. Entrada na fila confirmada

- Titulo: Confirmação de entrada na fila
- Corpo: "Seu atendimento foi registrado. Acompanhe sua fila aqui: {{1}}"

2. Aviso de 30 minutos

- Titulo: Hora de confirmar!
- Corpo: "Faltam cerca de 30 minutos para o seu atendimento. Confirme aqui: {{1}}"

3. Presenca confirmada

- Titulo: Presença confirmada!
- Corpo: "Sua presença foi confirmada. Nos vemos em breve! Acompanhe: {{1}}"

## URL de rastreamento (temporaria)

- https://fila-express-front-git-develop-fernando-r-costas-projects.vercel.app/fila/{{appointmentId}}
- URL de producao sera definida depois.

<!-- ## Regras de telefone (Brasil apenas)
- Assumir que todos os numeros sao do Brasil. -->

<!-- ### Validacao no frontend
- Aceitar apenas numeros de celular: 11 digitos no total (DDD + 9 + 8 digitos).
- Depois de remover nao-digitos, validar com:
  - ^[1-9]{2}9\d{8}$
- Rejeitar fixo (10 digitos) e formatos invalidos. -->

<!-- ### Normalizacao no backend (E.164)
- Remover todos os caracteres que nao sao digitos.
- Se tiver 11 digitos (DD + 9 + 8), salvar/enviar como: +55 + numero.
  - Exemplo: 11999999999 -> +5511999999999
- Se comecar com 55 e tiver 13 digitos, garantir o + no inicio. -->

## Observacoes

- Templates serao finalizados depois.
- O envio das notificacoes deve ficar somente no backend.
