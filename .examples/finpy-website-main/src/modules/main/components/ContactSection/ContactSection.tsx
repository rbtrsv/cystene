'use client';

import React, { useRef, useState, FormEvent } from 'react';
import {
  BuildingOffice2Icon,
  EnvelopeIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';
import AnimatedButton from '@/modules/main/components/AnimatedButton/AnimatedButton';

export default function ContactSection() {
  const form = useRef<HTMLFormElement>(null);
  const [emailSent, setEmailSent] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);

  const sendEmail = async (e: FormEvent) => {
    e.preventDefault();

    if (form.current) {
      setSending(true);
      
      const formData = new FormData(form.current);
      const data = {
        user_name: formData.get('user_name'),
        user_email: formData.get('user_email'),
        message: formData.get('message')
      };

      try {
        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          form.current.reset();
          setEmailSent(true);
        } else {
          const error = await response.json();
          alert('Failed to send message. Please try again.');
          console.error('Send error:', error);
        }
      } catch (error) {
        console.error('Network error:', error);
        alert('Failed to send message. Please try again.');
      } finally {
        setSending(false);
      }
    }
  };

  return (
    <div id='contact' className='relative isolate bg-white dark:bg-black'>
      <div className='mx-auto grid max-w-7xl grid-cols-1 lg:grid-cols-2'>
        <div className='relative px-7 pt-24 pb-20 sm:pt-32 md:px-20 lg:static lg:py-40'>
          <div className='mx-auto max-w-xl lg:mx-0 lg:max-w-lg'>
            <h2 className='text-3xl font-bold tracking-tight text-black first-letter:font-bold lg:text-5xl dark:text-white'>
              Contact
            </h2>
            <p className='mt-6 pt-2 text-xl leading-8 tracking-tight text-black/80 max-sm:text-lg dark:text-white/80'>
              Interested in sharing your ideas with us?
            </p>
            <dl className='mt-10 space-y-4 text-base leading-7 text-black/80 dark:text-white/80'>
              <div className='flex gap-x-4'>
                <dt className='flex-none'>
                  <span className='sr-only'>Address</span>
                  <BuildingOffice2Icon
                    className='h-7 w-6 text-black/80 dark:text-white/80'
                    aria-hidden='true'
                  />
                </dt>
                <dd>Victoriei Business Center, Sevastopol 24, Bucharest</dd>
              </div>
              <div className='flex gap-x-4'>
                <dt className='flex-none'>
                  <span className='sr-only'>Email</span>
                  <EnvelopeIcon
                    className='h-7 w-6 text-black/80 dark:text-white/80'
                    aria-hidden='true'
                  />
                </dt>
                <dd>
                  <a
                    className='hover:text-[#9f55f9] dark:hover:text-[#9f55f9]'
                    href='mailto:robert.radoslav@pm.me'
                  >
                    robert.radoslav@pm.me
                  </a>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {!emailSent && (
          <form
            ref={form}
            onSubmit={sendEmail}
            action='#'
            method='POST'
            className='px-7 max-lg:pt-6 max-sm:pb-20 sm:pb-32 md:px-20 lg:pt-40'
          >
            <div className='mx-auto max-w-xl lg:mr-0 lg:max-w-lg'>
              <div className='grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2'>
                <div>
                  <label
                    htmlFor='user_name'
                    className='block text-sm leading-6 font-semibold text-black dark:text-white'
                  >
                    Full Name
                  </label>
                  <div className='mt-2.5'>
                    <input
                      type='text'
                      name='user_name'
                      id='user_name'
                      autoComplete='family-name'
                      className='block w-full rounded-md border-0 bg-white/5 px-3.5 py-2 text-black shadow-sm ring-1 ring-black/20 ring-inset focus:ring-2 focus:ring-[#9f55f9] focus:ring-inset sm:text-sm sm:leading-6 dark:text-white dark:ring-white/10 dark:focus:ring-[#9f55f9]'
                    />
                  </div>
                </div>
                <div className='sm:col-span-2'>
                  <label
                    htmlFor='user_email'
                    className='block text-sm leading-6 font-semibold text-black dark:text-white'
                  >
                    Email
                  </label>
                  <div className='mt-2.5'>
                    <input
                      type='email'
                      name='user_email'
                      id='user_email'
                      autoComplete='email'
                      className='block w-full rounded-md border-0 bg-white/5 px-3.5 py-2 text-black shadow-sm ring-1 ring-black/20 ring-inset focus:ring-2 focus:ring-[#9f55f9] focus:ring-inset sm:text-sm sm:leading-6 dark:text-white dark:ring-white/10 dark:focus:ring-[#9f55f9]'
                    />
                  </div>
                </div>
                <div className='sm:col-span-2'>
                  <label
                    htmlFor='message'
                    className='block text-sm leading-6 font-semibold text-black dark:text-white'
                  >
                    Message
                  </label>
                  <div className='mt-2.5'>
                    <textarea
                      name='message'
                      id='message'
                      rows={4}
                      className='block w-full rounded-md border-0 bg-white/5 px-3.5 py-2 text-black shadow-sm ring-1 ring-black/20 ring-inset focus:ring-2 focus:ring-[#9f55f9] focus:ring-inset sm:text-sm sm:leading-6 dark:text-white dark:ring-white/10 dark:focus:ring-[#9f55f9]'
                    ></textarea>
                  </div>
                </div>
              </div>
              <div className='mt-8 flex justify-end'>
                <button
                  type='submit'
                  disabled={sending}
                  className='rounded-md bg-violet-600 px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-violet-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9f55f9] disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {sending ? 'Sending...' : 'Send message'}
                </button>
              </div>
            </div>
          </form>
        )}

        {emailSent && (
          <div className='px-7 pt-20 pb-24 sm:pb-32 md:px-20 lg:py-48'>
            <div className='mx-auto max-w-xl lg:mr-0 lg:max-w-lg'>
              <p className='pt-10 text-2xl text-black dark:text-white'>
                Thank you for the email. We will get in touch with you shortly.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
