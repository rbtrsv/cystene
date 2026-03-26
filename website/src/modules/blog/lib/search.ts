// Simple blog search utilities - Vercel compatible, no build scripts needed

export interface BlogPost {
  title: string;
  slug: string;
  summary: string;
  publishDate: string;
  categories: string[];
  href?: string;
}

export interface SearchResult extends BlogPost {
  score: number;
  snippet: string;
  highlights: string[];
}

// Normalize text for searching
function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, ' ');
}

// Split query into search terms
function getSearchTerms(query: string): string[] {
  return normalizeText(query)
    .split(' ')
    .filter(term => term.length > 1); // Ignore single character terms
}

// Calculate search score for a blog post
function calculateScore(searchTerms: string[], post: BlogPost): number {
  let score = 0;
  const normalizedTitle = normalizeText(post.title);
  const normalizedSummary = normalizeText(post.summary);
  const normalizedCategories = post.categories.map(cat => normalizeText(cat)).join(' ');

  searchTerms.forEach(term => {
    // Title matches (highest weight)
    if (normalizedTitle.includes(term)) {
      score += 10;
    }
    
    // Category matches (high weight)
    if (normalizedCategories.includes(term)) {
      score += 7;
    }
    
    // Summary matches (base weight)
    const summaryMatches = (normalizedSummary.match(new RegExp(term, 'g')) || []).length;
    score += summaryMatches * 3;
    
    // Bonus for exact title match
    if (normalizedTitle === term) {
      score += 15;
    }
  });

  return score;
}

// Generate snippet from summary with highlighted terms
function generateSnippet(summary: string, searchTerms: string[], maxLength: number = 150): string {
  const normalizedSummary = normalizeText(summary);
  
  // Find first occurrence of any search term
  let startIndex = 0;
  for (const term of searchTerms) {
    const index = normalizedSummary.indexOf(term);
    if (index !== -1) {
      startIndex = Math.max(0, index - 30);
      break;
    }
  }
  
  // Extract snippet
  const snippet = summary.substring(startIndex, startIndex + maxLength);
  return startIndex > 0 ? '...' + snippet + '...' : snippet + (summary.length > maxLength ? '...' : '');
}

// Find terms that matched for highlighting
function findHighlights(post: BlogPost, searchTerms: string[]): string[] {
  const highlights: string[] = [];
  const allText = normalizeText(`${post.title} ${post.summary} ${post.categories.join(' ')}`);
  
  searchTerms.forEach(term => {
    if (allText.includes(term)) {
      highlights.push(term);
    }
  });
  
  return [...new Set(highlights)]; // Remove duplicates
}

// Main search function
export function searchBlogPosts(query: string, blogPosts: BlogPost[]): SearchResult[] {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const searchTerms = getSearchTerms(query);
  if (searchTerms.length === 0) {
    return [];
  }

  const results: SearchResult[] = blogPosts
    .map(post => {
      const score = calculateScore(searchTerms, post);
      
      if (score === 0) {
        return null;
      }

      return {
        ...post,
        score,
        snippet: generateSnippet(post.summary, searchTerms),
        highlights: findHighlights(post, searchTerms)
      };
    })
    .filter((result): result is SearchResult => result !== null)
    .sort((a, b) => b.score - a.score);

  return results;
}

// Highlight matching terms in text
export function highlightText(text: string, highlights: string[]): string {
  if (!highlights.length) return text;
  
  let highlightedText = text;
  highlights.forEach(term => {
    const regex = new RegExp(`(${term})`, 'gi');
    highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
  });
  
  return highlightedText;
}