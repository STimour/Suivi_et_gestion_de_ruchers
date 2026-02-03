-- Ensure UUID defaults are generated in the database for all models
-- This allows Hasura inserts without providing an explicit id.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE utilisateurs ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE entreprises ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE utilisateurs_entreprises ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE invitations ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE offres ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE ruchers ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE ruches ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE reines ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE capteurs ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE mesures ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE transhumances ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE alertes ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE interventions ALTER COLUMN id SET DEFAULT gen_random_uuid();
