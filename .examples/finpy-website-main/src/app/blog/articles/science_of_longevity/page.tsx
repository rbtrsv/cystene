import React from 'react';
import { Metadata } from 'next';
import ArticleLayout from '@/modules/blog/components/articles/ArticleLayout';
import ArticleHeader from '@/modules/blog/components/articles/ArticleHeader';
import H1 from '@/modules/blog/components/primitives/H1';
import Text from '@/modules/blog/components/primitives/Text';
import Code from '@/modules/blog/components/code/Code';
import { generatePageMetadata } from '@/modules/blog/components/composed/PageSEO';

export const metadata: Metadata = generatePageMetadata({
  title: "The Science of Longevity",
  description: "Explore the latest research and practices for extending healthy lifespan.",
  slug: "blog/articles/science_of_longevity",
  type: "article",
  publishDate: "2023-11-01",
  author: "Robert Radoslav",
  keywords: ["Longevity", "Health", "Aging", "Wellness", "Lifestyle"],
});

export default function ScienceOfLongevityPage() {
  return (
    <ArticleLayout>
      <ArticleHeader
        title="The Science of Longevity"
        publishDate="2023-11-01"
        categories={["Longevity", "Health", "Science"]}
      />
      <Text>
        The science of longevity is a rapidly evolving field that focuses on understanding the 
        biological processes of aging and developing strategies to extend healthy lifespan. 
        In this article, we will explore some key concepts and recent advancements in longevity research.
      </Text>

      <H1>1. Understanding Cellular Aging</H1>
      <Text>
        At the core of longevity research is the study of cellular aging. One important factor 
        is telomere length. Telomeres are protective structures at the ends of chromosomes that 
        shorten as cells divide. Here is a simplified representation of telomere shortening:
      </Text>
      <Code
        code={`
# Simplified telomere shortening representation
telomere_length = 10000  # base pairs
cell_divisions = 50

for division in range(cell_divisions):
    telomere_length -= 100  # loss per division
    print(f"Division {division + 1}: Telomere length = {telomere_length} bp")

print("Cell reaches senescence")
        `}
        language="python"
      />

      <H1>2. Lifestyle Factors in Longevity</H1>
      <Text>
        While genetic factors play a role in longevity, lifestyle choices have a significant impact. 
        Key areas include diet, exercise, stress management, and sleep. Let us look at a simple 
        example of how these factors might be quantified:
      </Text>
      <Code
        code={`
def calculate_longevity_score(diet, exercise, stress, sleep):
    score = 0
    score += diet * 0.3
    score += exercise * 0.3
    score += (10 - stress) * 0.2  # Lower stress is better
    score += sleep * 0.2
    return score

# Example usage
my_score = calculate_longevity_score(
    diet=8,        # Scale of 1-10
    exercise=7,    # Scale of 1-10
    stress=4,      # Scale of 1-10 (lower is better)
    sleep=8        # Scale of 1-10
)

print(f"Longevity Score: {my_score:.2f} / 10")
        `}
        language="python"
      />

      <Text>
        Remember, longevity is a complex field with many interacting factors. While we have simplified 
        concepts here, the real science involves intricate biological processes and extensive research. 
        Stay tuned for more in-depth articles on specific longevity topics!
      </Text>
    </ArticleLayout>
  );
}