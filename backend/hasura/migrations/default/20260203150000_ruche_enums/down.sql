ALTER TABLE ruches
    ALTER COLUMN statut TYPE text USING statut::text,
    ALTER COLUMN maladie TYPE text USING maladie::text,
    ALTER COLUMN type TYPE text USING type::text,
    ALTER COLUMN race TYPE text USING race::text;

ALTER TABLE reines
    ALTER COLUMN "codeCouleur" TYPE text USING "codeCouleur"::text,
    ALTER COLUMN lignee TYPE text USING lignee::text;

DROP TYPE IF EXISTS code_couleur_reine;
DROP TYPE IF EXISTS lignee_reine;
DROP TYPE IF EXISTS type_race_abeille;
DROP TYPE IF EXISTS type_ruche;
DROP TYPE IF EXISTS type_maladie;
DROP TYPE IF EXISTS statut_ruche;
