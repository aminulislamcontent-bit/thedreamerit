import { csrfToken } from '@/lib/server/auth';

/** Hidden CSRF field for privileged server actions (double-submit cookie). */
export async function CsrfInput() {
  const token = await csrfToken();
  return <input type="hidden" name="_csrf" value={token} />;
}
