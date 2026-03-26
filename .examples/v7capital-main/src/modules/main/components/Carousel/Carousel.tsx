'use client';

import { MdChevronLeft, MdChevronRight } from 'react-icons/md';

const data = [
  {
    id: 1,
    href: 'https://romania.endeavor.org/from-founder-to-fund-builder-iulian-circiumaru-on-antifragility-and-the-blind-spots-investors-cant-ignore/',
    text: 'From Founder to Fund Builder: Iulian Circiumaru on Antifragility and the Blind Spots Investors Can\'t Ignore',
    source: 'Endeavor Romania',
    colour: 'bg-purple-400 hover:bg-purple-700',
  },
  {
    id: 2,
    href: 'https://www.zf.ro/burse-fonduri-mutuale/bursa-holdingul-v7-capital-detine-acum-peste-5-actiunile-2performant-22852144',
    text: 'Bursă: Holdingul V7 Capital deține acum peste 5% din acțiunile 2Performant',
    source: 'Ziarul Financiar',
    colour: 'bg-blue-400 hover:bg-blue-700',
  },
  {
    id: 3,
    href: 'https://start-up.ro/nommy-aplicatia-de-explorare-gastronomica-a-romaniei-primeste-investitie-de-300-000-de-euro/',
    text: 'Nommy, aplicația de explorare gastronomică a României, primește investiție de 300.000 de euro',
    source: 'StartUp',
    colour: 'bg-green-400 hover:bg-green-700',
  },
  {
    id: 4,
    href: 'https://start-up.ro/bogdan-axinia-dupa-plecarea-de-la-emag-se-implica-in-growceanu-v7-capital-seedblink-dar-si-ong-uri',
    text: 'Bogdan Axinia, după plecarea de la eMAG, se implică în Growceanu, V7 Capital, SeedBlink, dar și ONG-uri',
    source: 'StartUp',
    colour: 'bg-red-400 hover:bg-red-700',
  },
  {
    id: 5,
    href: 'https://start-up.ro/flip-ro-marketplace-vanzare-achizitie-telefoane-second-hand-verificate/',
    text: '120.000 de euro finanțare pentru tinerii români care-ți vând telefoane SH verificate',
    source: 'StartUp',
    colour: 'bg-teal-400 hover:bg-teal-700',
  },
  {
    id: 6,
    href: 'https://www.zf.ro/companii/andrei-cretu-cofondator-al-spatiului-de-coworking-v7-studio-se-contureaza-ideea-unui-incubator-cu-businessuri-in-tehnologie-18451497',
    text: 'Andrei Creţu, cofondator al spaţiului de coworking V7 Studio: Se conturează ideea unui incubator cu businessuri în tehnologie',
    source: 'Ziarul Financiar',
    colour: 'bg-lime-400 hover:bg-lime-700',
  },
  {
    id: 7,
    href: 'https://www.zf.ro/zf-it-generation/zf-it-generation-george-moroianu-si-alin-luca-in-2020-tintim-o-finantare-de-0-5-1-milion-de-euro-18669005',
    text: 'George Moroianu şi Alin Luca: În 2020 ţintim o finanţare de 0,5 - 1 milion de euro',
    source: 'Ziarul Financiar',
    colour: 'bg-yellow-400 hover:bg-yellow-700',
  },
  {
    id: 8,
    href: 'https://www.forbes.ro/doi-antreprenori-au-investit-120-000-de-euro-flip-ro-primul-marketplace-dedicat-vanzarilor-de-smartphone-uri-second-hand-149360',
    text: 'Doi antreprenori au investit 120.000 de euro în Flip.ro, primul marketplace dedicat vânzărilor de smartphone-uri second hand',
    source: 'Forbes',
    colour: 'bg-purple-400 hover:bg-purple-700',
  },
  {
    id: 9,
    href: 'https://www.wall-street.ro/articol/Start-Up/236235/ce-proiecte-are-in-portofoliu-fondul-de-investitii-v7-capital-invest-si-la-ce-se-uita-inainte-de-a-finanta-un-start-up.html',
    text: 'Ce proiecte are in portofoliu fondul de investitii V7 Capital si la ce se uita inainte de a finanta un start-up',
    source: 'WallStreet',
    colour: 'bg-blue-400 hover:bg-blue-700',
  },
  {
    id: 10,
    href: 'https://www.zf.ro/burse-fonduri-mutuale/holde-agri-invest-a-atras-5-mil-euro-de-la-investitori-intr-o-prima-runda-de-finantare-18408244',
    text: 'Holde Agri Invest a atras 5 mil. euro de la investitori într-o primă rundă de finanţare',
    source: 'Ziarul Financiar',
    colour: 'bg-green-400 hover:bg-green-700',
  },
  {
    id: 11,
    href: 'https://www.profit.ro/insider/agribusiness/confirmare-holde-agri-invest-holdingul-care-a-reunit-antreprenori-redutabili-pentru-a-deveni-unul-dintre-principalii-jucatori-din-agribusiness-atrage-finantare-si-pregateste-listarea-19121900',
    text: 'Holde Agri Invest, holdingul care a reunit antreprenori redutabili pentru a deveni unul dintre principalii jucători din agribusiness, atrage finanțare și pregătește listarea',
    source: 'Profit',
    colour: 'bg-red-400 hover:bg-red-700',
  },
  {
    id: 12,
    href: 'https://www.zf.ro/profesii/sven-marinus-ceo-al-sodexo-preluarea-7card-a-fost-structurata-in-asa-fel-incat-sa-permita-colaborarea-celor-doua-companii-strategia-este-sa-ne-diversificam-portofoliul-18295455',
    text: 'Sven Marinus, CEO al Sodexo: Preluarea 7card a fost structurată în aşa fel încât să permită colaborarea celor două companii. Strategia este să ne diversificăm portofoliul',
    source: 'Ziarul Financiar',
    colour: 'bg-teal-400 hover:bg-teal-700',
  },
  {
    id: 13,
    href: 'https://www.sodexo.ro/noutati/sodexo-romania-a-achizitionat-integral-7card/',
    text: 'Sodexo România a achiziționat integral 7card',
    source: 'Sodexo',
    colour: 'bg-lime-400 hover:bg-lime-700',
  },
  {
    id: 14,
    href: 'https://www.businessmagazin.ro/actualitate/cum-a-reusit-o-tanara-sa-transforme-un-blog-intr-o-afacere-de-succes-17866915',
    text: 'Cum a reuşit o tânără să transforme un blog într-o afacere de succes',
    source: 'Business Magazin',
    colour: 'bg-yellow-400 hover:bg-yellow-700',
  },
  {
    id: 15,
    href: 'https://www.zf.ro/business-hi-tech/zf-live-eduard-burghelia-si-iulian-circiumaru-de-la-confidas-eduard-burghelia-fondator-confidas-targetul-este-ca-in-6-luni-sa-avem-17-000-de-utilizatori-pe-platforma-17781312',
    text: 'Eduard Burghelia şi Iulian Circiumaru, de la Confidas: „Eduard Burghelia, fondator Confidas: „Targetul este ca în 6 luni să avem 17.000 de utilizatori pe platforma noastră"',
    source: 'Ziarul Financiar',
    colour: 'bg-purple-400 hover:bg-purple-700',
  },
  {
    id: 16,
    href: 'https://www.zf.ro/afaceri-de-la-zero/eduard-burghelia-a-atras-investitii-de-130-000-pentru-a-dezvolta-confidas-ro-o-platforma-care-stie-totul-despre-universul-companiilor-18447755',
    text: 'Eduard Burghelia a atras investiții de 130.000 de euro pentru a dezvolta Confidas.ro, o platformă care știe totul despre universul companiilor',
    source: 'Ziarul Financiar',
    colour: 'bg-blue-400 hover:bg-blue-700',
  },
  {
    id: 17,
    href: 'https://www.zf.ro/companii/andrei-cretu-cofondator-al-spatiului-de-coworking-v7-studio-se-contureaza-ideea-unui-incubator-cu-businessuri-in-tehnologie-18451497',
    text: 'Andrei Crețu, cofondator al spațiului de coworking V7 Studio: „Se conturează ideea unui incubator cu businessuri în tehnologie"',
    source: 'Ziarul Financiar',
    colour: 'bg-green-400 hover:bg-green-700',
  },
];

export default function Carousel() {
  const slideLeft = () => {
    var slider = document.getElementById('slider');
    if (slider) {
      slider.scrollLeft = slider.scrollLeft - 500;
    }
  };

  const slideRight = () => {
    var slider = document.getElementById('slider');
    if (slider) {
      slider.scrollLeft = slider.scrollLeft + 500;
    }
  };

  return (
    <section id='press' className='pb-4 sm:pb-0'>
      <div className='bg-white py-4 dark:bg-zinc-900 sm:py-14'>
        <div className='mx-auto max-w-2xl text-center'>
          <h2 className='text-2xl font-bold tracking-tight text-zinc-900 dark:text-white lg:text-5xl'>
            Featured stories
          </h2>
        </div>
      </div>

      <div className='bg-white px-5 py-5 dark:bg-zinc-900 md:px-20'>
        <div className='flex flex-row'>
          <div
            className='flex basis-1 flex-col justify-center max-[1024px]:hidden'
            onClick={slideLeft}
          >
            <MdChevronLeft
              className='cursor-pointer text-zinc-900 opacity-50 hover:text-[#fb8b6e] hover:opacity-100 dark:text-white'
              size={40}
            />
          </div>

          <div
            id='slider'
            className='flex basis-full snap-x snap-mandatory flex-nowrap gap-5 overflow-x-auto scrollbar-hide'
          >
            {data.map((item) => (
              <div
                key={item.id}
                className={`${item.colour} w-[250px] flex-none snap-center snap-always rounded p-5 shadow-lg`}
              >
                <a
                  href={item.href}
                  target='_blank'
                  className='flex h-60 flex-col justify-between text-white dark:text-white max-sm:h-56 max-sm:text-base'
                >
                  <div>{item.text}</div>
                  <div>{item.source}</div>
                </a>
              </div>
            ))}
          </div>

          <div
            className='flex basis-1 flex-col justify-center max-[1024px]:hidden'
            onClick={slideRight}
          >
            <MdChevronRight
              className='cursor-pointer text-zinc-900 opacity-50 hover:text-[#fb8b6e] hover:opacity-100 dark:text-white'
              size={40}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
