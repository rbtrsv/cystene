'use client';

import { useSupabase } from '../SupabaseContext';
import { usePathname, useRouter } from 'next/navigation';

const LoginCheck = () => {
  const { user } = useSupabase();
  const router = useRouter();

  const handleLoginRedirect = () => {
    router.push('/login');
  };

  if (!user) {
    return (
      <div>
        <p>Please log in to view the dashboard.</p>
        <button onClick={handleLoginRedirect}>Login</button>
      </div>
    );
  }

  return <div>Welcome to the dashboard, {user.email}!</div>;
};

export default LoginCheck;
