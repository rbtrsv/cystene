/**
 * Maps a blog category to its chip color classes (border + background + text, light
 * and dark). Shared by the article hero and the index post cards so a category looks
 * identical everywhere. Unmapped categories fall back to neutral zinc.
 *
 * Full literal class strings on purpose — Tailwind only keeps classes it can see in
 * source, so these must never be built dynamically (`border-${c}-200` would be purged).
 * When you add a new category, add a line here.
 */
export const categoryColor = (cat: string): string => {
  const colors: Record<string, string> = {
    'Cybersecurity': 'border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300',
    'Vibe-Coded Security': 'border-cyan-200 bg-cyan-100 text-cyan-800 dark:border-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-300',
    'Application Security': 'border-indigo-200 bg-indigo-100 text-indigo-800 dark:border-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300',
    'Vulnerability Scanning': 'border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300',
    'Attack Surface': 'border-violet-200 bg-violet-100 text-violet-800 dark:border-violet-800 dark:bg-violet-900/20 dark:text-violet-300',
    'Database Security': 'border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
    'Checklist': 'border-teal-200 bg-teal-100 text-teal-800 dark:border-teal-800 dark:bg-teal-900/20 dark:text-teal-300',
  };
  return colors[cat] ?? 'border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400';
};
