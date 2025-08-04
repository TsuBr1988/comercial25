@@ .. @@
 CREATE TABLE IF NOT EXISTS system_configurations (
   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
   config_type text NOT NULL,
   config_data jsonb NOT NULL,
   created_at timestamptz DEFAULT now(),
   updated_at timestamptz DEFAULT now()
 );
 
+-- Add unique constraint for config_type to support upsert operations
+ALTER TABLE system_configurations 
+ADD CONSTRAINT IF NOT EXISTS unique_config_type UNIQUE (config_type);
+
 ALTER TABLE system_configurations ENABLE ROW LEVEL SECURITY;