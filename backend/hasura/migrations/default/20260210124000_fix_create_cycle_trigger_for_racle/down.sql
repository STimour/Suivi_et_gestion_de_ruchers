-- Revert to old trigger definition using reine_id
CREATE OR REPLACE FUNCTION create_cycle_elevage_for_reine()
RETURNS TRIGGER AS $$
DECLARE
    cycle_id UUID;
    base_date DATE;
BEGIN
    IF NEW."isElevage" IS TRUE THEN
        base_date := CURRENT_DATE;

        INSERT INTO cycles_elevage_reines (
            id,
            reine_id,
            "dateDebut",
            statut,
            created_at,
            updated_at
        )
        VALUES (
            gen_random_uuid(),
            NEW.id,
            base_date,
            'EnCours',
            NOW(),
            NOW()
        )
        RETURNING id INTO cycle_id;

        INSERT INTO taches_cycle_elevage (
            id,
            cycle_id,
            type,
            "jourTheorique",
            "datePrevue",
            statut,
            created_at,
            updated_at
        )
        VALUES
            (gen_random_uuid(), cycle_id, 'Greffage', 0, base_date + 0, 'AFaire', NOW(), NOW()),
            (gen_random_uuid(), cycle_id, 'Operculation', 6, base_date + 6, 'AFaire', NOW(), NOW()),
            (gen_random_uuid(), cycle_id, 'NaissanceReine', 12, base_date + 12, 'AFaire', NOW(), NOW()),
            (gen_random_uuid(), cycle_id, 'ControleVolFecondation', 16, base_date + 16, 'AFaire', NOW(), NOW()),
            (gen_random_uuid(), cycle_id, 'ValidationPonte', 21, base_date + 21, 'AFaire', NOW(), NOW()),
            (gen_random_uuid(), cycle_id, 'MarquageReine', 25, base_date + 25, 'AFaire', NOW(), NOW()),
            (gen_random_uuid(), cycle_id, 'MiseEnVente', 28, base_date + 28, 'AFaire', NOW(), NOW());
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_cycle_elevage_for_reine ON reines;
CREATE TRIGGER trigger_create_cycle_elevage_for_reine
    AFTER INSERT ON reines
    FOR EACH ROW
    EXECUTE FUNCTION create_cycle_elevage_for_reine();
