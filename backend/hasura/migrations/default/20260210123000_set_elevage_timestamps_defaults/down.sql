ALTER TABLE racles_elevage
  ALTER COLUMN created_at DROP DEFAULT,
  ALTER COLUMN updated_at DROP DEFAULT;

ALTER TABLE cycles_elevage_reines
  ALTER COLUMN created_at DROP DEFAULT,
  ALTER COLUMN updated_at DROP DEFAULT;

ALTER TABLE taches_cycle_elevage
  ALTER COLUMN created_at DROP DEFAULT,
  ALTER COLUMN updated_at DROP DEFAULT;
