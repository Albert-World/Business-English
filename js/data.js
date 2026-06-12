// js/data.js — Business English
// Scenario data nhúng trực tiếp (không fetch .md, tránh 404 GitHub Pages)
// Custom scenarios lưu riêng trong localStorage key 'be_custom'

const GROUPS = [
  { id: 'pm-core',     label: 'PM Essentials',   icon: '📋' },
  { id: 'technical',   label: 'Technical',        icon: '🔧' },
  { id: 'stakeholder', label: 'Stakeholder Mgmt', icon: '🤝' },
];

const LEVEL_STYLES = {
  Beginner:     { color: '#3b6d11', bg: '#edf7e3', border: 'rgba(59,109,17,.2)' },
  Intermediate: { color: '#1a65ad', bg: '#deeeff', border: 'rgba(26,101,173,.2)' },
  Advanced:     { color: '#a32d2d', bg: '#fde8e8', border: 'rgba(163,45,45,.2)' },
};

// ── Built-in scenarios (từ các file .md, nhúng thẳng vào đây) ──
const BUILTIN = [
  {
    id: 'kickoff', groupId: 'pm-core',
    title: 'Project Kickoff Meeting', sub: 'Initiate the project',
    icon: '🚀', iconBg: '#deeeff', level: 'Intermediate',
    vocab: ['stakeholder','deliverable','milestone','scope','timeline','alignment','kick off','go-live','sign-off'],
    tip: 'Use <strong>"walk you through"</strong> to guide stakeholders confidently. <strong>"In alignment"</strong> signals shared agreement without being confrontational.',
    lines: [
      { speaker:'PM',       role:'pm',     text:"Good morning, everyone. Thank you for joining today's kickoff meeting. I'm Alex, the project manager, and I'm excited to officially kick off the new CRM implementation project." },
      { speaker:'Client',   role:'client', text:"Thanks for organizing this, Alex. Our team is very much looking forward to the go-live date in Q3." },
      { speaker:'PM',       role:'pm',     text:"Absolutely. Let me walk you through the key milestones. We'll start with requirements gathering in weeks one and two, followed by system design in week three. Does that timeline work for all stakeholders?" },
      { speaker:'Dev Lead', role:'dev',    text:"From the engineering side, we'll need final sign-off on the scope before we begin sprint planning. Can we confirm the deliverables list by Friday?" },
      { speaker:'PM',       role:'pm',     text:"Great point. I'll circulate the deliverables document by end of day Thursday so we're all in alignment before the weekend." },
    ],
  },
  {
    id: 'status', groupId: 'pm-core',
    title: 'Weekly Status Update', sub: 'Weekly progress report',
    icon: '📊', iconBg: '#edf7e3', level: 'Beginner',
    vocab: ['on track','at risk','blocker','action item','bandwidth','velocity','stand-up','ETA','escalate'],
    tip: '<strong>"Flag"</strong> = raise an issue politely. <strong>"At risk"</strong> is the professional way to say something might be late. Always pair a problem with an <strong>action item</strong> and an owner.',
    lines: [
      { speaker:'PM',       role:'pm',  text:"Let's get started with the weekly status update. Sprint 4 is currently on track — we've completed 18 out of 22 story points." },
      { speaker:'Dev Lead', role:'dev', text:"I do want to flag one blocker. The API integration is at risk because we're still waiting on credentials from the third-party vendor. ETA from their side is unclear." },
      { speaker:'PM',       role:'pm',  text:"Okay, that's a concern. I'll escalate that to the client today. In the meantime, can your team pick up the front-end tasks to maintain velocity?" },
      { speaker:'Dev Lead', role:'dev', text:"We can do that, but I want to be transparent — we're running low on bandwidth this week with two engineers out sick." },
      { speaker:'PM',       role:'pm',  text:"Understood. Let's add it as an action item: I'll coordinate with the vendor and reassess resourcing by tomorrow's stand-up." },
    ],
  },
  {
    id: 'scope', groupId: 'pm-core',
    title: 'Scope Change Request', sub: 'Handling scope changes',
    icon: '🔄', iconBg: '#fef4e4', level: 'Advanced',
    vocab: ['change request','impact assessment','trade-off','sign-off','out of scope','budget','dependencies','pushback'],
    tip: '<strong>"To be transparent"</strong> softens difficult news professionally. Always arrive with <strong>problem + solution</strong> — never just the problem.',
    lines: [
      { speaker:'Client', role:'client', text:"Hi Alex, we'd like to add a mobile app feature to the current project. Our marketing team feels it's essential for the launch." },
      { speaker:'PM',     role:'pm',     text:"I appreciate you raising this. To be transparent, adding a mobile app is currently out of scope and would require a formal change request. Can I walk you through the impact?" },
      { speaker:'Client', role:'client', text:"Of course. We understand there might be trade-offs, but we're hoping it can be done within the existing budget." },
      { speaker:'PM',     role:'pm',     text:"I'll be honest — adding this feature would impact the timeline by at least four weeks and introduce new dependencies in the back-end architecture. I'll prepare an impact assessment by Wednesday for your sign-off." },
      { speaker:'Client', role:'client', text:"That's fair. We may need to push back the go-live date slightly. Let's review the assessment together before making a decision." },
    ],
  },
  {
    id: 'retro', groupId: 'pm-core',
    title: 'Sprint Retrospective', sub: 'Agile process improvement',
    icon: '🔍', iconBg: '#fce8f0', level: 'Intermediate',
    vocab: ['went well','retrospective','iterate','constructive','commitment','celebrate','safe space','candid','handoff'],
    tip: 'Open with <strong>"safe space"</strong> and <strong>"be candid"</strong> to lower defenses. End every retro with a concrete <strong>commitment</strong> — without it, nothing actually improves.',
    lines: [
      { speaker:'PM',       role:'pm',  text:"Welcome to our sprint retrospective. This is a safe space, so please be candid. Let's start with what went well this sprint." },
      { speaker:'Dev Lead', role:'dev', text:"The deployment process was much smoother — the new CI/CD pipeline really paid off. We should celebrate that as a team." },
      { speaker:'PM',       role:'pm',  text:"Absolutely, well done everyone. Now, what could we improve? Be constructive — we're here to iterate, not to blame." },
      { speaker:'Dev Lead', role:'dev', text:"Honestly, communication between the front-end and back-end teams broke down mid-sprint. We need a better handoff process." },
      { speaker:'PM',       role:'pm',  text:"That's valuable feedback. I'll propose a daily async check-in between both teams. Can everyone commit to trialing this next sprint?" },
    ],
  },
  {
    id: 'escalation', groupId: 'stakeholder',
    title: 'Escalating an Issue', sub: 'Escalating to management',
    icon: '⚠️', iconBg: '#fde8e8', level: 'Advanced',
    vocab: ['escalate','critical path','executive sponsor','contingency','intervention','authorization','workaround'],
    tip: 'When escalating, always lead with <strong>problem + solution</strong>. <strong>"Without intervention"</strong> creates urgency without panic. Be explicit about what you need from the executive.',
    lines: [
      { speaker:'PM',      role:'pm',     text:"Hi Sarah, I need to escalate a critical issue with you. The payment gateway integration is blocking our go-live, and it's now on the critical path." },
      { speaker:'Sponsor', role:'client', text:"How serious is this? Are we looking at a significant delay?" },
      { speaker:'PM',      role:'pm',     text:"Without intervention, we're looking at a 3-week delay. I've prepared a contingency plan — we can go live with a manual payment workaround while the integration is resolved." },
      { speaker:'Sponsor', role:'client', text:"What do you need from me as the executive sponsor to unblock this?" },
      { speaker:'PM',      role:'pm',     text:"I need your authorization to bring in an external vendor. I've identified two options with cost and timeline estimates ready for your review. Can we meet for 30 minutes this afternoon?" },
    ],
  },
  {
    id: 'discovery', groupId: 'stakeholder',
    title: 'Discovery & Requirements', sub: 'Requirements discovery',
    icon: '🔬', iconBg: '#e3f6f0', level: 'Intermediate',
    vocab: ['pain point','user story','acceptance criteria','prioritize','as-is','to-be','use case','assumption','validate','backlog'],
    tip: '<strong>"Let me capture that"</strong> confirms understanding in real time. <strong>"Validate our assumptions"</strong> shows careful thinking. Always turn pain points into user stories — it keeps scope concrete.',
    lines: [
      { speaker:'PM',     role:'pm',     text:"Thanks for your time today. The goal of this discovery session is to understand your current pain points and validate our assumptions before we begin design." },
      { speaker:'Client', role:'client', text:"Appreciate that. Our biggest pain point right now is manual reporting — it takes the team two full days each month to compile the numbers." },
      { speaker:'PM',     role:'pm',     text:"That's a clear use case. Let me capture that as a user story: as a finance manager, I want automated monthly reports so that I can save two days of manual effort. Does that capture it correctly?" },
      { speaker:'Client', role:'client', text:"Exactly. And ideally, we'd also want to prioritize real-time dashboards — though I understand that might be out of scope for phase one." },
      { speaker:'PM',     role:'pm',     text:"Good instinct. Let's keep real-time dashboards in the backlog and validate the automated reporting as our phase one acceptance criteria. We'll map the as-is process next to confirm our assumptions." },
    ],
  },
  {
    id: 'tech', groupId: 'technical',
    title: 'Technical Architecture Discussion', sub: 'Technical architecture',
    icon: '🔧', iconBg: '#edeaff', level: 'Advanced',
    vocab: ['architecture','scalable','latency','trade-off','microservices','monolith','bottleneck','refactor','technical debt','POC'],
    tip: '<strong>"Walk the team through"</strong> invites the tech lead to present without ceding control. Using <strong>"trade-offs"</strong> signals you understand both sides — critical for PM credibility with engineers.',
    lines: [
      { speaker:'PM',       role:'pm',  text:"Before we finalize the architecture decision, I want to make sure we've assessed the trade-offs. Can you walk the team through the two main options?" },
      { speaker:'Dev Lead', role:'dev', text:"Sure. Option one is a monolithic approach — faster to build initially, but it introduces technical debt and won't scale well beyond year two." },
      { speaker:'PM',       role:'pm',  text:"And option two?" },
      { speaker:'Dev Lead', role:'dev', text:"Microservices. More scalable and resilient long-term, but the upfront complexity is higher. We'd need at least a two-week POC to validate the approach before committing." },
      { speaker:'PM',       role:'pm',  text:"Given our go-live timeline, a two-week POC is feasible. What's the biggest risk — latency between services, or the deployment pipeline?" },
      { speaker:'Dev Lead', role:'dev', text:"Latency is manageable with proper caching. The real bottleneck is the CI/CD pipeline — we'd need to refactor it to handle multiple services independently." },
    ],
  },
];

// ── Runtime list (built-ins + custom) ──
let SCENARIOS = [];

function normalizeScenario(s) {
  s.lines = (s.lines || []).map(l => ({ muted: false, ...l }));
  const ls = LEVEL_STYLES[s.level] || LEVEL_STYLES.Intermediate;
  s.levelColor = ls.color;
  s.levelBg    = ls.bg;
  return s;
}

// Custom scenarios: chỉ lưu những cái user tạo, built-in không lưu
function loadCustom() {
  try { return JSON.parse(localStorage.getItem('be_custom') || '[]'); } catch { return []; }
}
function persistScenarios() {
  const custom = SCENARIOS.filter(s => s._custom);
  try { localStorage.setItem('be_custom', JSON.stringify(custom)); } catch {}
}

// Gọi 1 lần khi init — không dùng fetch, không async
function loadScenarios() {
  SCENARIOS.length = 0;
  BUILTIN.forEach(s => SCENARIOS.push(normalizeScenario({ ...s, _custom: false })));
  loadCustom().forEach(s => SCENARIOS.push(normalizeScenario({ ...s, _custom: true })));
  return SCENARIOS;
}

// Progress (đánh dấu từng dòng đã học)
function loadProgress() {
  try {
    const raw = JSON.parse(localStorage.getItem('be_progress') || '{}');
    const out = {};
    for (const [k, v] of Object.entries(raw)) out[k] = new Set(v);
    return out;
  } catch { return {}; }
}
function saveProgress(prog) {
  const out = {};
  for (const [k, v] of Object.entries(prog)) out[k] = [...v];
  try { localStorage.setItem('be_progress', JSON.stringify(out)); } catch {}
}
let lineProgress = loadProgress();

function getScenarioProgress(id) {
  const s = SCENARIOS.find(x => x.id === id);
  if (!s) return { learned: 0, total: 0, pct: 0 };
  const learned = (lineProgress[id] || new Set()).size;
  const total   = s.lines.length;
  return { learned, total, pct: total ? Math.round(learned / total * 100) : 0 };
}

function toggleLineProgress(scenarioId, lineIdx) {
  if (!lineProgress[scenarioId]) lineProgress[scenarioId] = new Set();
  const set = lineProgress[scenarioId];
  const wasComplete = set.size === SCENARIOS.find(x => x.id === scenarioId)?.lines.length;
  if (set.has(lineIdx)) set.delete(lineIdx); else set.add(lineIdx);
  saveProgress(lineProgress);
  const s   = SCENARIOS.find(x => x.id === scenarioId);
  const tot = s ? s.lines.length : 0;
  const pct = tot ? Math.round(set.size / tot * 100) : 0;
  const justCompleted = !wasComplete && set.size === tot && tot > 0;
  return { learned: set.size, total: tot, pct, justCompleted };
}

function isLineLearned(scenarioId, lineIdx) {
  return (lineProgress[scenarioId] || new Set()).has(lineIdx);
}
