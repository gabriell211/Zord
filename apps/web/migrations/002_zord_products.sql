-- Produtos nativos Zord; aplicar depois de 001_zord_core.sql.
CREATE TABLE zord_products (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    organization_id integer NOT NULL REFERENCES zord_organizations(id),
    sku varchar(64),
    name varchar(160) NOT NULL,
    price_cents integer NOT NULL DEFAULT 0 CHECK (price_cents BETWEEN 0 AND 99999999),
    quantity integer NOT NULL DEFAULT 0 CHECK (quantity BETWEEN 0 AND 1000000),
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX zord_products_org_list_idx ON zord_products (organization_id, id DESC) WHERE active = true;
CREATE UNIQUE INDEX zord_products_org_sku_unique ON zord_products (organization_id, lower(sku)) WHERE active = true AND sku IS NOT NULL;
