-- Enforce racle_id when isElevage is true (Hasura inserts bypass Django validators)
CREATE OR REPLACE FUNCTION check_reines_elevage_profile()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW."isElevage" IS TRUE THEN
        IF NEW.entreprise_id IS NULL THEN
            RAISE EXCEPTION 'Une reine en elevage doit etre liee a une entreprise.';
        END IF;
        IF NEW.racle_id IS NULL THEN
            RAISE EXCEPTION 'Une reine en elevage doit etre liee a une racle d''elevage.';
        END IF;
        IF NOT EXISTS (
            SELECT 1
            FROM entreprise_profiles ep
            WHERE ep.entreprise_id = NEW.entreprise_id
              AND ep."typeProfile" = 'EleveurDeReines'
        ) THEN
            RAISE EXCEPTION 'L''entreprise doit avoir le profil EleveurDeReines pour activer isElevage.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_reines_elevage_profile ON reines;
CREATE TRIGGER trigger_check_reines_elevage_profile
    BEFORE INSERT OR UPDATE OF "isElevage", entreprise_id, racle_id ON reines
    FOR EACH ROW
    EXECUTE FUNCTION check_reines_elevage_profile();
