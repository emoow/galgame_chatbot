'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { handleSignIn, handleSignOut} from '../../lib/auth';

export async function saveUser(user: unknown) {

  const res = await fetch('/api/save-user', {
    method: 'POST',
    body: JSON.stringify(user),
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Save user failed: ${res.status}`);
  }

  return await res.json();
}

export default function LoginPage() {
  const { data: session } = useSession();

    useEffect(() => {
    if (session?.user?.email) {
        // 登录后，把用户信息写入 user_database
        console.log('User session:', session);
        (async () => {
        try {
            const result = await saveUser(session.user);
            console.log('saveUser result:', result);
        } catch (error) {
            console.error('Error saving user:', error);
        }
        })();
    }
    }, [session]);

  return (

    <main className="flex items-center justify-center min-h-screen bg-gray-100">
      {session ? (
        <div>
          <h2 className="text-lg font-medium text-gray-700">
            Welcome, {session.user?.name}!
          </h2>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 mt-4 text-white bg-red-500 rounded-lg hover:bg-red-600"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <button
          onClick={handleSignIn}
          className="px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Sign in with Google
        </button>
      )}
    </main>
  );
}