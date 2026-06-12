/* ═══════════════════════════
   PM English — data.js
   Groups config + MD loader
   ═══════════════════════════ */

const GROUPS = [
  { id: 'pm-core',     label: 'PM Essentials',    icon: '📋' },
  { id: 'technical',   label: 'Technical',         icon: '🔧' },
  { id: 'stakeholder', label: 'Stakeholder Mgmt',  icon: '🤝' },
];

/* List of scenario MD files to load (order = sidebar order) */
const SCENARIO_FILES = [
  'scenarios/kickoff.md',
  'scenarios/status.md',
  'scenarios/scope.md',
  'scenarios/retro.md',
  'scenarios/escalation.md',
  'scenarios/tech.md',
  'scenarios/discovery.md',
];

/*
 * Resolve a path relative to the directory where index.html lives,
 * regardless of what subdirectory GitHub Pages serves the site from.
 *
 * Strategy: find the <script src="js/data.js"> tag — its .src is an
 * absolute URL like https://user.github.io/Business-English/js/data.js
 * Strip /js/data.js to get the site root, then append the relative path.
 */
function resolveUrl(relativePath) {
  const scripts = document.querySelectorAll('script[src]');
  let base = null;
  for (const s of scripts) {
    if (s.src && s.src.includes('/js/data.js')) {
      base = s.src.replace(/\/js\/data\.js([?#].*)?$/, '/');
      break;
    }
  }
  // Fallback: derive from current page URL (works when index.html is at root)
  if (!base) {
    base = window.location.href.replace(/\/[^/]*$/, '/');
    if (!base.endsWith('/')) base += '/';
  }
  return base + relativePath;
}

/* ── Parse front-matter + dialogue from a .md string ── */
function parseMd(text) {
  const fmMatch = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fmMatch) return null;

  const fm = {};
  fmMatch[1].split('\n').forEach(line => {
    const [key, ...rest] = line.split(':');
    if (!key) return;
    let val = rest.join(':').trim();
    // strip quotes
    val = val.replace(/^"|"$/g, '').replace(/^'|'$/g, '');
    // parse array syntax  [a, b, c]
    if (val.startsWith('[') && val.endsWith(']')) {
      val = val.slice(1, -1).split(',').map(v => v.trim().replace(/^"|"$/g, '').replace(/^'|'$/g, ''));
    }
    fm[key.trim()] = val;
  });

  // Parse dialogue lines: "Speaker | role | text"
  const lines = fmMatch[2].trim().split('\n')
    .filter(l => l.trim())
    .map(l => {
      const parts = l.split('|').map(p => p.trim());
      return { speaker: parts[0], role: parts[1], text: parts[2], muted: false };
    });

  const level = fm.level || 'Intermediate';
  const LS = {
    Beginner:     { color: '#3b6d11', bg: '#edf7e3', border: 'rgba(59,109,17,.2)' },
    Intermediate: { color: '#1a65ad', bg: '#deeeff', border: 'rgba(26,101,173,.2)' },
    Advanced:     { color: '#a32d2d', bg: '#fde8e8', border: 'rgba(163,45,45,.2)' },
  };
  const ls = LS[level] || LS.Intermediate;
  const iconBgMap = { Beginner: '#edf7e3', Intermediate: '#deeeff', Advanced: '#fde8e8' };

  return {
    id:         fm.id,
    groupId:    fm.groupId,
    title:      fm.title,
    sub:        fm.sub,
    icon:       fm.icon,
    iconBg:     fm.iconBg || iconBgMap[level] || '#deeeff',
    level,
    levelColor: ls.color,
    levelBg:    ls.bg,
    vocab:      Array.isArray(fm.vocab) ? fm.vocab : [],
    tip:        fm.tip || '',
    lines,
  };
}

/* ── Load all scenario .md files ── */
async function loadScenarios() {
  const results = await Promise.all(
    SCENARIO_FILES.map(f =>
      fetch(resolveUrl(f))
        .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
        .then(parseMd)
        .catch(e => { console.warn('Could not load', f, e.message); return null; })
    )
  );
  return results.filter(Boolean);
}
