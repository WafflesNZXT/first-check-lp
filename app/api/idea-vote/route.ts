import { createClient } from '@supabase/supabase-js';

type VoteValue = 'up' | 'down';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function isValidVote(value: unknown): value is VoteValue {
  return value === 'up' || value === 'down';
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const ideaKey = typeof body?.ideaKey === 'string' ? body.ideaKey.trim() : '';
    const vote = body?.vote;
    const clientId = typeof body?.clientId === 'string' ? body.clientId.trim() : '';
    const context = typeof body?.context === 'string' ? body.context.trim() : 'homepage';

    if (!ideaKey || !clientId || !isValidVote(vote)) {
      return Response.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { error } = await supabase.from('idea_votes').insert({
      idea_key: ideaKey,
      vote,
      client_id: clientId,
      context,
    });

    if (error) {
      if (error.code === '23505') {
        return Response.json({ success: true, duplicate: true });
      }

      return Response.json({ error: 'Could not save vote' }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: 'Could not save vote' }, { status: 500 });
  }
}
