ALTER TABLE ruches
ADD CONSTRAINT ruches_immatriculation_format_check
CHECK (immatriculation ~ '^A\d{7}$');
