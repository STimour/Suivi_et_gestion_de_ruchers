DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'statut_ruche') THEN
        CREATE TYPE statut_ruche AS ENUM ('Active', 'Faible', 'Malade', 'Morte');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'type_maladie') THEN
        CREATE TYPE type_maladie AS ENUM (
            'Aucune',
            'Varroose',
            'Nosemose',
            'LoqueAmericaine',
            'LoqueEuropeenne',
            'Acarapisose',
            'Ascospherose',
            'Tropilaelaps',
            'VirusAilesDeformees',
            'ParalysieChronique',
            'IntoxicationPesticides'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'type_ruche') THEN
        CREATE TYPE type_ruche AS ENUM (
            'Dadant',
            'Langstroth',
            'Warre',
            'Voirnot',
            'KenyaTopBar',
            'Ruchette',
            'Nuclei'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'type_race_abeille') THEN
        CREATE TYPE type_race_abeille AS ENUM (
            'Buckfast',
            'Noire',
            'Carnica',
            'Ligustica',
            'Caucasica',
            'HybrideLocale',
            'Inconnue'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lignee_reine') THEN
        CREATE TYPE lignee_reine AS ENUM (
            'Buckfast',
            'Carnica',
            'Ligustica',
            'Caucasica',
            'Locale',
            'Inconnue'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'code_couleur_reine') THEN
        CREATE TYPE code_couleur_reine AS ENUM (
            'Blanc',
            'Jaune',
            'Rouge',
            'Vert',
            'Bleu'
        );
    END IF;
END$$;

DO $$
DECLARE idx record;
BEGIN
    FOR idx IN
        SELECT schemaname, indexname
        FROM pg_indexes
        WHERE tablename = 'ruches'
          AND indexdef LIKE '%varchar_pattern_ops%'
          AND (
              indexdef LIKE '%(statut)%'
              OR indexdef LIKE '%(maladie)%'
              OR indexdef LIKE '%(type)%'
              OR indexdef LIKE '%(race)%'
          )
    LOOP
        EXECUTE format('DROP INDEX IF EXISTS %I.%I', idx.schemaname, idx.indexname);
    END LOOP;

    FOR idx IN
        SELECT schemaname, indexname
        FROM pg_indexes
        WHERE tablename = 'reines'
          AND indexdef LIKE '%varchar_pattern_ops%'
          AND (
              indexdef LIKE '%(\"codeCouleur\")%'
              OR indexdef LIKE '%(lignee)%'
          )
    LOOP
        EXECUTE format('DROP INDEX IF EXISTS %I.%I', idx.schemaname, idx.indexname);
    END LOOP;
END$$;

ALTER TABLE ruches
    ALTER COLUMN statut TYPE statut_ruche USING statut::statut_ruche,
    ALTER COLUMN maladie TYPE type_maladie USING maladie::type_maladie,
    ALTER COLUMN type TYPE type_ruche USING type::type_ruche,
    ALTER COLUMN race TYPE type_race_abeille USING race::type_race_abeille;

ALTER TABLE reines
    ALTER COLUMN "codeCouleur" TYPE code_couleur_reine USING "codeCouleur"::code_couleur_reine,
    ALTER COLUMN lignee TYPE lignee_reine USING lignee::lignee_reine;
