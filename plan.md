# Copa 2026 Palpites — Plano de Arquitetura & Desenvolvimento

## Stack Final
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions + Realtime)
- **API Externa**: football-data.org (plano free)
- **Banco**: PostgreSQL (Supabase-hosted)
- **Deploy**: Vercel (frontend) + Supabase (backend/DB)
- **Auth**: Supabase Auth (username/password local)

---

## Arquitetura Proposta

```
┌─────────────────────────────────────────────────────┐
│ FRONTEND (React + Vite)                             │
│ - Autenticação (Supabase Auth)                       │
│ - Dashboard (Ranking + Palpites)                     │
│ - Histórico filtrado (jogo/rodada/país)              │
│ - Ligas privadas (CRUD + compartilhamento)           │
│ - Admin Panel (Sync status + manual update)          │
└──────────────┬──────────────────────────────────────┘
               │
┌──────────────┴──────────────────────────────────────┐
│ SUPABASE (Backend + Database)                       │
│ - PostgreSQL (Users, Matches, Predictions, Leagues) │
│ - Realtime subscriptions (ranking updates)          │
│ - RLS (Row Level Security) — autorização            │
│ - Edge Functions (sync trigger + scoring logic)     │
│ - Auth integration (JWT local)                      │
└──────────────┬──────────────────────────────────────┘
               │
┌──────────────┴──────────────────────────────────────┐
│ EXTERNAL: football-data.org API                     │
│ - Fetch matches, results, schedule                  │
│ - Trigger via Edge Function (cron-like)             │
└─────────────────────────────────────────────────────┘
```

---

## Tolerância a Falhas (API)

- Sincronização automática a cada 30-60min da football-data.org
- Se falhar 3x consecutivas → ativa modo "admin atualiza manual" (dashboard simples)
- Nada se deleta → apenas archival lógico (competitions.status = 'archived')
- Notificações in-app: estruturar banco para permitir depois (não bloquear v1)

### Matriz de Falhas

| Cenário | Ação |
|---|---|
| API retorna sucesso | Salvar em matches, log "OK" |
| API falha (timeout/erro) | Log falha + retry em 15min |
| 3 falhas seguidas | Ativar flag `manual_sync_needed` em DB |
| Admin vê flag | Dashboard avisa "Sync falhou, atualizar manual?" |
| Admin clica "Atualizar" | Modal com form: seleciona match + resultado |
| Admin submete | Salva em DB, limpa flag, calcula pontos automático |
| Pós-Copa | Manter tudo, apenas competitions.status = 'archived' |

---

## Schema do Banco

- **users**: id, username, password_hash, created_at
- **competitions**: id, name, status (active/archived)
- **matches**: id, competition_id, team_a, team_b, scheduled_time, result, sync_status
- **predictions**: id, user_id, match_id, prediction (team_a/team_b/draw), points, created_at
- **leagues**: id, name, owner_id, code, created_at
- **league_members**: id, league_id, user_id
- **league_rankings**: id, league_id, user_id, points, rank (view materializada)

---

## Fases de Desenvolvimento

### Fase 1 — Setup & Banco de Dados
- [x] Criar projeto Vite + React
- [x] Configurar Supabase (org, projeto, env vars)
- [x] Schema SQL (tabelas + RLS)
- [x] Edge Function para sync automático

### Fase 2 — Autenticação & Profile
- [x] Supabase Auth (username/password local)
- [x] Página /auth/register (username 3+ chars, senha 6+ chars)
- [x] Página /auth/login (persistência token + sessão)
- [x] ProtectedRoute

### Fase 3 — Matches & Predictions
- [x] Listar matches do dia
- [x] Palpitar com bloqueio 5min antes da partida
- [x] Salvar prediction em DB
- [x] Realtime subscriptions

### Fase 4 — Histórico de Palpites
- [ ] Dashboard ranking global
- [ ] Histórico filtrado (rodada/jogo/país)
- [ ] View materializada para ranking

### Fase 5 — Ligas Privadas
- [ ] Criar liga (gera código UUID)
- [ ] Entrar em liga com código
- [ ] Ranking por liga
- [ ] Sair da liga

### Fase 6 — Integração football-data.org
- [ ] Edge Function cron (30min durante Copa, 2x/dia fora)
- [ ] Fetch matches + resultados
- [ ] Log de sincronização (sync_logs)
- [ ] Flag manual_sync_needed em falhas

### Fase 7 — Admin Panel
- [ ] Dashboard status da API
- [ ] Formulário de update manual
- [ ] Histórico de sync (sucesso/falha)

### Fase 8 — Responsividade & Polish
- [ ] Tailwind mobile-first
- [ ] Componentes: MatchCard, Ranking table, Buttons
- [ ] Dark mode (nice to have)

### Fase 9 — Deploy
- [ ] Vercel (frontend)
- [ ] Variáveis de ambiente (.env.local)
- [ ] Supabase já hospedado

---

## Verificação (Testes Manuais)

```bash
# 1. Register 2 users
# 2. Create match (manual ou via sync)
# 3. User A predicts "team_a wins"
# 4. Atualizar resultado (manual ou API)
# 5. Verificar: User A ganhou +1 ponto
# 6. User A vê em histórico

# Ligas privadas
# 1. User A cria liga "Amigos"
# 2. User A compartilha código
# 3. User B entra
# 4. Ranking de liga = apenas A e B
# 5. Leave liga = remove de league_members

# Admin sync
# 1. Force erro na API (mock)
# 2. Verificar: 3 tentativas, depois flag ativa
# 3. Admin atualiza manual
# 4. Verificar: Pontos recalculados
```

---

## Status Atual

| Fase | Status |
|---|---|
| Fase 1: Setup & Banco | ✅ |
| Fase 2: Auth & Profile | ✅ |
| Fase 3: Matches & Predictions | ✅ |
| Fase 4: Histórico | ⏳ Pendente |
| Fase 5: Ligas Privadas | ⏳ Pendente |
| Fase 6: football-data.org | ⏳ Pendente |
| Fase 7: Admin Panel | ⏳ Pendente |
| Fase 8: Responsividade | ⏳ Pendente |
| Fase 9: Deploy | ⏳ Pendente |
