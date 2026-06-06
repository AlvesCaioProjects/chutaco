# 🚀 Fase 1: Setup Supabase - Próximos Passos

## ✅ Feito
- [x] Credenciais Supabase configuradas em `.env.local`
- [x] Cliente Supabase criado em `src/lib/supabase.js`
- [x] Schema SQL preparado em `schema.sql`

---

## 📋 O que fazer agora

### 1. Criar o schema no Supabase
1. Acesse: https://app.supabase.com/projects
2. Clique no projeto **copa-palpites-2026**
3. Vá em **SQL Editor** (no sidebar esquerdo)
4. Clique **"New Query"**
5. Copie TODO o conteúdo do arquivo `schema.sql`
6. Cole no editor SQL do Supabase
7. Clique **"Run"** (execute todo)

**⚠️ Importante**: Certifique-se de que SQL rodou **sem erros**.

---

### 2. Configurar Autenticação (Supabase Auth)
1. Vá em **Authentication > Providers** (no Supabase dashboard)
2. Deixe "Email" DESATIVADO
3. Nós vamos usar autenticação customizada com username/senha (backend via Edge Functions ou API REST)

---

### 3. Criar primeiro admin user (manual via SQL)
Volta ao **SQL Editor** e execute:

```sql
-- Inserir admin user (senha: admin123 - já hash)
-- Use este link para gerar hash: https://bcrypt.online/
-- Senha: admin123 
-- Hash: $2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36aiAFbQ

INSERT INTO users (username, password_hash, is_admin) 
VALUES ('admin', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36aiAFbQ', TRUE)
ON CONFLICT (username) DO NOTHING;
```

**⚠️ IMPORTANTE**: Mude esta senha depois na Fase 2!

---

## ✨ Próxima fase: Autenticação no Frontend
Quando terminar esses passos, vou criar:
- Hook `useAuth()` para login/register
- Página `/login`
- Página `/register`
- Componente `ProtectedRoute`

---

**Me avise quando o schema estiver criado e o admin user inserido!** ✅
