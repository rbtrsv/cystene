import Image from 'next/image';
import LogoStreamlit from '@/modules/main/components/Technologies/images/logo-streamlit-black.png';
import LogoNextJS from '@/modules/main/components/Technologies/images/logo-nextjs.png';
import LogoSupabase from '@/modules/main/components/Technologies/images/logo-supabase-black.png';
import LogoFastAPI from '@/modules/main/components/Technologies/images/logo-fastapi.png';
import LogoFlutter from '@/modules/main/components/Technologies/images/logo-flutter.png';
import LogoSurrealDB from '@/modules/main/components/Technologies/images/logo-surrealdb.png';
import Logon8n from '@/modules/main/components/Technologies/images/logo-n8n.png';
import LogoPayload from '@/modules/main/components/Technologies/images/logo-payload.png';
import LogoDjango from '@/modules/main/components/Technologies/images/logo-django.png';
import LogoTauri from '@/modules/main/components/Technologies/images/logo-tauri.png';
import LogoNocoDB from '@/modules/main/components/Technologies/images/logo-nocodb.png';
import LogoExpo from '@/modules/main/components/Technologies/images/logo-expo.png';

const data = [
  {
    id: 1,
    href: 'https://nextjs.org',
    image: LogoNextJS,
    text: 'A versatile React framework enabling server-side rendering and static websites.',
    colour: '',
    label: '',
    labelColour: '',
    imageExtraConfig: 'invert',
  },
  {
    id: 2,
    href: 'https://www.djangoproject.com',
    image: LogoDjango,
    text: 'A high-level Python Web framework that encourages rapid development and clean, pragmatic design.',
    colour: '',
    label: '',
    labelColour: '',
    imageExtraConfig: 'invert',
  },
  {
    id: 3,
    href: 'https://fastapi.tiangolo.com',
    image: LogoFastAPI,
    text: 'Modern, fast (high-performance), web framework for building APIs with Python.',
    colour: '',
    label: '',
    labelColour: '',
    imageExtraConfig: 'invert',
  },
  {
    id: 4,
    href: 'https://streamlit.io',
    image: LogoStreamlit,
    text: 'A faster way to prototype and share data apps and ML models written in Python.',
    colour: '',
    // colour: 'bg-violet-400 hover:bg-violet-600',
    label: '',
    labelColour: 'bg-violet-500 hover:bg-violet-600',
    // imageExtraConfig: '',
    imageExtraConfig: 'invert',
  },
  {
    id: 5,
    href: 'https://flutter.dev',
    image: LogoFlutter,
    text: 'Best for building natively compiled, multi-platform applications from a single codebase.',
    colour: '',
    label: '',
    labelColour: '',
    imageExtraConfig: 'invert',
  },
  {
    id: 6,
    href: 'https://tauri.app',
    image: LogoTauri,
    text: 'A framework for building tiny, blazing fast binaries for all major desktop platforms.',
    colour: '',
    label: '',
    labelColour: '',
    imageExtraConfig: 'invert',
  },
  {
    id: 7,
    href: 'https://expo.dev',
    image: LogoExpo,
    text: 'A framework for creating universal native apps with React that run on Android, iOS, and the web.',
    colour: '',
    label: '',
    labelColour: '',
    imageExtraConfig: 'invert',
  },
  {
    id: 8,
    href: 'https://payloadcms.com',
    image: LogoPayload,
    text: 'A developer-centric headless CMS that simplifies creating and delivering content on various digital devices.',
    colour: '',
    label: '',
    labelColour: '',
    imageExtraConfig: 'invert',
  },
  {
    id: 9,
    href: 'https://n8n.io',
    image: Logon8n,
    text: 'An extendable workflow automation tool for integrating and automating various systems and services.',
    colour: '',
    label: '',
    labelColour: '',
    imageExtraConfig: 'invert',
  },
  {
    id: 10,
    href: 'https://supabase.com',
    image: LogoSupabase,
    text: 'Best for building secure and performant Postgres backends with minimal configuration.',
    colour: '',
    label: '',
    labelColour: '',
    imageExtraConfig: 'invert',
  },
  {
    id: 11,
    href: 'https://surrealdb.com',
    image: LogoSurrealDB,
    text: ' A cutting-edge, multi-model database blending document and graph paradigms.',
    colour: '',
    label: '',
    labelColour: '',
    imageExtraConfig: 'invert',
  },
  {
    id: 12,
    href: 'https://nocodb.com',
    image: LogoNocoDB,
    text: 'An open-source Airtable alternative that turns any database into a smart spreadsheet.',
    colour: '',
    label: '',
    labelColour: '',
    imageExtraConfig: 'invert',
  },
];

export default function Technologies() {
  return (
    <section id='technologies'>
      <div className='bg-white py-6 sm:py-14 dark:bg-black'>
        <div className='mx-auto max-w-2xl text-center'>
          <h2 className='text-3xl font-bold tracking-tight text-black lg:text-4xl dark:text-white'>
            Technologies
          </h2>
        </div>
      </div>

      <div className='grid gap-6 bg-white px-7 pb-16 dark:bg-black max-sm:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 md:px-20 lg:grid-cols-4'>
        {data.map((item) => (
          <a
            key={item.id}
            href={item.href}
            title={item.text}
            aria-label={item.text}
            className={`${item.colour} relative flex min-h-[210px] w-full flex-col items-center justify-around rounded bg-zinc-100 p-3 ring-inset ring-violet-600 hover:bg-gradient-to-br hover:from-[#c517ff] hover:to-[#2631f7] dark:bg-zinc-900`}
          >
            <Image
              src={item.image}
              alt={`Logo of ${item.text}`}
              width={160}
              height={120}
              className={`cursor-pointer ${
                item.imageExtraConfig === 'invert'
                  ? 'brightness-50 contrast-200 grayscale invert-0 filter dark:invert'
                  : ''
              }`}
            />
            <p className='text-black/75 dark:text-white/75 max-sm:text-sm'>
              {item.text}
            </p>
            <div
              className={`absolute -top-3 left-2 rounded-sm px-1 text-sm text-black dark:text-white ${item.labelColour}`}
            >
              {item.label}
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
