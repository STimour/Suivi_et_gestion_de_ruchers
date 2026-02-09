ALTER TABLE ruches
DROP CONSTRAINT IF EXISTS ruches_immatriculation_format_check;

ALTER TABLE ruches
ADD CONSTRAINT ruches_immatriculation_format_check
CHECK (immatriculation ~ '^[A-Z]\d{7}$');
