import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const cookieStore = await cookies()

    const authClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    const { data: authData } = await authClient.auth.getUser()
    const user = authData.user

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    await adminClient.from('audits').delete().eq('user_id', user.id)
    await adminClient.from('workflow_tasks').delete().eq('created_by_user_id', user.id)

    if (user.email) {
      await adminClient
        .from('audit_shares')
        .delete()
        .eq('shared_with_email', user.email.toLowerCase())
    }

    await adminClient.from('profiles').delete().eq('id', user.id)

    const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(user.id)
    if (deleteUserError) {
      return NextResponse.json({ error: deleteUserError.message || 'Failed to delete account' }, { status: 500 })
    }

    await authClient.auth.signOut()

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String((error as Error)?.message || 'Failed to delete account') }, { status: 500 })
  }
}
