-- Auto-update updated_at on row updates
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_updated_at ON utilisateurs;
CREATE TRIGGER trigger_set_updated_at
BEFORE UPDATE ON utilisateurs
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trigger_set_updated_at ON entreprises;
CREATE TRIGGER trigger_set_updated_at
BEFORE UPDATE ON entreprises
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trigger_set_updated_at ON utilisateurs_entreprises;
CREATE TRIGGER trigger_set_updated_at
BEFORE UPDATE ON utilisateurs_entreprises
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trigger_set_updated_at ON invitations;
CREATE TRIGGER trigger_set_updated_at
BEFORE UPDATE ON invitations
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trigger_set_updated_at ON offres;
CREATE TRIGGER trigger_set_updated_at
BEFORE UPDATE ON offres
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trigger_set_updated_at ON ruchers;
CREATE TRIGGER trigger_set_updated_at
BEFORE UPDATE ON ruchers
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trigger_set_updated_at ON ruches;
CREATE TRIGGER trigger_set_updated_at
BEFORE UPDATE ON ruches
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trigger_set_updated_at ON reines;
CREATE TRIGGER trigger_set_updated_at
BEFORE UPDATE ON reines
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trigger_set_updated_at ON capteurs;
CREATE TRIGGER trigger_set_updated_at
BEFORE UPDATE ON capteurs
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trigger_set_updated_at ON mesures;
CREATE TRIGGER trigger_set_updated_at
BEFORE UPDATE ON mesures
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trigger_set_updated_at ON interventions;
CREATE TRIGGER trigger_set_updated_at
BEFORE UPDATE ON interventions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trigger_set_updated_at ON transhumances;
CREATE TRIGGER trigger_set_updated_at
BEFORE UPDATE ON transhumances
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trigger_set_updated_at ON alertes;
CREATE TRIGGER trigger_set_updated_at
BEFORE UPDATE ON alertes
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
