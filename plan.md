# Copa 2026 Palpites — Plano de Arquitetura & Desenvolvimento

## Stack Final
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth custom + Realtime)
- **API Externa**: football-data.org (plano free)
- **Banco**: PostgreSQL (Supabase-hosted)
- **Deploy**: Vercel (frontend) + Supabase (backend/DB)
- **Auth**: Custom (tabela `users` + bcrypt)

---

## Arquitetura

```
┌─────────────────────────────────────────────────────┐
│ FRONTEND (React + Vite)                             │
│ - Autenticação (users + bcrypt)                      │
│ - Dashboard (Home com cards)                         │
│ - Matches (palpites com bloqueio 5min)               │
│ - Ranking global                                     │
│ - Histórico filtrado (data/time)                     │
│ - Ligas privadas (CRUD + ranking)                    │
│ - Estatísticas pessoais                              │
│ - Admin Panel (sync + gerenciar resultados)          │
└──────────────┬──────────────────────────────────────┘
               │
┌──────────────┴──────────────────────────────────────┐
│ SUPABASE (Backend + Database)                       │
│ - PostgreSQL (todas as tabelas, RLS desabilitado)   │
│ - Realtime subscriptions                            │
│ - Views: global_rankings, league_rankings           │
│ - sync_logs + app_config tables                     │
└──────────────┬──────────────────────────────────────┘
               │
┌──────────────┴──────────────────────────────────────┐
│ EXTERNAL: football-data.org API                     │
│ - Fetch matches + resultados via script Node.js     │
│ - Admin clica "Sincronizar" e roda npm run sync     │
└─────────────────────────────────────────────────────┘
```

---

## Tolerância a Falhas (API)

| Cenário | Ação |
|---|---|
| Script roda com sucesso | Salvar em matches, log "OK" |
| Script falha (timeout/erro) | Log falha, admin vê no dashboard |
| Admin precisa atualizar | Formulário manual na tabela de matches |

---

## Schema do Banco

- **users**: id, username, password_hash, is_admin, created_at
- **app_config**: key, value (ex: football_data_api_key)
- **competitions**: id, name, status (active/archived)
- **matches**: id, competition_id, team_a, team_b, scheduled_time, result, external_id, last_synced
- **predictions**: id, user_id, match_id, prediction (team_a/team_b/draw), points (0/1)
- **sync_logs**: id, status (success/error), message, created_at
- **leagues**: id, name, owner_id, code (UUID), is_public
- **league_members**: id, league_id, user_id
- **global_rankings** (view): id, username, total_points, total_predictions, accuracy_rate, current_streak
- **league_rankings** (view): league_id, user, points, predictions, accuracy, streak

---

## Fases de Desenvolvimento

### Fase 1 — Setup & Banco de Dados
- [x] Criar projeto Vite + React
- [x] Configurar Supabase (org, projeto, env vars)
- [x] Schema SQL (tabelas + views)
- [x] Dados de teste (matches + predictions)

### Fase 2 — Autenticação & Profile
- [x] Login/Register com bcrypt + users table
- [x] Página /register (username 3+ chars, senha 6+ chars)
- [x] Página /login (persistência em localStorage)
- [x] ProtectedRoute (com requireAdmin)

### Fase 3 — Matches & Predictions
- [x] Listar matches futuros
- [x] Palpitar com bloqueio 5min antes da partida
- [x] CRUD de predictions (insert/update)
- [x] MatchCard component

### Fase 4 — Histórico de Palpites
- [x] Página /history
- [x] Filtro por data
- [x] Filtro por time/país (busca textual)
- [x] Exibir: palpite vs resultado vs pontos
- [x] Sumário: acertos, taxa, total

### Fase 5 — Ligas Privadas
- [x] Página /leagues
- [x] Criar liga (nome → gera UUID)
- [x] Entrar em liga por código
- [x] Listar ligas do usuário (owner + member)
- [x] Ranking por liga (view league_rankings)
- [x] Sair da liga / Excluir liga

### Fase 6 — Integração football-data.org
- [x] Script `scripts/sync.cjs` (Node.js)
- [x] Comando `npm run sync`
- [x] Tabela sync_logs para histórico
- [x] Tabela app_config para API key
- [x] Upsert por external_id (sem duplicar)
- [x] 104 matches da Copa 2026 sincronizados

### Fase 7 — Admin Panel
- [x] Dashboard com status da última sync
- [x] Botão de "Configurar API Key"
- [x] Histórico de logs (sync_logs)
- [x] Gerenciar resultados manualmente
- [x] Cálculo automático de pontos

### Fase 8 — Minhas Estatísticas
- [x] Página /stats
- [x] Cards: pontos, taxa, streak, total
- [x] Barra de acertos vs erros
- [x] Últimos palpites

### Fase 9 — Responsividade & Polish
- [ ] Tailwind mobile-first (já parcialmente responsivo)
- [ ] Dark mode (nice to have)
- [ ] Loading states consistentes

### Fase 10 — Deploy
- [ ] Vercel (frontend)
- [ ] Variáveis de ambiente
- [ ] Supabase já hospedado

---

## Status Atual

| Fase | Status |
|---|---|
| Fase 1: Setup & Banco | ✅ |
| Fase 2: Auth & Profile | ✅ |
| Fase 3: Matches & Predictions | ✅ |
| Fase 4: Histórico | ✅ |
| Fase 5: Ligas Privadas | ✅ |
| Fase 6: football-data.org | ✅ |
| Fase 7: Admin Panel | ✅ |
| Fase 8: Minhas Estatísticas | ✅ |
| Fase 9: Responsividade | ⏳ Pendente |
| Fase 10: Deploy | ⏳ Pendente |
