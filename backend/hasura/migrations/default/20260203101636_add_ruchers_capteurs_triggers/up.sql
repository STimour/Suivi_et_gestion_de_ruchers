-- ====================
-- TRIGGER: Vérifier limite de RUCHERS
-- ====================

CREATE OR REPLACE FUNCTION check_ruchers_limit()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
    max_allowed INTEGER;
BEGIN
    -- Récupérer le nombre actuel de ruchers et la limite
    SELECT 
        COUNT(r.id),
        MAX(o."nbRuchersMax")
    INTO 
        current_count,
        max_allowed
    FROM ruchers r
    JOIN entreprises e ON r.entreprise_id = e.id
    LEFT JOIN offres o ON e.id = o.entreprise_id AND o.active = true
    WHERE r.entreprise_id = NEW.entreprise_id;
    
    -- Si pas de limite (NULL), autoriser
    IF max_allowed IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Si limite atteinte, rejeter
    IF current_count >= max_allowed THEN
        RAISE EXCEPTION 'Limite de ruchers atteinte pour cette offre (% / %)', current_count, max_allowed;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_ruchers_limit ON ruchers;
CREATE TRIGGER trigger_check_ruchers_limit
    BEFORE INSERT ON ruchers
    FOR EACH ROW
    EXECUTE FUNCTION check_ruchers_limit();

-- ====================
-- TRIGGER: Vérifier limite de CAPTEURS
-- ====================

CREATE OR REPLACE FUNCTION check_capteurs_limit()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
    max_allowed INTEGER;
    entreprise_id_var UUID;
BEGIN
    -- Récupérer l'entreprise_id via la ruche
    SELECT r.entreprise_id INTO entreprise_id_var
    FROM ruches ru
    JOIN ruchers r ON ru.rucher_id = r.id
    WHERE ru.id = NEW.ruche_id;
    
    -- Récupérer le nombre actuel de capteurs et la limite
    SELECT 
        COUNT(c.id),
        MAX(o."nbCapteursMax")
    INTO 
        current_count,
        max_allowed
    FROM capteurs c
    JOIN ruches ru ON c.ruche_id = ru.id
    JOIN ruchers r ON ru.rucher_id = r.id
    JOIN entreprises e ON r.entreprise_id = e.id
    LEFT JOIN offres o ON e.id = o.entreprise_id AND o.active = true
    WHERE r.entreprise_id = entreprise_id_var;
    
    -- Si pas de limite (NULL), autoriser
    IF max_allowed IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Si limite atteinte, rejeter
    IF current_count >= max_allowed THEN
        RAISE EXCEPTION 'Limite de capteurs atteinte pour cette offre (% / %)', current_count, max_allowed;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_capteurs_limit ON capteurs;
CREATE TRIGGER trigger_check_capteurs_limit
    BEFORE INSERT ON capteurs
    FOR EACH ROW
    EXECUTE FUNCTION check_capteurs_limit();
