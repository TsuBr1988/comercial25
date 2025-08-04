/*
  # Add unique constraint to system_configurations

  1. Changes
    - Add unique constraint on config_type column to support upsert operations
    - This allows ON CONFLICT (config_type) to work properly in upsert queries

  2. Security
    - No changes to existing RLS policies
*/

-- Add unique constraint for config_type to support upsert operations
ALTER TABLE public.system_configurations 
ADD CONSTRAINT IF NOT EXISTS unique_config_type UNIQUE (config_type);