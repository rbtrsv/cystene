'use client';

// Nudgio brand color exploration page.
// Nexotype: #17ff55 → #2631f7 (green → blue)
// Finpy: #c517ff → #2631f7 (purple → blue)
// Nudgio candidates: custom hex, warm/distinct from both.
export default function BrandPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nudgio Brand Colors</h1>
        <p className="text-muted-foreground">
          Pick a gradient for Nudgio distinct from nexotype and finpy
        </p>
      </div>

      {/* Nexotype */}
      <div className="space-y-2">
        <div className="h-32 rounded-lg shadow-md bg-gradient-to-r from-[#17ff55] to-[#2631f7]" />
        <p className="font-medium">Nexotype — Green → Blue</p>
        <p className="text-xs font-mono text-muted-foreground">from-[#17ff55] to-[#2631f7]</p>
      </div>

      {/* Finpy */}
      <div className="space-y-2">
        <div className="h-32 rounded-lg shadow-md bg-gradient-to-br from-[#c517ff] to-[#2631f7]" />
        <p className="font-medium">Finpy — Purple → Blue</p>
        <p className="text-xs font-mono text-muted-foreground">from-[#c517ff] to-[#2631f7]</p>
      </div>

      {/* Nudgio candidates — custom hex */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Nudgio Candidates</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Orange → Red */}
          <div className="space-y-2">
            <div className="h-40 rounded-lg shadow-md bg-gradient-to-r from-[#ff6b17] to-[#f72631]" />
            <p className="font-medium">Orange → Red</p>
            <p className="text-sm text-muted-foreground">Warm nudge — energetic, conversion</p>
            <p className="text-xs font-mono text-muted-foreground">from-[#ff6b17] to-[#f72631]</p>
          </div>

          {/* Orange → Hot Pink */}
          <div className="space-y-2">
            <div className="h-40 rounded-lg shadow-md bg-gradient-to-r from-[#ff7b17] to-[#ff17a8]" />
            <p className="font-medium">Orange → Hot Pink</p>
            <p className="text-sm text-muted-foreground">Sunset nudge — playful, bold</p>
            <p className="text-xs font-mono text-muted-foreground">from-[#ff7b17] to-[#ff17a8]</p>
          </div>

          {/* Gold → Orange */}
          <div className="space-y-2">
            <div className="h-40 rounded-lg shadow-md bg-gradient-to-r from-[#ffb017] to-[#f76326]" />
            <p className="font-medium">Gold → Orange</p>
            <p className="text-sm text-muted-foreground">Golden warmth — trust, shopping</p>
            <p className="text-xs font-mono text-muted-foreground">from-[#ffb017] to-[#f76326]</p>
          </div>

          {/* Coral → Magenta */}
          <div className="space-y-2">
            <div className="h-40 rounded-lg shadow-md bg-gradient-to-r from-[#ff4757] to-[#ff17c5]" />
            <p className="font-medium">Coral → Magenta</p>
            <p className="text-sm text-muted-foreground">Bold pop — attention-grabbing</p>
            <p className="text-xs font-mono text-muted-foreground">from-[#ff4757] to-[#ff17c5]</p>
          </div>

          {/* Red → Gold */}
          <div className="space-y-2">
            <div className="h-40 rounded-lg shadow-md bg-gradient-to-r from-[#f72631] to-[#ffc517]" />
            <p className="font-medium">Red → Gold</p>
            <p className="text-sm text-muted-foreground">Fire to gold — urgency meets reward</p>
            <p className="text-xs font-mono text-muted-foreground">from-[#f72631] to-[#ffc517]</p>
          </div>

          {/* Hot Orange → Coral */}
          <div className="space-y-2">
            <div className="h-40 rounded-lg shadow-md bg-gradient-to-r from-[#ff5517] to-[#ff1768]" />
            <p className="font-medium">Hot Orange → Coral</p>
            <p className="text-sm text-muted-foreground">Neon nudge — app store standout</p>
            <p className="text-xs font-mono text-muted-foreground">from-[#ff5517] to-[#ff1768]</p>
          </div>

          {/* Peach → Red */}
          <div className="space-y-2">
            <div className="h-40 rounded-lg shadow-md bg-gradient-to-r from-[#ff9a17] to-[#f7263b]" />
            <p className="font-medium">Peach → Red</p>
            <p className="text-sm text-muted-foreground">Warm to hot — ecommerce CTA</p>
            <p className="text-xs font-mono text-muted-foreground">from-[#ff9a17] to-[#f7263b]</p>
          </div>

          {/* Amber → Teal */}
          <div className="space-y-2">
            <div className="h-40 rounded-lg shadow-md bg-gradient-to-r from-[#ffb017] to-[#17d4a8]" />
            <p className="font-medium">Amber → Teal</p>
            <p className="text-sm text-muted-foreground">Gold to green — revenue growth</p>
            <p className="text-xs font-mono text-muted-foreground">from-[#ffb017] to-[#17d4a8]</p>
          </div>

          {/* Hot Pink → Orange */}
          <div className="space-y-2">
            <div className="h-40 rounded-lg shadow-md bg-gradient-to-r from-[#ff1768] to-[#ff8c17]" />
            <p className="font-medium">Hot Pink → Orange</p>
            <p className="text-sm text-muted-foreground">Reverse sunset — distinct, modern</p>
            <p className="text-xs font-mono text-muted-foreground">from-[#ff1768] to-[#ff8c17]</p>
          </div>

          {/* Crimson → Amber */}
          <div className="space-y-2">
            <div className="h-40 rounded-lg shadow-md bg-gradient-to-r from-[#e6173a] to-[#ffaa17]" />
            <p className="font-medium">Crimson → Amber</p>
            <p className="text-sm text-muted-foreground">Deep fire — premium feel</p>
            <p className="text-xs font-mono text-muted-foreground">from-[#e6173a] to-[#ffaa17]</p>
          </div>

          {/* Tangerine → Rose */}
          <div className="space-y-2">
            <div className="h-40 rounded-lg shadow-md bg-gradient-to-r from-[#ff8517] to-[#f7264a]" />
            <p className="font-medium">Tangerine → Rose</p>
            <p className="text-sm text-muted-foreground">Warm to bold — the classic nudge</p>
            <p className="text-xs font-mono text-muted-foreground">from-[#ff8517] to-[#f7264a]</p>
          </div>

          {/* Vermillion → Fuchsia */}
          <div className="space-y-2">
            <div className="h-40 rounded-lg shadow-md bg-gradient-to-r from-[#ff4517] to-[#d917ff]" />
            <p className="font-medium">Vermillion → Fuchsia</p>
            <p className="text-sm text-muted-foreground">Fiery pop — maximum contrast</p>
            <p className="text-xs font-mono text-muted-foreground">from-[#ff4517] to-[#d917ff]</p>
          </div>

          {/* Orange → Blue */}
          <div className="space-y-2">
            <div className="h-40 rounded-lg shadow-md bg-gradient-to-r from-[#ff6b17] to-[#1762f7]" />
            <p className="font-medium">Orange → Blue</p>
            <p className="text-sm text-muted-foreground">Warm to cool — high contrast, energetic</p>
            <p className="text-xs font-mono text-muted-foreground">from-[#ff6b17] to-[#1762f7]</p>
          </div>

          {/* Coral → Navy */}
          <div className="space-y-2">
            <div className="h-40 rounded-lg shadow-md bg-gradient-to-r from-[#ff4757] to-[#1738f7]" />
            <p className="font-medium">Coral → Navy</p>
            <p className="text-sm text-muted-foreground">Bold coral meets deep blue</p>
            <p className="text-xs font-mono text-muted-foreground">from-[#ff4757] to-[#1738f7]</p>
          </div>

          {/* Hot Pink → Blue */}
          <div className="space-y-2">
            <div className="h-40 rounded-lg shadow-md bg-gradient-to-r from-[#ff1768] to-[#2631f7]" />
            <p className="font-medium">Hot Pink → Blue</p>
            <p className="text-sm text-muted-foreground">Pink to blue — modern SaaS</p>
            <p className="text-xs font-mono text-muted-foreground">from-[#ff1768] to-[#2631f7]</p>
          </div>

          {/* Red → Blue */}
          <div className="space-y-2">
            <div className="h-40 rounded-lg shadow-md bg-gradient-to-r from-[#f72631] to-[#1755f7]" />
            <p className="font-medium">Red → Blue</p>
            <p className="text-sm text-muted-foreground">Classic power gradient — trust + action</p>
            <p className="text-xs font-mono text-muted-foreground">from-[#f72631] to-[#1755f7]</p>
          </div>

          {/* Gold → Blue */}
          <div className="space-y-2">
            <div className="h-40 rounded-lg shadow-md bg-gradient-to-r from-[#ffc517] to-[#1748f7]" />
            <p className="font-medium">Gold → Blue</p>
            <p className="text-sm text-muted-foreground">Premium gold to deep blue — trust, commerce</p>
            <p className="text-xs font-mono text-muted-foreground">from-[#ffc517] to-[#1748f7]</p>
          </div>

          {/* Cyan → Blue */}
          <div className="space-y-2">
            <div className="h-40 rounded-lg shadow-md bg-gradient-to-r from-[#17e5ff] to-[#2631f7]" />
            <p className="font-medium">Cyan → Blue</p>
            <p className="text-sm text-muted-foreground">Cool electric — clean SaaS</p>
            <p className="text-xs font-mono text-muted-foreground">from-[#17e5ff] to-[#2631f7]</p>
          </div>

          {/* Teal → Indigo */}
          <div className="space-y-2">
            <div className="h-40 rounded-lg shadow-md bg-gradient-to-r from-[#17ffc5] to-[#3117f7]" />
            <p className="font-medium">Teal → Indigo</p>
            <p className="text-sm text-muted-foreground">Fresh teal to deep indigo</p>
            <p className="text-xs font-mono text-muted-foreground">from-[#17ffc5] to-[#3117f7]</p>
          </div>

          {/* Orange → Indigo */}
          <div className="space-y-2">
            <div className="h-40 rounded-lg shadow-md bg-gradient-to-r from-[#ff8517] to-[#4817f7]" />
            <p className="font-medium">Orange → Indigo</p>
            <p className="text-sm text-muted-foreground">Warm to deep — sunset to night</p>
            <p className="text-xs font-mono text-muted-foreground">from-[#ff8517] to-[#4817f7]</p>
          </div>

          {/* Peach → Sky Blue */}
          <div className="space-y-2">
            <div className="h-40 rounded-lg shadow-md bg-gradient-to-r from-[#ff9a17] to-[#1795f7]" />
            <p className="font-medium">Peach → Sky Blue</p>
            <p className="text-sm text-muted-foreground">Warm to sky — friendly, approachable</p>
            <p className="text-xs font-mono text-muted-foreground">from-[#ff9a17] to-[#1795f7]</p>
          </div>

          {/* Cyan → Blue — SELECTED */}
          <div className="space-y-2 ring-2 ring-white rounded-lg p-2">
            <div className="h-40 rounded-lg shadow-md bg-gradient-to-r from-[#17FFFD] to-[#2631f7]" />
            <p className="font-medium">Cyan → Blue ✓ SELECTED</p>
            <p className="text-sm text-muted-foreground">Fresh cyan to bold blue</p>
            <p className="text-xs font-mono text-muted-foreground">from-[#17FFFD] to-[#2631f7]</p>
          </div>

          {/* Dark Teal → Blue */}
          <div className="space-y-2">
            <div className="h-40 rounded-lg shadow-md bg-gradient-to-r from-[#17d4a8] to-[#2631f7]" />
            <p className="font-medium">Dark Teal → Blue</p>
            <p className="text-sm text-muted-foreground">Deeper teal to blue — professional</p>
            <p className="text-xs font-mono text-muted-foreground">from-[#17d4a8] to-[#2631f7]</p>
          </div>

          {/* Teal → Navy */}
          <div className="space-y-2">
            <div className="h-40 rounded-lg shadow-md bg-gradient-to-r from-[#17e0c5] to-[#1738f7]" />
            <p className="font-medium">Teal → Navy</p>
            <p className="text-sm text-muted-foreground">Aqua teal to deep navy</p>
            <p className="text-xs font-mono text-muted-foreground">from-[#17e0c5] to-[#1738f7]</p>
          </div>

        </div>
      </div>
    </div>
  );
}
