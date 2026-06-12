// js/data.js
const GROUPS = [
  { id: 'pm-core', label: 'PM Essentials', icon: '📋' },
  { id: 'technical', label: 'Technical', icon: '🔧' },
  { id: 'stakeholder', label: 'Stakeholder Mgmt', icon: '🤝' },
];

const LEVEL_STYLES = {
  Beginner:     { color: '#3b6d11', bg: '#edf7e3', border: 'rgba(59,109,17,.2)' },
  Intermediate: { color: '#1a65ad', bg: '#deeeff', border: 'rgba(26,101,173,.2)' },
  Advanced:     { color: '#a32d2d', bg: '#fde8e8', border: 'rgba(163,45,45,.2)' },
};

let SCENARIOS = [];

function normalizeScenario(s) {
  s.lines = s.lines.map(l => ({ muted: false, ...l }));
  const ls = LEVEL_STYLES[s.level] || LEVEL_STYLES.Intermediate;
  s.levelColor = ls.color;
  s.levelBg = ls.bg;
  return s;
}

// Danh sách file .md mặc định (chỉ cần sửa khi muốn thêm scenario gốc cho người dùng mới)
const DEFAULT_SCENARIO_FILES = [
  'kickoff.md', 'status.md', 'scope.md', 'retro.md',
  'escalation.md', 'tech.md', 'discovery.md'
];

function parseMarkdownScenario(md, filename) {
  const lines = md.split(/\r?\n/);
  let frontmatter = {};
  let inFrontmatter = false;
  let contentStart = 0;
  if (lines[0] && lines[0].trim() === '---') {
    inFrontmatter = true;
    let i = 1;
    while (i < lines.length && lines[i].trim() !== '---') {
      const line = lines[i];
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) {
        const key = line.slice(0, colonIdx).trim();
        let value = line.slice(colonIdx + 1).trim();
        if (value === 'true') value = true;
        else if (value === 'false') value = false;
        else if (!isNaN(value) && value !== '') value = Number(value);
        frontmatter[key] = value;
      }
      i++;
    }
    contentStart = i + 1;
  }
  const dialogueLines = [];
  for (let i = contentStart; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const match = line.match(/^([A-Za-z\s]+?)\s*:\s*(.+)$/);
    if (match) {
      let speaker = match[1].trim();
      let text = match[2].trim();
      let role = 'pm';
      if (speaker.toLowerCase().includes('dev') || speaker.toLowerCase().includes('engineer')) role = 'dev';
      else if (speaker.toLowerCase().includes('client') || speaker.toLowerCase().includes('sponsor')) role = 'client';
      dialogueLines.push({ speaker, role, text });
    }
  }
  if (dialogueLines.length === 0) return null;
  return {
    id: filename.replace(/\.md$/, ''),
    groupId: frontmatter.group || null,
    title: frontmatter.title || filename.replace(/\.md$/, ''),
    sub: frontmatter.sub || '',
    icon: frontmatter.icon || '📄',
    iconBg: frontmatter.iconBg || '#deeeff',
    level: frontmatter.level || 'Intermediate',
    vocab: frontmatter.vocab ? frontmatter.vocab.split(',').map(v=>v.trim()) : [],
    tip: frontmatter.tip || 'Practice this dialogue.',
    lines: dialogueLines
  };
}

async function loadScenarios() {
  const saved = localStorage.getItem('be_scenarios');
  if (saved) {
    try {
      SCENARIOS.length = 0;
      JSON.parse(saved).forEach(s => SCENARIOS.push(normalizeScenario(s)));
      return SCENARIOS;
    } catch(e) {}
  }
  SCENARIOS.length = 0;
  for (const fn of DEFAULT_SCENARIO_FILES) {
    try {
      const res = await fetch(`scenarios/${fn}`);
      if (!res.ok) continue;
      const md = await res.text();
      const scenario = parseMarkdownScenario(md, fn);
      if (scenario) SCENARIOS.push(normalizeScenario(scenario));
    } catch(err) { console.warn(err); }
  }
  if (SCENARIOS.length === 0) {
    SCENARIOS.push(normalizeScenario({
      id: 'example', title: 'Sample Meeting', sub: 'Practice', icon: '📘',
      level: 'Intermediate', vocab: [], tip: '', lines: [{ speaker: 'PM', role: 'pm', text: 'Hello' }]
    }));
  }
  localStorage.setItem('be_scenarios', JSON.stringify(SCENARIOS));
  return SCENARIOS;
}

function persistScenarios() {
  localStorage.setItem('be_scenarios', JSON.stringify(SCENARIOS));
}
