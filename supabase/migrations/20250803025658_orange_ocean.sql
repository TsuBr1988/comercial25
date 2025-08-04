/*
  # Fix Budget Tables Schema

  1. New Columns
    - `budget_posts.city_id` (uuid, foreign key to budget_iss_rates)
    - `budget_iss_rates.iss_rate` (numeric, if not exists)

  2. Security
    - Enable RLS on budget_posts if not already enabled
    - Add basic policies for authenticated users

  3. Indexes
    - Add index for city_id in budget_posts for better performance
*/

-- 1. Ensure budget_iss_rates table exists with proper structure
CREATE TABLE IF NOT EXISTS public.budget_iss_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_name text NOT NULL,
  iss_rate numeric NOT NULL DEFAULT 5.0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 2. Add iss_rate column if it doesn't exist
ALTER TABLE public.budget_iss_rates
ADD COLUMN IF NOT EXISTS iss_rate numeric DEFAULT 5.0;

-- 3. Add city_id column to budget_posts
ALTER TABLE public.budget_posts
ADD COLUMN IF NOT EXISTS city_id uuid REFERENCES public.budget_iss_rates(id) ON DELETE SET NULL;

-- 4. Enable RLS on budget_posts
ALTER TABLE public.budget_posts ENABLE ROW LEVEL SECURITY;

-- 5. Add policies for budget_posts
CREATE POLICY IF NOT EXISTS "Users can view budget posts"
  ON public.budget_posts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Users can insert budget posts"
  ON public.budget_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Users can update budget posts"
  ON public.budget_posts
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Users can delete budget posts"
  ON public.budget_posts
  FOR DELETE
  TO authenticated
  USING (true);

-- 6. Add policies for budget_iss_rates
ALTER TABLE public.budget_iss_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view budget iss rates"
  ON public.budget_iss_rates
  FOR SELECT
  TO authenticated
  USING (true);

-- 7. Add index for performance
CREATE INDEX IF NOT EXISTS idx_budget_posts_city_id
  ON public.budget_posts(city_id);

-- 8. Insert sample cities if table is empty
INSERT INTO public.budget_iss_rates (city_name, iss_rate, is_active)
SELECT city_name, iss_rate, is_active
FROM (VALUES
  ('São Paulo', 5.0, true),
  ('Rio de Janeiro', 5.0, true),
  ('Belo Horizonte', 5.0, true),
  ('Brasília', 5.0, true),
  ('Salvador', 5.0, true),
  ('Curitiba', 5.0, true),
  ('Porto Alegre', 2.5, true),
  ('Recife', 5.0, true),
  ('Fortaleza', 5.0, true),
  ('Goiânia', 5.0, true),
  ('Manaus', 4.5, true),
  ('Belém', 4.0, true),
  ('Campo Grande', 3.5, true),
  ('João Pessoa', 3.0, true),
  ('Natal', 4.0, true),
  ('Maceió', 3.5, true),
  ('Aracaju', 3.0, true),
  ('Florianópolis', 4.5, true),
  ('Vitória', 4.0, true),
  ('Teresina', 3.0, true)
) AS v(city_name, iss_rate, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.budget_iss_rates);