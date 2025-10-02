/*
  # Adicionar novos tipos de usuário e localidade de trabalho

  1. Mudanças no Enum
    - Adicionar novos valores ao enum UserRole:
      - ORGANIZER (Organizador)
      - CHECKIN_COORDINATOR (Coordenador de Check-in)
      - Manter ADMIN, USER, TEACHER

  2. Nova Tabela
    - `workplaces` (localidades de trabalho)
      - `id` (uuid, primary key)
      - `name` (text, nome da localidade)
      - `description` (text, descrição opcional)
      - `city` (text, cidade)
      - `state` (text, estado)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  3. Alteração na Tabela Users
    - Adicionar `workplace_id` (uuid, nullable, foreign key)

  4. Segurança
    - Indexes para otimização de consultas
*/

-- Adicionar novos valores ao enum UserRole
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'ORGANIZER';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'CHECKIN_COORDINATOR';

-- Criar tabela de localidades de trabalho
CREATE TABLE IF NOT EXISTS workplaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  city text NOT NULL,
  state text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Adicionar índices para workplaces
CREATE INDEX IF NOT EXISTS idx_workplaces_name ON workplaces(name);
CREATE INDEX IF NOT EXISTS idx_workplaces_city ON workplaces(city);
CREATE INDEX IF NOT EXISTS idx_workplaces_state ON workplaces(state);

-- Adicionar coluna workplace_id na tabela users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'workplace_id'
  ) THEN
    ALTER TABLE users ADD COLUMN workplace_id uuid REFERENCES workplaces(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Criar índice para workplace_id em users
CREATE INDEX IF NOT EXISTS idx_users_workplace_id ON users(workplace_id);
