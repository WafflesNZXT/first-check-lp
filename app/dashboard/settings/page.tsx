
import { cookies } from 'next/headers'
import { getUserFromCookie } from '@/lib/auth'
import { getServerSupabase } from '@/utils/supabase/server'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const supabase = await getServerSupabase()

  let currentUser = getUserFromCookie(cookieStore);
  if (!currentUser) {
    const { data } = await supabase.auth.getUser();
    currentUser = data.user ? { id: data.user.id, email: data.user.email ?? null } : null;
  }
  if (!currentUser) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan_type,audit_count,max_audits,stripe_customer_id,subscription_id')
    .eq('id', currentUser.id)
    .maybeSingle();

  return (
    <SettingsClient
      email={currentUser.email ?? ''}
      initialBilling={{
        planType: profile?.plan_type ?? 'free',
        auditCount: Number(profile?.audit_count ?? 0),
        maxAudits: Number(profile?.max_audits ?? 2),
        hasStripeCustomer: Boolean(profile?.stripe_customer_id),
        hasSubscription: Boolean(profile?.subscription_id),
      }}
    />
  );
}
