import React from 'react';
import { Metadata } from 'next';
import NavbarDownwards from '@/modules/main/components/NavbarDownwards/NavbarDownwards';
import Footer from '@/modules/main/components/Footer/Footer';
import ImageLeftSection from '@/modules/blog/components/composed/ImageLeftSection';
import AlternativeArticleHeader from '@/modules/blog/components/composed/AlternativeArticleHeader';
import Text from '@/modules/blog/components/primitives/Text';
import UL from '@/modules/blog/components/primitives/UL';
import LI from '@/modules/blog/components/primitives/LI';
import LinkComponent from '@/modules/blog/components/primitives/LinkComponent';
import Blockquote from '@/modules/blog/components/primitives/Blockquote';
import { generatePageMetadata } from '@/modules/blog/components/composed/PageSEO';

export const metadata: Metadata = generatePageMetadata({
  title: 'Daily Routine Components Demo',
  description: 'Showcasing how our routine section components work with various content types, inspired by the Andrew Huberman daily routine format.',
  slug: 'blog/articles/routine-demo',
  type: 'article',
  publishDate: '2025-01-15',
  author: 'Buraro Team',
  keywords: ['routine', 'lifestyle', 'health', 'performance', 'supplements', 'energy', 'demo'],
});

export default function RoutineDemoPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <NavbarDownwards />
      <main className="grow bg-white dark:bg-black pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-8 sm:pb-12">
        
        <AlternativeArticleHeader
          title="Daily Routine Components Demo"
          subtitle="Showcasing how our routine section components work with various content types, inspired by the Andrew Huberman daily routine format."
          imageUrl="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&crop=center"
          imageAlt="Daily routine and wellness concept"
          author="Buraro Team"
          publishDate="January 15, 2025"
          categories={[
            { label: 'Energy', variant: 'energy' },
            { label: 'Health', variant: 'health' },
            { label: 'Performance', variant: 'performance' },
            { label: 'Supplements', variant: 'supplements' }
          ]}
        />

        <ImageLeftSection
          imageUrl="https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=400&fit=crop&crop=center"
          imageAlt="Person drinking water in the morning"
          timeIndicator="6:00 AM"
          timeColor="yellow"
          title="Morning Routine Hydration"
        >
          <UL>
            <LI>Drink 2 glasses of water immediately upon waking</LI>
            <LI>Add electrolytes to support nervous system function</LI>
            <LI>Consider AG1 for comprehensive micronutrient support</LI>
          </UL>

          <Blockquote author="Dr. Andrew Huberman">
            &ldquo;Your nervous system and your neurons particularly depend on electrolytes because you need the electrolytes, 
            sodium, magnesium, and potassium, in the proper ratios, in order for those nerve cells to fire action potentials.&rdquo;
          </Blockquote>

          <Text>
            Starting your day with proper hydration sets the foundation for optimal brain and body function. 
            The addition of electrolytes ensures your neurons can communicate effectively throughout the day.
          </Text>
        </ImageLeftSection>

        <ImageLeftSection
          imageUrl="https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=400&h=400&fit=crop&crop=center"
          imageAlt="Person in meditation pose"
          timeIndicator="6:15 AM"
          timeColor="purple"
          title="Yoga Nidra (Non-Sleep Deep Rest)"
        >
          <Text>
            If you wake up not fully rested, Yoga Nidra can help you start your day efficiently. 
            This technique can assist you in achieving a sleep-like state and replenishing dopamine, 
            reducing cortisol, and decreasing total sleep need.
          </Text>

          <Blockquote>
            &ldquo;There are some interesting data published showing that these yoga nidra meditations, if you will, 
            can upregulate some of the neurotransmitters in the brain, including dopamine, that make you prepared for action.&rdquo;
          </Blockquote>

          <Text>
            The practice involves guided body scans and visualizations that bring the mind and body 
            into a deep relaxation state akin to the state between wakefulness and sleep.
          </Text>
        </ImageLeftSection>

        <ImageLeftSection
          imageUrl="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop&crop=center"
          imageAlt="Various health supplements"
          title="Top 5 Performance Supplements"
        >
          <UL>
            <LI>
              <LinkComponent href="#">AG1</LinkComponent>: A daily dose of essential vitamins, minerals, and probiotics to support energy, digestion, and immune health.
            </LI>
            <LI>
              <LinkComponent href="#">Alpha GPC</LinkComponent>: A brain-boosting supplement that increases acetylcholine levels, improving memory and cognitive function.
            </LI>
            <LI>
              <LinkComponent href="#">Creatine</LinkComponent>: Not just for muscle growth—creatine also supports brain energy, making it a staple for peak mental and physical performance.
            </LI>
            <LI>
              <LinkComponent href="#">Tyrosine</LinkComponent>: A key amino acid that sharpens focus, enhances motivation, and helps the brain stay resilient under stress.
            </LI>
            <LI>
              <LinkComponent href="#">Yerba Mate</LinkComponent>: A natural caffeine source that enhances focus and alertness without the jittery crash of coffee.
            </LI>
          </UL>

          <Text>
            These supplements work synergistically to support both cognitive performance and physical energy 
            throughout the day. Always consult with a healthcare provider before starting any supplement regimen.
          </Text>
        </ImageLeftSection>

        <ImageLeftSection
          imageUrl="https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=400&h=400&fit=crop&crop=center"
          imageAlt="Omega-3 fish oil supplements"
          title="Omega-3 Fish Oil"
        >
          <Text>
            <LinkComponent href="#">Omega-3 fish oil supplements</LinkComponent> are an essential part of a longevity and performance routine. 
            While fatty fish like salmon and sardines provide omega-3s, many people don&apos;t consume enough through diet alone.
          </Text>

          <Text>
            That&apos;s why it&apos;s highly recommended to supplement with fish oil or algae oil to ensure the body gets adequate 
            amounts of EPA and DHA, the key omega-3 fatty acids. Additionally, pairing omega-3 fish oil with DHEA in the 
            morning supports hormone balance and reduce inflammation.
          </Text>

          <UL>
            <LI>Supports heart, brain, and joint health</LI>
            <LI>Helps manage inflammation</LI>
            <LI>Daily intake recommendation: A common dosage is 1-3 grams of EPA/DHA per day</LI>
            <LI>High-quality sourcing matters: Wild-caught fish oil or algae-based options</LI>
          </UL>
        </ImageLeftSection>

        <ImageLeftSection
          imageUrl="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=400&fit=crop&crop=center"
          imageAlt="Person reading a book in dim lighting"
          timeIndicator="10:00 PM"
          timeColor="blue"
          title="Evening Wind Down"
        >
          <Text>
            Creating a consistent evening routine helps signal to your body that it&apos;s time to prepare for sleep. 
            This involves managing light exposure and engaging in calming activities.
          </Text>

          <Blockquote>
            &ldquo;Avoid viewing bright lights—especially bright overhead lights between 10 pm and 4 am. 
            Only use as much artificial lighting as is necessary for you to remain and move about safely at night.&rdquo;
          </Blockquote>

          <UL>
            <LI>Dim all lights in your environment</LI>
            <LI>Avoid screens or use blue light blocking glasses</LI>
            <LI>Read physical books or practice light stretching</LI>
            <LI>Consider taking sleep-supporting supplements 30-60 minutes before bed</LI>
          </UL>
        </ImageLeftSection>

        <ImageLeftSection
          imageUrl="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop&crop=center"
          imageAlt="TMG supplement powder"
          title="TMG (Trimethylglycine)"
        >
          <Text>
            <LinkComponent href="#">TMG (Trimethylglycine)</LinkComponent> is a key component in many longevity-focused supplement routines because of its central 
            role in methylation, a critical process for cellular repair, detoxification, and cardiovascular support.
          </Text>

          <UL>
            <LI>Plays a role in methylation: TMG acts as a methyl donor, providing the building blocks needed for the body to convert homocysteine into methionine</LI>
            <LI>Supports cognitive and neurological function: Methylation directly influences neurotransmitter production, brain energy metabolism, and mood regulation</LI>
            <LI>May benefit cardiovascular health: By helping reduce homocysteine levels, TMG contributes to the maintenance of healthy blood vessels and normal circulation</LI>
          </UL>

          <Text>
            TMG is a practical addition to any longevity supplement plan aiming to support cardiovascular health, cognitive 
            function, and optimal methylation. Its versatility and complementary role to other supplements make it a useful tool for 
            maintaining optimal wellness from within through a data-driven approach.
          </Text>
        </ImageLeftSection>

      </main>
      <Footer />
    </div>
  );
}