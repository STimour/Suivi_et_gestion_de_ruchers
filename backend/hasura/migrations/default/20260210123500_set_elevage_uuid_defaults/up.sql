CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE racles_elevage ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE cycles_elevage_reines ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE taches_cycle_elevage ALTER COLUMN id SET DEFAULT gen_random_uuid();
