-- ========================================================
-- 002_active_surebets.sql
-- Fase 8: Gerenciador de Surebets Manuais
-- Execute este script no Supabase SQL Editor
-- ========================================================

-- 1. Criar a tabela surebets_history (caso não exista)
CREATE TABLE IF NOT EXISTS public.surebets_history (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_name    text NOT NULL,
  sport         text NOT NULL DEFAULT '',
  league        text NOT NULL DEFAULT '',
  profit_margin numeric NOT NULL DEFAULT 0,
  total_stake   numeric NOT NULL DEFAULT 0,
  event_date    timestamptz NOT NULL,
  legs          jsonb NOT NULL DEFAULT '[]',
  status        text NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'settled', 'void')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- 2. Índices para performance nas queries do usuário
CREATE INDEX IF NOT EXISTS surebets_history_user_id_idx
  ON public.surebets_history (user_id);

CREATE INDEX IF NOT EXISTS surebets_history_status_idx
  ON public.surebets_history (status);

-- 3. Habilitar Row Level Security (RLS)
ALTER TABLE public.surebets_history ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS — cada usuário só vê e edita seus próprios dados
DROP POLICY IF EXISTS "Users can view their own surebets" ON public.surebets_history;
CREATE POLICY "Users can view their own surebets"
  ON public.surebets_history FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own surebets" ON public.surebets_history;
CREATE POLICY "Users can insert their own surebets"
  ON public.surebets_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own surebets" ON public.surebets_history;
CREATE POLICY "Users can update their own surebets"
  ON public.surebets_history FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own surebets" ON public.surebets_history;
CREATE POLICY "Users can delete their own surebets"
  ON public.surebets_history FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Trigger para atualizar `updated_at` automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_surebets_history_updated_at ON public.surebets_history;
CREATE TRIGGER set_surebets_history_updated_at
  BEFORE UPDATE ON public.surebets_history
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================================
-- Estrutura esperada do JSONB "legs" (para referência):
-- [
--   {
--     "leg_id":       "uuid-string",
--     "bookmaker_id": "uuid-da-conta-em-bookmaker_accounts",
--     "market_name":  "Over 2.5 / ML Home / etc",
--     "odds":         2.05,
--     "stake":        500.00,
--     "status":       "pending" | "won" | "lost" | "void"
--   }
-- ]
-- ========================================================
