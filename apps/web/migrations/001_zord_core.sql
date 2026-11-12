-- Zord Web/Neon: primeira implantação, sem tabelas preexistentes.
-- A migração deve ser validada em branch temporária antes de sua aplicação à main.
CREATE TABLE zord_organizations (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name varchar(160) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE zord_users (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    organization_id integer NOT NULL REFERENCES zord_organizations(id),
    name varchar(160) NOT NULL,
    email varchar(254) NOT NULL,
    password_hash text NOT NULL,
    role varchar(16) NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    active boolean NOT NULL DEFAULT true,
    avatar_data bytea,
    avatar_mime varchar(16),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT zord_avatar_consistent CHECK (
        (avatar_data IS NULL AND avatar_mime IS NULL) OR
        (avatar_data IS NOT NULL AND avatar_mime IN ('image/png', 'image/jpeg', 'image/webp'))
    )
);

CREATE UNIQUE INDEX zord_users_email_unique ON zord_users (lower(email));
CREATE INDEX zord_users_organization_idx ON zord_users (organization_id, id);

CREATE TABLE zord_sessions (
    token_hash char(64) PRIMARY KEY,
    user_id integer NOT NULL REFERENCES zord_users(id) ON DELETE CASCADE,
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX zord_sessions_user_expiry_idx ON zord_sessions (user_id, expires_at);
CREATE INDEX zord_sessions_expiry_idx ON zord_sessions (expires_at);

CREATE TABLE zord_customers (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    organization_id integer NOT NULL REFERENCES zord_organizations(id),
    name varchar(160) NOT NULL,
    email varchar(254),
    phone varchar(32),
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX zord_customers_organization_list_idx ON zord_customers (organization_id, id DESC) WHERE active = true;

CREATE TABLE zord_login_attempts (
    key char(64) PRIMARY KEY,
    attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    window_started_at timestamptz NOT NULL DEFAULT now(),
    blocked_until timestamptz
);

CREATE INDEX zord_login_attempts_window_idx ON zord_login_attempts (window_started_at);
