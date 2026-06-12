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

// Hàm parse markdown
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

// Danh sách file .md cần đọc
const SCENARIO_FILES = [
  'kickoff.md', 'status.md', 'scope.md', 'retro.md',
  'escalation.md', 'tech.md', 'discovery.md'
];

async function loadScenarios() {
  // Ưu tiên dữ liệu trong localStorage (do người dùng tạo/sửa)
  const saved = localStorage.getItem('be_scenarios');
  if (saved) {
    try {
      SCENARIOS.length = 0;
      JSON.parse(saved).forEach(s => SCENARIOS.push(normalizeScenario(s)));
      return SCENARIOS;
    } catch(e) {}
  }

  // Chưa có thì đọc từ file .md
  SCENARIOS.length = 0;
  for (const filename of SCENARIO_FILES) {
    try {
      const res = await fetch(`./scenarios/${filename}`);
      if (!res.ok) continue;
      const md = await res.text();
      const scenario = parseMarkdownScenario(md, filename);
      if (scenario) SCENARIOS.push(normalizeScenario(scenario));
    } catch (err) {
      console.warn(`Cannot load ${filename}:`, err);
    }
  }

  // Nếu không đọc được file nào (lỗi đường dẫn hoặc chưa có file), dùng dữ liệu mặc định
  if (SCENARIOS.length === 0) {
    SCENARIOS.push(...getFallbackScenarios());
    SCENARIOS.forEach(s => normalizeScenario(s));
  }

  // Lưu vào localStorage để lần sau không cần fetch lại
  localStorage.setItem('be_scenarios', JSON.stringify(SCENARIOS));
  return SCENARIOS;
}

// Dữ liệu mặc định khi không có file .md
function getFallbackScenarios() {
  return [
    {
      id: 'kickoff', groupId: 'pm-core',
      title: 'Project Kickoff Meeting', sub: 'Initiate the project',
      icon: '🚀', iconBg: '#deeeff', level: 'Intermediate',
      vocab: ['stakeholder','deliverable','milestone','scope','timeline','alignment'],
      tip: 'Use <strong>"walk you through"</strong> to guide stakeholders.',
      lines: [
        { speaker: 'PM', role: 'pm', text: "Good morning, everyone. Let's kick off the CRM project." },
        { speaker: 'Client', role: 'client', text: "Thanks, Alex. We're excited about the go-live in Q3." },
        { speaker: 'PM', role: 'pm', text: "Let me walk you through the key milestones." },
        { speaker: 'Dev Lead', role: 'dev', text: "We need final sign-off on scope before sprint planning." },
        { speaker: 'PM', role: 'pm', text: "I'll circulate the deliverables document by Thursday." }
      ]
    },
    {
      id: 'status', groupId: 'pm-core',
      title: 'Weekly Status Update', sub: 'Weekly progress report',
      icon: '📊', iconBg: '#edf7e3', level: 'Beginner',
      vocab: ['on track','blocker','action item','bandwidth'],
      tip: 'Always flag blockers early.',
      lines: [
        { speaker: 'PM', role: 'pm', text: "Let's start with the weekly status update." },
        { speaker: 'Dev Lead', role: 'dev', text: "Sprint 4 is on track, but we have a blocker on API integration." },
        { speaker: 'PM', role: 'pm', text: "I'll escalate that to the client today." },
        { speaker: 'Dev Lead', role: 'dev', text: "We can do that, but we're low on bandwidth." },
        { speaker: 'PM', role: 'pm', text: "Let's add it as an action item." }
      ]
    }
  ];
}

function persistScenarios() {
  localStorage.setItem('be_scenarios', JSON.stringify(SCENARIOS));
}
