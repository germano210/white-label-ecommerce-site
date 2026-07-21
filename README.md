# Brechó da Cami - Deploy e Arquitetura de Produção

## Visão Geral

Este projeto deve ser publicado com responsabilidades separadas:

- **Frontend**: aplicação React/Vite, servida como site estático.
- **Backend**: API Spring Boot, responsável por autenticação, produtos, missões, pedidos, pagamentos e webhooks.
- **Banco de dados**: PostgreSQL gerenciado.
- **Pagamentos**: gateway externo com checkout hospedado.
- **Imagens/uploads**: storage externo em produção.

A regra principal é: **o frontend nunca confirma pagamento nem guarda dados sensíveis**. O backend é a fonte da verdade.

## Arquitetura Recomendada

```text
https://brechodacami.com
Frontend React

https://api.brechodacami.com
Backend Spring Boot API

PostgreSQL gerenciado
Banco privado, sem acesso público direto

Gateway de pagamento externo
Checkout hospedado + webhook assinado

Storage externo
Imagens de produtos/uploads
