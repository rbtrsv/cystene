import React from 'react';
import { Metadata } from 'next';
import NavbarDownwards from '@/modules/main/components/NavbarDownwards/NavbarDownwards';
import Footer from '@/modules/main/components/Footer/Footer';
import ImageLeftSection from '@/modules/blog/components/composed/ImageLeftSection';
import SimpleSection from '@/modules/blog/components/composed/SimpleSection';
import AlternativeArticleHeader from '@/modules/blog/components/composed/AlternativeArticleHeader';
import Text from '@/modules/blog/components/primitives/Text';
import UL from '@/modules/blog/components/primitives/UL';
import LI from '@/modules/blog/components/primitives/LI';
import LinkComponent from '@/modules/blog/components/primitives/LinkComponent';
import Blockquote from '@/modules/blog/components/primitives/Blockquote';
import { generatePageMetadata } from '@/modules/blog/components/composed/PageSEO';

export const metadata: Metadata = generatePageMetadata({
  title: 'Entrepreneurship Mindset',
  description: 'Develop the mental frameworks and habits that successful entrepreneurs use to build thriving businesses and overcome challenges.',
  slug: 'blog/articles/entrepreneurship-mindset',
  type: 'article',
  publishDate: '2023-10-15',
  author: 'Buraro Team',
  keywords: ['entrepreneurship', 'mindset', 'business', 'productivity', 'success', 'growth', 'leadership'],
});

export default function EntrepreneurshipMindsetPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <NavbarDownwards />
      <main className="grow bg-white dark:bg-black pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-8 sm:pb-12">
        
        <AlternativeArticleHeader
          title="Entrepreneurship Mindset"
          subtitle="Develop the mental frameworks and habits that successful entrepreneurs use to build thriving businesses and overcome challenges."
          imageUrl="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=400&fit=crop&crop=center"
          imageAlt="Entrepreneurs collaborating on business strategy"
          author="Buraro Team"
          publishDate="October 15, 2023"
          categories={[
            { label: 'Entrepreneurship', variant: 'performance' },
            { label: 'Productivity', variant: 'energy' },
            { label: 'Success', variant: 'health' },
            { label: 'Growth', variant: 'supplements' }
          ]}
        />

        <ImageLeftSection
          imageUrl="https://images.unsplash.com/photo-1664575602276-acd073f104c1?w=400&h=400&fit=crop&crop=center"
          imageAlt="Focused entrepreneur working on laptop"
          title="The Foundation of Entrepreneurial Thinking"
        >
          <Text>
            The entrepreneurial mindset is fundamentally different from traditional employee thinking. 
            It&apos;s characterized by a unique blend of optimism, resilience, and calculated risk-taking that 
            enables individuals to see opportunities where others see obstacles.
          </Text>

          <Blockquote author="Reid Hoffman, LinkedIn Founder">
            &ldquo;Starting a company is like jumping off a cliff and assembling a plane on the way down.&rdquo;
          </Blockquote>

          <Text>
            This mindset shift begins with understanding that uncertainty isn&apos;t something to avoid—it&apos;s 
            the natural environment where opportunities thrive. Successful entrepreneurs learn to embrace 
            ambiguity and make decisions with incomplete information.
          </Text>

          <UL>
            <LI>Embrace uncertainty as the natural state of business</LI>
            <LI>View failures as learning opportunities, not setbacks</LI>
            <LI>Focus on solutions rather than dwelling on problems</LI>
            <LI>Develop comfort with making decisions quickly</LI>
          </UL>
        </ImageLeftSection>

        <ImageLeftSection
          imageUrl="https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&h=400&fit=crop&crop=center"
          imageAlt="Professional standing near stairs representing growth and ambition"
          title="Building Mental Resilience"
        >
          <Text>
            Mental resilience is perhaps the most critical trait for entrepreneurial success. The ability 
            to bounce back from setbacks, adapt to changing circumstances, and maintain motivation through 
            difficult periods separates successful entrepreneurs from those who give up.
          </Text>

          <UL>
            <LI>
              <LinkComponent href="#">Develop a growth mindset</LinkComponent>: View challenges as opportunities to learn and improve
            </LI>
            <LI>
              <LinkComponent href="#">Practice emotional regulation</LinkComponent>: Learn to manage stress and maintain clarity under pressure
            </LI>
            <LI>
              <LinkComponent href="#">Build a support network</LinkComponent>: Surround yourself with mentors, peers, and advisors
            </LI>
            <LI>
              <LinkComponent href="#">Cultivate patience</LinkComponent>: Understand that building something meaningful takes time
            </LI>
          </UL>

          <Blockquote>
            &ldquo;The way to get started is to quit talking and begin doing. The problem with most people is they think too much and act too little.&rdquo;
          </Blockquote>
        </ImageLeftSection>

        <ImageLeftSection
          imageUrl="https://images.unsplash.com/photo-1537511446984-935f663eb1f4?w=400&h=400&fit=crop&crop=center"
          imageAlt="Mobile entrepreneur using smartphone for business"
          title="Opportunity Recognition and Market Awareness"
        >
          <Text>
            Successful entrepreneurs possess an almost supernatural ability to spot opportunities that 
            others miss. This isn&apos;t magic—it&apos;s a skill that can be developed through consistent practice 
            and a systematic approach to market observation.
          </Text>

          <Text>
            The key is to train yourself to see gaps between what exists and what could exist. This 
            requires staying close to your target market, understanding customer pain points, and 
            constantly questioning the status quo.
          </Text>

          <UL>
            <LI>Regularly engage with potential customers to understand their challenges</LI>
            <LI>Study successful businesses in adjacent markets for inspiration</LI>
            <LI>Question assumptions about &ldquo;how things are done&rdquo;</LI>
            <LI>Look for intersection points between different industries or technologies</LI>
            <LI>Pay attention to emerging trends and early signals of change</LI>
          </UL>
        </ImageLeftSection>

        <SimpleSection
          title="The Risk-Taking Framework"
        >
          <Text>
            Entrepreneurs aren&apos;t reckless gamblers—they&apos;re calculated risk-takers who understand how to 
            assess and mitigate potential downsides while maximizing upside potential. Developing a 
            systematic approach to risk assessment is crucial for long-term success.
          </Text>

          <Blockquote author="Peter Thiel, PayPal Co-founder">
            &ldquo;The most contrarian thing of all is not to oppose the crowd but to think for yourself.&rdquo;
          </Blockquote>

          <UL>
            <LI>Assess the worst-case scenario and ensure it&apos;s survivable</LI>
            <LI>Look for asymmetric risk/reward opportunities</LI>
            <LI>Start small and scale gradually to limit exposure</LI>
            <LI>Diversify your bets across multiple opportunities</LI>
            <LI>Set clear criteria for when to pivot or abandon a strategy</LI>
          </UL>

          <Text>
            Remember that the biggest risk is often not taking any risks at all. In a rapidly changing 
            world, standing still is essentially moving backwards. The entrepreneurial mindset embraces 
            intelligent risk-taking as a necessary component of growth and innovation.
          </Text>
        </SimpleSection>

        <SimpleSection
          title="Action-Oriented Decision Making"
        >
          <Text>
            Entrepreneurs understand that perfect information is a luxury they can&apos;t afford. They develop 
            the ability to make good decisions quickly with limited data, then adjust course as more 
            information becomes available.
          </Text>

          <UL>
            <LI>Set decision deadlines to avoid analysis paralysis</LI>
            <LI>Use the 80/20 rule: make decisions when you have 80% of the information</LI>
            <LI>Build feedback loops to quickly identify when course correction is needed</LI>
            <LI>Focus on reversible decisions when possible</LI>
            <LI>Delegate decisions to team members to increase speed and scale</LI>
          </UL>

          <Text>
            The entrepreneurial mindset values progress over perfection. It&apos;s better to make a good 
            decision quickly and adjust as needed than to wait for the perfect decision that may never come.
          </Text>
        </SimpleSection>

        <SimpleSection
          title="Continuous Learning and Adaptation"
        >
          <Text>
            The most successful entrepreneurs are perpetual students. They understand that in a rapidly 
            evolving business landscape, the ability to learn and adapt quickly is more valuable than 
            any specific knowledge or skill.
          </Text>

          <UL>
            <LI>Read industry publications and stay current with trends</LI>
            <LI>Attend conferences and networking events to learn from peers</LI>
            <LI>Seek out mentors who have achieved what you aspire to accomplish</LI>
            <LI>Experiment with new approaches and technologies</LI>
            <LI>Regular reflect on lessons learned from both successes and failures</LI>
          </UL>

          <Blockquote>
            &ldquo;The illiterate of the 21st century will not be those who cannot read and write, but those who cannot learn, unlearn, and relearn.&rdquo;
          </Blockquote>

          <Text>
            Developing an entrepreneurial mindset is a journey, not a destination. It requires consistent 
            practice, self-reflection, and a willingness to step outside your comfort zone. But for those 
            who commit to this path, the rewards—both personal and professional—can be extraordinary.
          </Text>
        </SimpleSection>

      </main>
      <Footer />
    </div>
  );
}