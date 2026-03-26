'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../supabaseClient';
import Image from 'next/image';
import logoFinpyDark from '@/modules/main/images/logos/finpy.svg';
import logoFinpyWhite from '@/modules/main/images/logos/finpy_white.svg';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

    if (signupError) {
      setError(signupError.message);
      return;
    }
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
          Create a new account
        </h2>
        <div className='mt-12 rounded-lg border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-white'>
          <form className='space-y-6' onSubmit={handleSignup}>
            {error && <p className='text-sm text-red-500'>{error}</p>}
            <div>
              <label
                htmlFor='firstName'
                className='block text-sm leading-6 font-medium text-gray-900'
              >
                First Name
              </label>
              <div className='mt-2'>
                <input
                  id='firstName'
                  name='firstName'
                  type='text'
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-violet-600 focus:ring-inset sm:text-sm sm:leading-6'
                />
              </div>
            </div>
            <div>
              <label
                htmlFor='lastName'
                className='block text-sm leading-6 font-medium text-gray-900'
              >
                Last Name
              </label>
              <div className='mt-2'>
                <input
                  id='lastName'
                  name='lastName'
                  type='text'
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-violet-600 focus:ring-inset sm:text-sm sm:leading-6'
                />
              </div>
            </div>
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
              <label
                htmlFor='password'
                className='block text-sm leading-6 font-medium text-gray-900'
              >
                Password
              </label>
              <div className='mt-2'>
                <input
                  id='password'
                  name='password'
                  type='password'
                  autoComplete='new-password'
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
                Sign up
              </button>
            </div>
          </form>
          <p className='mt-12 mb-4 text-center text-base font-semibold text-black'>
            Already have an account?
          </p>
          <button
            onClick={() => router.push('/login')}
            className='flex w-full justify-center rounded-md bg-gray-200 px-3 py-1.5 text-sm leading-6 font-semibold text-gray-700 shadow-sm hover:bg-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600'
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
