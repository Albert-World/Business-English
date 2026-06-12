const GROUPS = [
  { id: 'pm-core', label: 'PM Essentials', icon: '📋' },
  { id: 'technical', label: 'Technical', icon: '🔧' },
  { id: 'stakeholder', label: 'Stakeholder Mgmt', icon: '🤝' },
];

const SCENARIOS = [
  {
    id: 'kickoff', groupId: 'pm-core',
    title: 'Project Kickoff Meeting', sub: 'Initiate the project',
    icon: '🚀', iconBg: '#deeeff', level: 'Intermediate',
    vocab: ['stakeholder','deliverable','milestone','scope','timeline','alignment','kick off','go-live','sign-off'],
    tip: 'Use <strong>"walk you through"</strong> to guide stakeholders confidently.',
    lines: [
      { speaker: 'PM', role: 'pm', text: "Good morning, everyone. Thank you for joining today's kickoff meeting. I'm Alex, the project manager, and I'm excited to officially kick off the new CRM implementation project." },
      { speaker: 'Client', role: 'client', text: "Thanks for organizing this, Alex. Our team is very much looking forward to the go-live date in Q3." },
      { speaker: 'PM', role: 'pm', text: "Absolutely. Let me walk you through the key milestones. We'll start with requirements gathering in weeks one and two, followed by system design in week three. Does that timeline work for all stakeholders?" },
      { speaker: 'Dev Lead', role: 'dev', text: "From the engineering side, we'll need final sign-off on the scope before we begin sprint planning. Can we confirm the deliverables list by Friday?" },
      { speaker: 'PM', role: 'pm', text: "Great point. I'll circulate the deliverables document by end of day Thursday so we're all in alignment before the weekend." },
    ],
  },
  {
    id: 'status', groupId: 'pm-core',
    title: 'Weekly Status Update', sub: 'Weekly progress report',
    icon: '📊', iconBg: '#edf7e3', level: 'Beginner',
    vocab: ['on track','at risk','blocker','action item','bandwidth','velocity','stand-up','ETA','escalate'],
    tip: '<strong>"Flag"</strong> = raise an issue politely. <strong>"At risk"</strong> is the professional way to say something might be late.',
    lines: [
      { speaker: 'PM', role: 'pm', text: "Let's get started with the weekly status update. Sprint 4 is currently on track — we've completed 18 out of 22 story points." },
      { speaker: 'Dev Lead', role: 'dev', text: "I do want to flag one blocker. The API integration is at risk because we're still waiting on credentials from the third-party vendor." },
      { speaker: 'PM', role: 'pm', text: "Okay, that's a concern. I'll escalate that to the client today." },
      { speaker: 'Dev Lead', role: 'dev', text: "We can do that, but I want to be transparent — we're running low on bandwidth this week." },
      { speaker: 'PM', role: 'pm', text: "Understood. Let's add it as an action item." },
    ],
  },
  {
    id: 'scope', groupId: 'pm-core',
    title: 'Scope Change Request', sub: 'Handling scope changes',
    icon: '🔄', iconBg: '#fef4e4', level: 'Advanced',
    vocab: ['change request','impact assessment','trade-off','sign-off','out of scope','budget','dependencies'],
    tip: '<strong>"To be transparent"</strong> softens difficult news professionally.',
    lines: [
      { speaker: 'Client', role: 'client', text: "Hi Alex, we'd like to add a mobile app feature." },
      { speaker: 'PM', role: 'pm', text: "I appreciate you raising this. To be transparent, adding a mobile app is currently out of scope and would require a formal change request." },
      { speaker: 'Client', role: 'client', text: "We understand there might be trade-offs." },
      { speaker: 'PM', role: 'pm', text: "Adding this feature would impact the timeline by at least four weeks. I'll prepare an impact assessment." },
      { speaker: 'Client', role: 'client', text: "That's fair. Let's review the assessment together." },
    ],
  },
  {
    id: 'retro', groupId: 'pm-core',
    title: 'Sprint Retrospective', sub: 'Agile process improvement',
    icon: '🔍', iconBg: '#fce8f0', level: 'Intermediate',
    vocab: ['went well','retrospective','iterate','constructive','commitment','celebrate','safe space','candid'],
    tip: 'Open with <strong>"safe space"</strong> and <strong>"be candid"</strong> to lower defenses.',
    lines: [
      { speaker: 'PM', role: 'pm', text: "Welcome to our sprint retrospective. This is a safe space, so please be candid." },
      { speaker: 'Dev Lead', role: 'dev', text: "The deployment process was much smoother — the new CI/CD pipeline really paid off." },
      { speaker: 'PM', role: 'pm', text: "Absolutely, well done everyone. Now, what could we improve?" },
      { speaker: 'Dev Lead', role: 'dev', text: "Communication between the front-end and back-end teams broke down mid-sprint." },
      { speaker: 'PM', role: 'pm', text: "That's valuable feedback. I'll propose a daily async check-in." },
    ],
  },
  {
    id: 'escalation', groupId: 'stakeholder',
    title: 'Escalating an Issue', sub: 'Escalating to management',
    icon: '⚠️', iconBg: '#fde8e8', level: 'Advanced',
    vocab: ['escalate','critical path','executive sponsor','contingency','intervention','authorization','workaround'],
    tip: 'When escalating, always lead with <strong>problem + solution</strong>.',
    lines: [
      { speaker: 'PM', role: 'pm', text: "Hi Sarah, I need to escalate a critical issue. The payment gateway integration is blocking our go-live." },
      { speaker: 'Sponsor', role: 'client', text: "How serious is this?" },
      { speaker: 'PM', role: 'pm', text: "Without intervention, we're looking at a 3-week delay. I've prepared a contingency plan." },
      { speaker: 'Sponsor', role: 'client', text: "What do you need from me as the executive sponsor?" },
      { speaker: 'PM', role: 'pm', text: "I need your authorization to bring in an external vendor. Can we meet this afternoon?" },
    ],
  },
  {
    id: 'discovery', groupId: 'stakeholder',
    title: 'Discovery & Requirements', sub: 'Requirements discovery',
    icon: '🔬', iconBg: '#e3f6f0', level: 'Intermediate',
    vocab: ['pain point','user story','acceptance criteria','prioritize','as-is','to-be','use case','assumption','validate'],
    tip: '<strong>"Let me capture that"</strong> confirms understanding in real time.',
    lines: [
      { speaker: 'PM', role: 'pm', text: "Thanks for your time. The goal is to understand your current pain points." },
      { speaker: 'Client', role: 'client', text: "Our biggest pain point is manual reporting — it takes two full days each month." },
      { speaker: 'PM', role: 'pm', text: "Let me capture that as a user story." },
      { speaker: 'Client', role: 'client', text: "Exactly. And we'd also want real-time dashboards." },
      { speaker: 'PM', role: 'pm', text: "Let's keep real-time dashboards in the backlog for phase two." },
    ],
  },
  {
    id: 'tech', groupId: 'technical',
    title: 'Technical Architecture Discussion', sub: 'Technical architecture',
    icon: '🔧', iconBg: '#edeaff', level: 'Advanced',
    vocab: ['architecture','scalable','latency','trade-off','microservices','monolith','bottleneck','refactor','technical debt','POC'],
    tip: '<strong>"Walk the team through"</strong> invites the tech lead to present without ceding control.',
    lines: [
      { speaker: 'PM', role: 'pm', text: "Before we finalize the architecture decision, I want to assess the trade-offs." },
      { speaker: 'Dev Lead', role: 'dev', text: "Option one is a monolithic approach — faster initially, but won't scale well beyond year two." },
      { speaker: 'PM', role: 'pm', text: "And option two?" },
      { speaker: 'Dev Lead', role: 'dev', text: "Microservices. More scalable, but we'd need a two-week POC." },
      { speaker: 'PM', role: 'pm', text: "Given our timeline, a two-week POC is feasible." },
    ],
  },
];

const LEVEL_STYLES = {
  Beginner: { color: '#3b6d11', bg: '#edf7e3', border: 'rgba(59,109,17,.2)' },
  Intermediate: { color: '#1a65ad', bg: '#deeeff', border: 'rgba(26,101,173,.2)' },
  Advanced: { color: '#a32d2d', bg: '#fde8e8', border: 'rgba(163,45,45,.2)' },
};

SCENARIOS.forEach(s => {
  s.lines = s.lines.map(l => ({ muted: false, ...l }));
  const ls = LEVEL_STYLES[s.level] || LEVEL_STYLES.Intermediate;
  s.levelColor = ls.color;
  s.levelBg = ls.bg;
});

async function loadScenarios() {
  const saved = localStorage.getItem('be_scenarios');
  if (saved) {
    try {
      SCENARIOS.length = 0;
      JSON.parse(saved).forEach(s => SCENARIOS.push(s));
    } catch(e) {}
  }
  return SCENARIOS;
}

function persistScenarios() {
  localStorage.setItem('be_scenarios', JSON.stringify(SCENARIOS));
}
