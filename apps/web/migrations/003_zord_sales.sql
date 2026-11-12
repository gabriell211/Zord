-- Zord Web: pedidos comerciais nativos, sem emissao fiscal.
-- Aplicar apos 001_zord_core.sql e 002_zord_products.sql.
-- FKs compostas impedem referencia cruzada entre empresas.
CREATE UNIQUE INDEX zord_customers_org_id_key ON zord_customers (organization_id, id);
CREATE UNIQUE INDEX zord_products_org_id_key ON zord_products (organization_id, id);
CREATE UNIQUE INDEX zord_users_org_id_key ON zord_users (organization_id, id);

CREATE TABLE zord_sales (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    organization_id integer NOT NULL REFERENCES zord_organizations(id),
    customer_id integer NOT NULL,
    created_by integer NOT NULL,
    idempotency_key uuid NOT NULL,
    request_fingerprint char(64) NOT NULL,
    status varchar(16) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'confirmed')),
    total_cents bigint NOT NULL CHECK (total_cents >= 0 AND total_cents <= 2000000000000),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    confirmed_at timestamptz,
    UNIQUE (organization_id, id),
    UNIQUE (organization_id, idempotency_key),
    FOREIGN KEY (organization_id, customer_id)
        REFERENCES zord_customers (organization_id, id),
    FOREIGN KEY (organization_id, created_by)
        REFERENCES zord_users (organization_id, id),
    CONSTRAINT zord_sales_status_date_check CHECK (
        (status = 'draft' AND confirmed_at IS NULL) OR
        (status = 'confirmed' AND confirmed_at IS NOT NULL)
    )
);

CREATE INDEX zord_sales_org_created_idx
    ON zord_sales (organization_id, id DESC);
CREATE INDEX zord_sales_org_status_idx
    ON zord_sales (organization_id, status, id DESC);

CREATE TABLE zord_sale_items (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    organization_id integer NOT NULL,
    sale_id integer NOT NULL,
    product_id integer NOT NULL,
    product_name varchar(160) NOT NULL,
    sku varchar(64),
    quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 1000),
    unit_price_cents integer NOT NULL
        CHECK (unit_price_cents BETWEEN 0 AND 99999999),
    line_total_cents bigint GENERATED ALWAYS AS
        (quantity::bigint * unit_price_cents::bigint) STORED,
    UNIQUE (sale_id, product_id),
    FOREIGN KEY (organization_id, sale_id)
        REFERENCES zord_sales (organization_id, id) ON DELETE RESTRICT,
    FOREIGN KEY (organization_id, product_id)
        REFERENCES zord_products (organization_id, id) ON DELETE RESTRICT
);

CREATE INDEX zord_sale_items_sale_idx
    ON zord_sale_items (organization_id, sale_id, id);
