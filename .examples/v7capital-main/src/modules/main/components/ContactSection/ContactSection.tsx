'use client';

import React, { useActionState } from 'react';
import {
  BuildingOffice2Icon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { useForm, useStore, useTransform, mergeForm } from '@tanstack/react-form';
import { initialFormState } from '@tanstack/react-form/nextjs';
import { submitContactForm } from '../../actions/contact.actions';
import { contactFormOpts } from '../../config/contact-form.config';
import { contactFormSchema } from '../../schemas/contact.schema';

export default function ContactSection() {
  const [state, action] = useActionState(submitContactForm, initialFormState);

  const form = useForm({
    ...contactFormOpts,
    transform: useTransform((baseForm) => mergeForm(baseForm, state!), [state]),
  });

  const formErrors = useStore(form.store, (formState) => formState.errors);
  const isSubmitted = useStore(form.store, (formState) => formState.isSubmitted);

  return (
    <div className='relative isolate bg-white dark:bg-zinc-900'>
      {/* <div className="relative isolate -z-10">
        <div
          className="absolute inset-x-0 -top-40 left-[300px] -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
          aria-hidden="true"
        >
          <div
            className="relative left-[calc(50%-11rem)] aspect-1155/678 w-144.5 -translate-x-1/2 rotate-30 bg-linear-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-288.75"
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
          />

          <div
            className="relative aspect-1155/478 w-288.75 bg-linear-to-br from-[#80caff] to-[#4f46e5] opacity-20"
            style={{
              clipPath:
                'polygon(74.1% 56.1%, 100% 38.6%, 97.5% 73.3%, 85.5% 100%, 80.7% 98.2%, 72.5% 67.7%, 60.2% 37.8%, 52.4% 32.2%, 47.5% 41.9%, 45.2% 65.8%, 27.5% 23.5%, 0.1% 35.4%, 17.9% 0.1%, 27.6% 23.5%, 76.1% 2.6%, 74.1% 56.1%)',
            }}
          />
        </div>
      </div> */}

      <div
        id='contact'
        className='mx-auto grid max-w-7xl grid-cols-1 lg:grid-cols-2'
      >
        <div className='relative px-6 pb-20 pt-24 sm:pt-32 lg:static lg:px-8 lg:py-48'>
          <div className='mx-auto max-w-xl lg:mx-0 lg:max-w-lg'>
            <h2 className='text-2xl font-bold tracking-tight text-zinc-900 first-letter:font-bold dark:text-white lg:text-5xl'>
              Contact
            </h2>
            <p className='mt-6 pt-2 text-xl leading-8 tracking-tight text-zinc-900 dark:text-zinc-300 max-sm:text-lg'>
              Interested in sharing your ideas with us?
            </p>
            <dl className='mt-10 space-y-4 text-base leading-7 text-zinc-300'>
              <div className='flex gap-x-4'>
                <dt className='flex-none'>
                  <span className='sr-only'>Address</span>
                  <BuildingOffice2Icon
                    className='h-7 w-6 text-zinc-700 dark:text-zinc-200'
                    aria-hidden='true'
                  />
                </dt>
                <dd className='text-zinc-700 dark:text-zinc-400'>
                  5 Mendeleev Street, V7 Startup Studio, Bucharest
                </dd>
              </div>
              <div className='flex gap-x-4'>
                <dt className='flex-none'>
                  <span className='sr-only'>Email</span>
                  <EnvelopeIcon
                    className='h-7 w-6 text-zinc-700 dark:text-zinc-200'
                    aria-hidden='true'
                  />
                </dt>
                <dd>
                  <a
                    className='text-zinc-700 hover:text-[#fb8b6e] dark:text-zinc-400 dark:hover:text-[#fb8b6e]'
                    href='mailto:grow@v7capital.ro'
                  >
                    grow@v7capital.ro
                  </a>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {!isSubmitted && (
          <form
            action={action as never}
            onSubmit={() => form.handleSubmit()}
            className='px-6 pb-24 pt-20 sm:pb-32 lg:px-8 lg:py-48'
          >
            <div className='mx-auto max-w-xl lg:mr-0 lg:max-w-lg'>
              {/* Display form-level errors */}
              {formErrors.length > 0 && (
                <div className='mb-4 rounded-md bg-red-50 p-4 dark:bg-red-900/20'>
                  {formErrors.map((error) => (
                    <p key={error as string} className='text-sm text-red-800 dark:text-red-200'>
                      {error as string}
                    </p>
                  ))}
                </div>
              )}

              <div className='grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2'>
                {/* Full Name Field */}
                <form.Field
                  name='user_name'
                  validators={{
                    onChange: contactFormSchema.shape.user_name,
                  }}
                >
                  {(field) => (
                    <div>
                      <label
                        htmlFor={field.name}
                        className='block text-sm font-semibold leading-6 text-zinc-900 dark:text-white'
                      >
                        Full Name
                      </label>
                      <div className='mt-2.5'>
                        <input
                          type='text'
                          name={field.name}
                          id={field.name}
                          value={field.state.value ?? ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          autoComplete='name'
                          className='block w-full rounded-md border-0 bg-white/25 px-3.5 py-2 text-zinc-900 shadow-xs ring-1 ring-inset ring-black/10 focus:ring-2 focus:ring-inset focus:ring-[#fb8b6e] dark:bg-white/5 dark:text-white dark:ring-white/10 dark:focus:ring-[#fb8b6e] sm:text-sm sm:leading-6'
                        />
                      </div>
                      {field.state.meta.errors.length > 0 && (
                        <p className='mt-1 text-sm text-red-600 dark:text-red-400'>
                          {field.state.meta.errors.join(', ')}
                        </p>
                      )}
                    </div>
                  )}
                </form.Field>

                {/* Email Field */}
                <form.Field
                  name='user_email'
                  validators={{
                    onChange: contactFormSchema.shape.user_email,
                  }}
                >
                  {(field) => (
                    <div className='sm:col-span-2'>
                      <label
                        htmlFor={field.name}
                        className='block text-sm font-semibold leading-6 text-zinc-900 dark:text-white'
                      >
                        Email
                      </label>
                      <div className='mt-2.5'>
                        <input
                          type='email'
                          name={field.name}
                          id={field.name}
                          value={field.state.value ?? ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          autoComplete='email'
                          className='block w-full rounded-md border-0 bg-white/80 px-3.5 py-2 text-black shadow-xs ring-1 ring-inset ring-black/10 focus:ring-2 focus:ring-inset focus:ring-[#fb8b6e] dark:bg-white/5 dark:text-white dark:ring-white/10 dark:focus:ring-[#fb8b6e] sm:text-sm sm:leading-6'
                        />
                      </div>
                      {field.state.meta.errors.length > 0 && (
                        <p className='mt-1 text-sm text-red-600 dark:text-red-400'>
                          {field.state.meta.errors.join(', ')}
                        </p>
                      )}
                    </div>
                  )}
                </form.Field>

                {/* Message Field */}
                <form.Field
                  name='message'
                  validators={{
                    onChange: contactFormSchema.shape.message,
                  }}
                >
                  {(field) => (
                    <div className='sm:col-span-2'>
                      <label
                        htmlFor={field.name}
                        className='block text-sm font-semibold leading-6 text-zinc-900 dark:text-white'
                      >
                        Message
                      </label>
                      <div className='mt-2.5'>
                        <textarea
                          name={field.name}
                          id={field.name}
                          rows={4}
                          value={field.state.value ?? ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className='block w-full rounded-md border-0 bg-white/80 px-3.5 py-2 text-black shadow-xs ring-1 ring-inset ring-black/10 focus:ring-2 focus:ring-inset focus:ring-[#fb8b6e] dark:bg-white/5 dark:text-white dark:ring-white/10 dark:focus:ring-[#fb8b6e] sm:text-sm sm:leading-6'
                        />
                      </div>
                      {field.state.meta.errors.length > 0 && (
                        <p className='mt-1 text-sm text-red-600 dark:text-red-400'>
                          {field.state.meta.errors.join(', ')}
                        </p>
                      )}
                    </div>
                  )}
                </form.Field>
              </div>

              {/* Submit Button */}
              <div className='mt-8 flex justify-end'>
                <form.Subscribe
                  selector={(formState) => [formState.canSubmit, formState.isSubmitting]}
                >
                  {([canSubmit, isSubmitting]) => (
                    <button
                      type='submit'
                      disabled={!canSubmit}
                      className='rounded-md bg-[#fb8b6e] px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-xs hover:bg-[#fb8b6e] focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#fb8b6e] disabled:opacity-50 disabled:cursor-not-allowed dark:text-white'
                    >
                      {isSubmitting ? 'Sending...' : 'Send message'}
                    </button>
                  )}
                </form.Subscribe>
              </div>
            </div>
          </form>
        )}

        {isSubmitted && (
          <div className='px-6 pb-24 pt-20 sm:pb-32 lg:px-8 lg:py-48'>
            <div className='mx-auto max-w-xl lg:mr-0 lg:max-w-lg'>
              <p className='pt-10 text-2xl text-zinc-900 dark:text-white'>
                Thank you for the email. We will get in touch with you shortly.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
