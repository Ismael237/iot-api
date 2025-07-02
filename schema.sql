-- SCHÉMA COMPLET IoT avec AUTOMATISATION (SIMPLIFIÉ)
-- ========================================================

-- 1. Enum pour les rôles utilisateur
CREATE TYPE user_role AS ENUM ('admin', 'user');

-- 2. Enum pour les types de dispositifs
CREATE TYPE device_type_enum AS ENUM (
  'arduino_uno', 'arduino_nano', 'esp32', 'esp8266', 
  'raspberry_pi', 'sensor_module', 'actuator_module', 'gateway'
);

-- 3. Table des utilisateurs
CREATE TABLE users (
  user_id          SERIAL PRIMARY KEY,
  email            VARCHAR(255) NOT NULL UNIQUE,
  password_hash    VARCHAR(255) NOT NULL,
  first_name       VARCHAR(100),
  last_name        VARCHAR(100),
  role             user_role NOT NULL DEFAULT 'user',
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  last_login       TIMESTAMPTZ,
  login_count      INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Appareils IoT (avec enum direct)
CREATE TABLE iot_devices (
  device_id        SERIAL PRIMARY KEY,
  identifier       VARCHAR(100) NOT NULL UNIQUE,
  device_type      device_type_enum NOT NULL,
  model            VARCHAR(50),
  metadata         JSONB,                -- ex. {"firmware":"1.2.3","tags":["poulailler","extérieur"]}
  ip_address       INET,
  port             INTEGER,
  active           BOOLEAN NOT NULL DEFAULT TRUE,
  last_seen        TIMESTAMPTZ,
  created_by       INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Catégories de composants
CREATE TYPE component_category AS ENUM ('sensor','actuator');

-- 6. Types de composants
CREATE TABLE component_types (
  component_type_id SERIAL PRIMARY KEY,
  name              VARCHAR(100) NOT NULL,
  identifier        VARCHAR(50) NOT NULL UNIQUE,
  category          component_category NOT NULL,
  unit              VARCHAR(20),
  description       TEXT,
  created_by        INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. État de connexion
CREATE TYPE conn_status AS ENUM ('unknown','online','offline','error');

-- 8. Déploiements de composants
CREATE TABLE component_deployments (
  deployment_id       SERIAL PRIMARY KEY,
  component_type_id   INTEGER NOT NULL
                        REFERENCES component_types(component_type_id)
                        ON UPDATE CASCADE ON DELETE RESTRICT,
  device_id           INTEGER NOT NULL
                        REFERENCES iot_devices(device_id)
                        ON UPDATE CASCADE ON DELETE CASCADE,
  active              BOOLEAN NOT NULL DEFAULT TRUE,
  last_interaction    TIMESTAMPTZ,
  connection_status   conn_status NOT NULL DEFAULT 'unknown',
  last_value          NUMERIC(10,2),      -- valeur du dernier relevé (pour capteur)
  last_value_ts       TIMESTAMPTZ,        -- timestamp du dernier relevé
  created_by          INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Connexions physiques des pins
CREATE TABLE component_pin_connections (
  pin_conn_id      SERIAL PRIMARY KEY,
  deployment_id    INTEGER NOT NULL REFERENCES component_deployments(deployment_id) ON DELETE CASCADE,
  pin_identifier   VARCHAR(20) NOT NULL,  -- ex. GPIO23, A0
  pin_function     VARCHAR(50) NOT NULL,  -- ex. data, power, ground
  UNIQUE(deployment_id, pin_identifier)
);

-- 11. Instances de zones
CREATE TABLE zones (
  zone_id        SERIAL PRIMARY KEY,
  parent_zone_id INTEGER REFERENCES zones(zone_id) ON DELETE SET NULL,
  name           VARCHAR(100) NOT NULL,
  description    TEXT,
  metadata       JSONB,                 -- ex. {"location":"Grange","floor":1}
  created_by     INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Assignation composants → zone
CREATE TABLE zone_component_deployments (
  zcd_id          SERIAL PRIMARY KEY,
  zone_id         INTEGER NOT NULL
                    REFERENCES zones(zone_id)
                    ON DELETE CASCADE,
  deployment_id   INTEGER NOT NULL
                    REFERENCES component_deployments(deployment_id)
                    ON DELETE CASCADE,
  assigned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by     INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
  UNIQUE(zone_id, deployment_id)
);

-- 13. Relevés de capteurs
CREATE TABLE sensor_readings (
  reading_id      BIGSERIAL PRIMARY KEY,
  deployment_id   INTEGER NOT NULL
                    REFERENCES component_deployments(deployment_id)
                    ON DELETE CASCADE,
  value           NUMERIC(10,2) NOT NULL,
  unit            VARCHAR(20),
  timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Journaux de commandes
CREATE TABLE actuator_commands (
  command_id      BIGSERIAL PRIMARY KEY,
  deployment_id   INTEGER NOT NULL
                    REFERENCES component_deployments(deployment_id)
                    ON DELETE CASCADE,
  command         VARCHAR(100) NOT NULL,
  parameters      JSONB,
  issued_by       INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
  timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Refresh tokens actifs
CREATE TABLE refresh_tokens (
  token_id       SERIAL PRIMARY KEY,
  user_id        INTEGER NOT NULL
                   REFERENCES users(user_id)
                   ON DELETE CASCADE,
  token_hash     VARCHAR(255) NOT NULL UNIQUE,    -- hash du refresh token
  device_info    VARCHAR(255),                    -- info appareil/navigateur
  ip_address     INET,
  expires_at     TIMESTAMPTZ NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at   TIMESTAMPTZ
);

-- 16. Blacklist des tokens révoqués
CREATE TABLE token_blacklist (
  blacklist_id   SERIAL PRIMARY KEY,
  token_jti      VARCHAR(255) NOT NULL UNIQUE,    -- JWT ID du token
  token_type     VARCHAR(20) NOT NULL,            -- 'access' ou 'refresh'
  user_id        INTEGER NOT NULL
                   REFERENCES users(user_id)
                   ON DELETE CASCADE,
  expires_at     TIMESTAMPTZ NOT NULL,            -- quand le token expire naturellement
  revoked_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_by     INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
  reason         VARCHAR(100)                     -- 'logout', 'admin_revoke', 'security_breach'
);

-- ==========================================
-- TABLES D'AUTOMATISATION
-- ==========================================

-- 17. Types d'opérateurs pour les conditions
CREATE TYPE comparison_operator AS ENUM ('>', '<', '>=', '<=', '=', '!=');

-- 18. Types d'actions possibles
CREATE TYPE automation_action_type AS ENUM ('create_alert', 'trigger_actuator');

-- 19. Table des alertes
CREATE TABLE alerts (
  alert_id       SERIAL PRIMARY KEY,
  title          VARCHAR(200) NOT NULL,
  message        TEXT,
  severity       VARCHAR(20) NOT NULL DEFAULT 'info', -- 'info', 'warning', 'error', 'critical'
  created_by     INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. Table des règles d'automatisation
CREATE TABLE automation_rules (
  rule_id              SERIAL PRIMARY KEY,
  name                 VARCHAR(200) NOT NULL,
  description          TEXT,
  
  -- Condition (capteur)
  sensor_deployment_id INTEGER NOT NULL REFERENCES component_deployments(deployment_id) ON DELETE CASCADE,
  operator             comparison_operator NOT NULL,
  threshold_value      NUMERIC(10,2) NOT NULL,
  
  -- Action
  action_type          automation_action_type NOT NULL,
  
  -- Si action = create_alert
  alert_title          VARCHAR(200),
  alert_message        TEXT,
  alert_severity       VARCHAR(20) DEFAULT 'warning',
  
  -- Si action = trigger_actuator
  target_deployment_id INTEGER REFERENCES component_deployments(deployment_id) ON DELETE CASCADE,
  actuator_command     VARCHAR(100),
  actuator_parameters  JSONB,
  
  -- Gestion de la règle
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  cooldown_minutes     INTEGER NOT NULL DEFAULT 5, -- délai minimum entre déclenchements
  last_triggered_at    TIMESTAMPTZ,
  
  -- Métadonnées
  created_by           INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Contraintes de cohérence
  CONSTRAINT check_alert_fields 
    CHECK (action_type != 'create_alert' OR (alert_title IS NOT NULL)),
  CONSTRAINT check_actuator_fields 
    CHECK (action_type != 'trigger_actuator' OR (target_deployment_id IS NOT NULL AND actuator_command IS NOT NULL))
);

-- ==========================================
-- INDEX POUR PERFORMANCE
-- ==========================================

-- Index optimisés pour la nouvelle structure
CREATE INDEX ON users(email);
CREATE INDEX ON users(role);
CREATE INDEX ON iot_devices(device_type);
CREATE INDEX ON iot_devices(created_by);
CREATE INDEX ON component_types(created_by);
CREATE INDEX ON component_deployments(component_type_id);
CREATE INDEX ON component_deployments(device_id);
CREATE INDEX ON component_deployments(created_by);
CREATE INDEX ON zones(created_by);
CREATE INDEX ON sensor_readings(deployment_id, timestamp DESC);
CREATE INDEX ON actuator_commands(deployment_id, timestamp DESC);
CREATE INDEX ON actuator_commands(issued_by);
CREATE INDEX ON refresh_tokens(user_id);
CREATE INDEX ON refresh_tokens(token_hash);
CREATE INDEX ON refresh_tokens(expires_at);
CREATE INDEX ON token_blacklist(token_jti);
CREATE INDEX ON token_blacklist(user_id);
CREATE INDEX ON token_blacklist(expires_at);

-- Index pour l'automatisation
CREATE INDEX ON automation_rules(sensor_deployment_id) WHERE is_active = true;
CREATE INDEX ON automation_rules(is_active, last_triggered_at);
CREATE INDEX ON automation_rules(created_by);
CREATE INDEX ON alerts(created_by, created_at DESC);
CREATE INDEX ON alerts(severity, created_at DESC);

-- ==========================================
-- TRIGGER POUR UPDATED_AT
-- ==========================================

CREATE OR REPLACE FUNCTION set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t RECORD;
BEGIN
  FOR t IN
    SELECT table_name
    FROM information_schema.columns
    WHERE column_name = 'updated_at'
      AND table_schema = 'public'
  LOOP
    EXECUTE format($fmt$
      CREATE TRIGGER trg_%s_updated
      BEFORE UPDATE ON %I
      FOR EACH ROW EXECUTE FUNCTION set_timestamp();
    $fmt$, t.table_name, t.table_name);
  END LOOP;
END;
$$;

-- ==========================================
-- DONNÉES INITIALES
-- ==========================================

-- Création d'un utilisateur admin par défaut
INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
VALUES ('admin@example.com', '$2b$12$placeholder_hash', 'Admin', 'User', 'admin', true);