/*
  Admin platform foundation.

  Establishes fail-closed, product-scoped administrator assignments. This
  migration contains no analytics or patient data and grants no admin role by
  default. Initial platform owners must be assigned through an approved
  service-role workflow.
*/

CREATE TABLE IF NOT EXISTS admin_products (
  product_key text PRIMARY KEY CHECK (product_key IN ('gpt_app', 'saas_cloud')),
  display_name text NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'reserved', 'disabled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO admin_products (product_key, display_name, status)
VALUES
  ('gpt_app', 'GPT App', 'active'),
  ('saas_cloud', 'SaaS Cloud', 'reserved')
ON CONFLICT (product_key) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  status = EXCLUDED.status,
  updated_at = now();

CREATE TABLE IF NOT EXISTS admin_role_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  principal_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_key text REFERENCES admin_products(product_key),
  role_key text NOT NULL CHECK (role_key IN ('platform_owner', 'product', 'security_privacy', 'support')),
  permissions text[] NOT NULL DEFAULT '{}',
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_by uuid REFERENCES auth.users(id),
  revoked_at timestamptz,
  CONSTRAINT admin_role_scope_check CHECK (
    (role_key = 'platform_owner' AND product_key IS NULL)
    OR (role_key <> 'platform_owner' AND product_key IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_role_assignments_active_scope
  ON admin_role_assignments (principal_id, COALESCE(product_key, '__global__'), role_key)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_admin_role_assignments_principal
  ON admin_role_assignments (principal_id)
  WHERE revoked_at IS NULL;

ALTER TABLE admin_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_role_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read admin product registry" ON admin_products;
CREATE POLICY "Authenticated users can read admin product registry"
  ON admin_products FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Principals can read own active admin assignments" ON admin_role_assignments;
CREATE POLICY "Principals can read own active admin assignments"
  ON admin_role_assignments FOR SELECT TO authenticated
  USING (principal_id = (SELECT auth.uid()) AND revoked_at IS NULL);

REVOKE INSERT, UPDATE, DELETE ON admin_products FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON admin_role_assignments FROM anon, authenticated;

COMMENT ON TABLE admin_role_assignments IS
  'Product-scoped admin authorization. Mutations require an approved server-side service-role workflow.';
