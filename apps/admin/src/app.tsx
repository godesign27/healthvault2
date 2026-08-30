import { canAccessProduct, canAccessProviderOperations } from './platform/auth/admin-access';
import { useAdminSession } from './platform/auth/use-admin-session';
import { parseAdminRoute } from './platform/product-registry/routes';
import { LoginForm } from './features/auth/login-form';
import { GptAppPage } from './features/gpt-app/gpt-app-page';
import { ProviderOperationsPage } from './features/providers/provider-operations-page';
import { AdminShell } from './layouts/admin-shell';
import { StatePanel } from './components/state-panel';
import { supabase } from './lib/supabase';

export default function App() {
  const sessionState = useAdminSession();

  if (sessionState.status === 'loading') {
    return <StatePanel title="Checking access" description="Verifying your Health Vault administrator session." />;
  }

  if (sessionState.status === 'signed_out') {
    return <StatePanel title="Health Vault Admin" description="Sign in with an approved administrator account." action={<LoginForm />} />;
  }

  if (sessionState.status === 'unauthorized') {
    return <StatePanel title="Admin access required" description={sessionState.error ?? 'This account does not have an active administrator role.'} action={<button type="button" onClick={() => void supabase.auth.signOut()}>Sign out</button>} />;
  }

  const parsedRoute = parseAdminRoute(window.location.pathname);
  const route = parsedRoute.kind === 'home'
    ? { kind: 'product' as const, productKey: 'gpt_app' as const, section: 'insights' }
    : parsedRoute;

  if (route.kind === 'product' && !canAccessProduct(sessionState.assignments, route.productKey)) {
    return <StatePanel title="Product access denied" description="Your administrator role does not include this product." />;
  }

  if (route.kind === 'providers' && !canAccessProviderOperations(sessionState.assignments)) {
    return <StatePanel title="Provider access denied" description="Your administrator role does not include Provider Operations." />;
  }

  if (route.kind === 'providers' && ['patient-access', 'mfa-recovery'].includes(route.section) && !sessionState.assignments.some((assignment) => assignment.roleKey === 'platform_owner')) {
    return <StatePanel title="Health Vault super-admin access required" description="Patient access intervention is reserved for the normalized platform owner role." />;
  }

  return (
    <AdminShell assignments={sessionState.assignments}>
      {route.kind === 'product' && route.productKey === 'gpt_app' && <GptAppPage section={route.section} />}
      {route.kind === 'product' && route.productKey === 'saas_cloud' && <StatePanel title="SaaS Cloud is reserved" description="This product boundary is ready, but its analytics module has not been configured." />}
      {route.kind === 'providers' && <ProviderOperationsPage section={route.section} isPlatformOwner={sessionState.assignments.some((assignment) => assignment.roleKey === 'platform_owner')} />}
    </AdminShell>
  );
}
