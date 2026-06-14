-- Desabilita RLS em users tambem (auth custom, nao Supabase Auth)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
