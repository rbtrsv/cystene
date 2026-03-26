import { getSingletonHighlighter } from 'shiki';

// This variable will hold the promise for our highlighter instance
let highlighterPromise: any = null;

export function setupHighlighter(): any {
  // If the highlighter hasn't been initialized yet, create it
  if (!highlighterPromise) {
    // getSingletonHighlighter ensures we only create one instance of the highlighter
    // This is important for performance and memory usage
    highlighterPromise = getSingletonHighlighter({
      // We're setting up themes for both light and dark mode
      themes: ['github-light', 'github-dark'],
      // These are the programming languages we want to support
      langs: ['python', 'javascript', 'typescript', 'css', 'html', 'bash'],
    });
  }
  // Return the promise of the highlighter
  return highlighterPromise;
}

export async function codeToHtml(code: string, language: string): Promise<string> {
  try {
    // Wait for the highlighter to be ready
    const highlighter = await setupHighlighter();
    // Use the highlighter to convert our code to HTML with syntax highlighting
    return highlighter.codeToHtml(code, {
      lang: language,
      // Use different themes for light and dark mode
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
    });
  } catch (error) {
    // If something goes wrong, log the error and return plain, unhighlighted code
    console.error('Error highlighting code:', error);
    return `<pre><code>${code}</code></pre>`;
  }
}