# Manter atividade no Supabase Free

O fluxo mensal pode reduzir a chance de pausa por inatividade do Supabase Free. O GitHub Actions chama `/api/health` três vezes por dia; esse endpoint faz uma consulta curta à tabela `quiosques`.

## Configuração

1. Faça o deploy do backend com as alterações de `backend/index.js` no host que já atende a API.
2. No repositório do GitHub, abra **Settings → Secrets and variables → Actions** e crie o segredo `BACKEND_URL` com a URL pública base do backend, sem barra no final (por exemplo, `https://minha-api.example.com`).
3. Envie o workflow `.github/workflows/supabase-keepalive.yml` para a branch padrão do repositório. A execução agendada ocorre às 06:00, 12:00 e 18:00 UTC; também pode ser iniciada manualmente na aba **Actions**.
4. Confira a resposta abrindo `https://minha-api.example.com/api/health`. Com o banco acessível, ela retorna `{"status":"ok","database":"ok"}`.

O workflow também acorda hosts de backend que suspendem serviços gratuitos. Agendamentos do GitHub podem atrasar ou ser desativados em repositórios sem atividade por períodos longos, e a consulta não garante que a política do Supabase nunca pause o projeto. A documentação do Supabase diz que atividade diária costuma evitar a pausa; para garantia de não pausa por inatividade, o Supabase exige um plano pago.

## Deploy do frontend na Vercel

O arquivo `frontend/vercel.json` direciona URLs internas do React para `index.html`, evitando o 404 ao abrir ou atualizar diretamente uma rota do dashboard. Configure a raiz do projeto Vercel como `frontend` e defina `VITE_API_URL` com a URL pública base da API antes de publicar.
