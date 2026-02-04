DROP TRIGGER IF EXISTS trigger_set_updated_at ON alertes;
DROP TRIGGER IF EXISTS trigger_set_updated_at ON transhumances;
DROP TRIGGER IF EXISTS trigger_set_updated_at ON interventions;
DROP TRIGGER IF EXISTS trigger_set_updated_at ON mesures;
DROP TRIGGER IF EXISTS trigger_set_updated_at ON capteurs;
DROP TRIGGER IF EXISTS trigger_set_updated_at ON reines;
DROP TRIGGER IF EXISTS trigger_set_updated_at ON ruches;
DROP TRIGGER IF EXISTS trigger_set_updated_at ON ruchers;
DROP TRIGGER IF EXISTS trigger_set_updated_at ON offres;
DROP TRIGGER IF EXISTS trigger_set_updated_at ON invitations;
DROP TRIGGER IF EXISTS trigger_set_updated_at ON utilisateurs_entreprises;
DROP TRIGGER IF EXISTS trigger_set_updated_at ON entreprises;
DROP TRIGGER IF EXISTS trigger_set_updated_at ON utilisateurs;

DROP FUNCTION IF EXISTS set_updated_at();
