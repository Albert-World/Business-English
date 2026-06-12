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

const SCENARIO_FILES = [
  'kickoff.md', 'status.md', 'scope.md', 'retro.md',
  'escalation.md', 'tech.md', 'discovery.md'
];

async function loadScenarios() {
  // Ưu tiên dữ liệu người dùng đã tạo từ UI (localStorage)
  const saved = localStorage.getItem('be_scenarios');
  if (saved) {
    try {
      SCENARIOS.length = 0;
      JSON.parse(saved).forEach(s => SCENARIOS.push(normalizeScenario(s)));
      console.log('Loaded from localStorage:', SCENARIOS.length);
      return SCENARIOS;
    } catch(e) { console.warn(e); }
  }

  // Chưa có thì load từ file .md
  SCENARIOS.length = 0;
  for (const fn of SCENARIO_FILES) {
    try {
      // Đường dẫn tương đối từ index.html
      const res = await fetch(`/scenarios/${fn}`);
      if (!res.ok) {
        console.warn(`Failed to fetch ${fn}: ${res.status}`);
        continue;
      }
      const md = await res.text();
      const scenario = parseMarkdownScenario(md, fn);
      if (scenario) {
        SCENARIOS.push(normalizeScenario(scenario));
        console.log(`Loaded ${fn}`);
      } else {
        console.warn(`Parse failed for ${fn}`);
      }
    } catch (err) {
      console.warn(`Error loading ${fn}:`, err);
    }
  }

  if (SCENARIOS.length === 0) {
    console.error('No .md files loaded, using hardcoded fallback');
    SCENARIOS.push(normalizeScenario({
      id: 'example', groupId: null, title: 'Example Scenario', sub: 'Demo',
      icon: '📘', iconBg: '#deeeff', level: 'Intermediate',
      vocab: ['example'], tip: 'Fallback scenario.',
      lines: [{ speaker: 'PM', role: 'pm', text: 'Hello world' }]
    }));
  } else {
    // CHỈ LƯU KHI FETCH THÀNH CÔNG (MẢNG KHÔNG TRỐNG)
    localStorage.setItem('be_scenarios', JSON.stringify(SCENARIOS));
  return SCENARIOS;
} 

function persistScenarios() {
  localStorage.setItem('be_scenarios', JSON.stringify(SCENARIOS));
}
