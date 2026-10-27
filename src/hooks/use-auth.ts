// Hook to fetch current authenticated user (client-side)
import { useEffect, useState } from 'react';

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  roles: string[];
  employee?: {
    id: string;
    employeeCode: string;
    designation: string;
    department: string;
    branchId?: string | null;
  } | null;
} | null;

let cachedUser: CurrentUser = null;
let fetchPromise: Promise<CurrentUser> | null = null;

export async function fetchCurrentUser(force = false): Promise<CurrentUser> {
  if (cachedUser && !force) return cachedUser;
  if (fetchPromise && !force) return fetchPromise;

  fetchPromise = fetch('/api/auth', { credentials: 'include' })
    .then((r) => r.json())
    .then((json) => {
      cachedUser = json.data?.user || json.user || null;
      fetchPromise = null;
      return cachedUser;
    })
    .catch(() => {
      fetchPromise = null;
      cachedUser = null;
      return null;
    });

  return fetchPromise;
}

export function useAuth() {
  const [user, setUser] = useState<CurrentUser>(cachedUser);
  const [loading, setLoading] = useState(!cachedUser);

  useEffect(() => {
    fetchCurrentUser().then((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  return { user, loading, refresh: () => fetchCurrentUser(true).then(setUser) };
}

export function clearCachedUser() {
  cachedUser = null;
}
