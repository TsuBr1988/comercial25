/*
  # Criar tabelas para turnos e cidades com ISS

  1. New Tables
    - `budget_turns`
      - `id` (uuid, primary key)
      - `name` (text) - Diurno ou Noturno
      - `is_active` (boolean)
      - `created_at` (timestamp)
    - `budget_cities`
      - `id` (uuid, primary key)  
      - `city_name` (text)
      - `iss_percent` (numeric) - Percentual do ISS
      - `created_at` (timestamp)

  2. Data
    - Inserir dados iniciais de turnos (Diurno, Noturno)
    - Inserir dados iniciais de cidades com ISS
*/

-- Criar tabela de turnos
CREATE TABLE IF NOT EXISTS budget_turns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de cidades com ISS
CREATE TABLE IF NOT EXISTS budget_cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_name text NOT NULL,
  iss_percent numeric(5,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Inserir turnos padrão
INSERT INTO budget_turns (name, is_active) VALUES 
('Diurno', true),
('Noturno', true)
ON CONFLICT DO NOTHING;

-- Inserir cidades com ISS (baseado na tabela padrão brasileira)
INSERT INTO budget_cities (city_name, iss_percent) VALUES 
('São Paulo - SP', 2.00),
('Guarulhos - SP', 5.00),
('Campinas - SP', 5.00),
('Piracicaba - SP', 5.00)  
('Americana - SP', 3.00)  
('Santa Bárbara DOeste - SP', 2.00)
('Sumaré - SP', 5.00)
('Hortolândia - SP', 2.00)
('Paulínia - SP', 5.00)
('São Carlos - SP', 2.00)
ON CONFLICT DO NOTHING;

-- Habilitar RLS
ALTER TABLE budget_turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_cities ENABLE ROW LEVEL SECURITY;

-- Criar políticas para acesso autenticado
CREATE POLICY "Users can view budget turns"
  ON budget_turns
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view budget cities"
  ON budget_cities
  FOR SELECT
  TO authenticated
  USING (true);