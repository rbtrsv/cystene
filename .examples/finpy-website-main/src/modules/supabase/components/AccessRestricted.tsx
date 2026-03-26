import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import logoFinpyDark from '@/images/logos/finpy.svg';
import logoFinpyWhite from '@/images/logos/finpy_white.svg';

function AccessRestricted() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setError(error.message);
  };

  return (
    <div className='flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8'>
      <div className='sm:mx-auto sm:w-full sm:max-w-md'>
        <div className='flex justify-center pr-4'>
          <Image
            src={logoFinpyDark}
            alt='logo'
            width={150}
            height={100}
            className='block cursor-pointer dark:hidden'
            priority
          />
          <Image
            src={logoFinpyWhite}
            alt='logo'
            width={150}
            height={100}
            className='hidden cursor-pointer dark:block'
            priority
          />
        </div>

        <h2 className='mt-16 text-center text-2xl leading-9 font-semibold tracking-tight text-black dark:text-white'>
          Access Restricted
        </h2>

        <div className='mt-12 rounded-lg border border-gray-200 bg-white p-6 shadow-2xl'>
          <p className='mb-4 text-center text-base font-semibold text-black'>
            Please log in to view the dashboard:
          </p>
          <form className='space-y-6' onSubmit={handleLogin}>
            {error && <p className='text-sm text-red-500'>{error}</p>}
            <div>
              <label
                htmlFor='email'
                className='block text-sm leading-6 font-medium text-gray-900'
              >
                Email address
              </label>
              <div className='mt-2'>
                <input
                  id='email'
                  name='email'
                  type='email'
                  autoComplete='email'
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-violet-600 focus:ring-inset sm:text-sm sm:leading-6'
                />
              </div>
            </div>

            <div>
              <div className='flex items-center justify-between'>
                <label
                  htmlFor='password'
                  className='block text-sm leading-6 font-medium text-gray-900'
                >
                  Password
                </label>
              </div>
              <div className='mt-2'>
                <input
                  id='password'
                  name='password'
                  type='password'
                  autoComplete='current-password'
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-violet-600 focus:ring-inset sm:text-sm sm:leading-6'
                />
              </div>
            </div>

            <div>
              <button
                type='submit'
                className='flex w-full justify-center rounded-md bg-violet-600 px-3 py-1.5 text-sm leading-6 font-semibold text-white shadow-sm hover:bg-violet-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600'
              >
                Sign in
              </button>
            </div>
          </form>

          <p className='mt-12 mb-4 text-center text-base font-semibold text-black'>
            If you do not have an account:
          </p>
          <button
            onClick={() => router.push('/signup')}
            className='flex w-full justify-center rounded-md bg-gray-200 px-3 py-1.5 text-sm leading-6 font-semibold text-gray-700 shadow-sm hover:bg-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600'
          >
            Sign up
          </button>
        </div>
      </div>
    </div>
  );
}

export default AccessRestricted;
