/* ═══════════════════════════
   PM English — scenarios.js
   Scenario CRUD + AI generate
   ═══════════════════════════ */

/* Runtime scenario list (populated after MD load) */
// SCENARIOS defined in data.js

const ROLES = {
  pm:     { label: 'PM',  dot: '#2176c7', avBg: '#b8d8f8', avColor: '#042C53' },
  dev:    { label: 'Dev', dot: '#3b8a16', avBg: '#bfe0a0', avColor: '#173404' },
  client: { label: 'CL',  dot: '#c47d18', avBg: '#f5d49a', avColor: '#412402' },
};
window.ROLES = ROLES;

const LEVEL_S = {
  Beginner:     { color: '#3b6d11', bg: '#edf7e3', border: 'rgba(59,109,17,.2)' },
  Intermediate: { color: '#1a65ad', bg: '#deeeff', border: 'rgba(26,101,173,.2)' },
  Advanced:     { color: '#a32d2d', bg: '#fde8e8', border: 'rgba(163,45,45,.2)' },
};

let activeVocab = new Set();
let modalLines = [];
let aiGeneratedData = null;

/* ── Sidebar ── */
function renderSidebar() {
  const total = SCENARIOS.length;
  document.getElementById('sc-pill').textContent = total + ' scenarios';

  const groupedIds = new Set(GROUPS.map(g => g.id));
  const ungrouped = SCENARIOS.filter(s => !s.groupId || !groupedIds.has(s.groupId));

  let html = '';
  GROUPS.forEach(g => {
    const items = SCENARIOS.filter(s => s.groupId === g.id);
    if (!items.length) return;
    const isOpen = items.some(s => s.id === window._currentScenario?.id);
    html += `<div class="sb-group">
      <div class="sb-group-hd" onclick="toggleGroup('grp-${g.id}')">
        <span class="sb-group-label"><span class="sb-group-ico">${g.icon}</span>${g.label} <span style="font-size:10px;color:var(--text3);font-weight:400">(${items.length})</span></span>
        <span class="sb-group-arrow ${isOpen ? 'open' : ''}" id="arrow-grp-${g.id}">▶</span>
      </div>
      <div class="sb-group-items ${isOpen ? 'open' : ''}" id="grp-${g.id}">
        ${items.map(s => sbItem(s)).join('')}
      </div>
    </div>`;
  });

  if (ungrouped.length) {
    html += `<div class="sb-hd" style="margin-top:4px">Other</div>`;
    html += ungrouped.map(s => sbItem(s)).join('');
  }

  document.getElementById('scenario-list').innerHTML = html;
}

function sbItem(s) {
  return `<div class="sb-item ${window._currentScenario?.id === s.id ? 'on' : ''}" onclick="loadScenario('${s.id}')">
    <div class="sb-ico" style="background:${s.iconBg}">${s.icon}</div>
    <div>
      <div class="sb-name">${s.title}</div>
      <div class="sb-sub">${s.sub}</div>
    </div>
  </div>`;
}

function toggleGroup(id) {
  const el = document.getElementById(id);
  const arrow = document.getElementById('arrow-' + id);
  if (!el) return;
  el.classList.toggle('open');
  arrow && arrow.classList.toggle('open');
}

/* ── Load & render scenario ── */
function loadScenario(id) {
  stopAudio();
  activeVocab = new Set();
  window._currentScenario = SCENARIOS.find(s => s.id === id);
  renderSidebar();
  renderCard();
}

function renderCard() {
  const s = window._currentScenario;
  const ls = LEVEL_S[s.level] || LEVEL_S.Intermediate;
  const voiceOpts = allVoices.length
    ? allVoices.map((v, i) => `<option value="${i}">${v.name}</option>`).join('')
    : '<option value="">Default</option>';

  document.getElementById('main-col').innerHTML = `
    <div class="scard">
      <div class="scard-hd">
        <div class="scard-ico" style="background:${s.iconBg}">${s.icon}</div>
        <div class="scard-meta">
          <div class="scard-title">${s.title}</div>
          <div class="scard-sub">${s.sub}</div>
        </div>
        <span class="lvl-pill" style="background:${ls.bg};color:${ls.color};border-color:${ls.border}">${s.level}</span>
      </div>
      <div class="vocab-bar">
        <div class="vocab-bar-hd">
          <span class="vocab-bar-label">📚 Key vocabulary</span>
          <span class="vocab-bar-hint">Click to highlight · select text to save</span>
        </div>
        <div class="chips">${s.vocab.map(v => `<span class="chip ${activeVocab.has(v) ? 'on' : ''}" onclick="toggleVocab(this,'${esc(v)}')">${v}</span>`).join('')}</div>
      </div>
      <div class="script">
        <div class="dlg" id="dlg">${buildDlg(s)}</div>
      </div>
      <div class="audio-panel">
        <div class="ap-title">Voice settings</div>
        <div class="voice-grid">
          ${Object.entries(ROLES).map(([role, cfg]) => `
            <div class="vg-item">
              <div class="vg-label"><div class="vg-dot" style="background:${cfg.dot}"></div>${cfg.label}</div>
              <select class="vg-sel" id="vs-${role}" onchange="setVoice('${role}',this.value)">${voiceOpts}</select>
            </div>`).join('')}
        </div>
        <div class="speed-row">
          <label>Speed</label>
          <input type="range" min="0.5" max="1.4" step="0.05" value="${speechRate}"
            oninput="speechRate=parseFloat(this.value);document.getElementById('spd-val').textContent=speechRate.toFixed(2)+'x'">
          <span class="speed-val" id="spd-val">${speechRate.toFixed(2)}x</span>
        </div>
        <div class="audio-actions">
          <button class="btn btn-play" id="btn-play" onclick="togglePlay()">▶ Play</button>
          <button class="btn btn-dl" id="btn-dl" onclick="downloadMp3()" disabled>⬇ Download MP3</button>
          <div class="prog-wrap">
            <div class="prog-bar"><div class="prog-fill" id="pfill"></div></div>
            <div class="prog-status" id="pstatus">Press ▶ to listen</div>
          </div>
        </div>
      </div>
    </div>
    <div class="tip-box">💡 <strong>PM tip:</strong> ${s.tip}</div>
    <div id="fc-anchor"></div>`;

  setTimeout(() => { refreshVoices(); renderFC(); }, 80);
}

/* ── Dialogue ── */
function buildDlg(s) {
  return s.lines.map((l, i) => {
    const cfg = ROLES[l.role] || ROLES.pm;
    const txt = hlText(l.text, activeVocab);
    const muted = l.muted === true;
    const mutedStyle = muted ? 'style="opacity:.45"' : '';
    const btnColor = cfg.dot;
    return `<div class="dline ${l.role === 'dev' ? 'r' : ''}" ${mutedStyle}>
      <div class="dav" style="background:${cfg.avBg};color:${cfg.avColor}">${cfg.label}</div>
      <div class="dbub ${l.role}">
        <div class="dspk">${l.speaker}</div>
        ${txt}
        <div class="dline-audio">
          <button class="dline-audio-btn ${muted ? 'muted' : ''}" style="border-color:${btnColor}40;color:${btnColor}"
            onclick="toggleLineMute(${i})" title="${muted ? 'Unmute' : 'Mute'} this line">
            ${muted ? '🔇' : '🔊'} ${l.speaker.split(' ')[0]}
          </button>
          <button class="dline-audio-btn" style="border-color:${btnColor}40;color:${btnColor}"
            onclick="playLine(${i})" title="Play this line only">▶</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function hlText(text, vocab) {
  if (!vocab.size) return text;
  let r = text;
  vocab.forEach(v => {
    r = r.replace(new RegExp(`(${v.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')})`, 'gi'), '<mark class="hl">$1</mark>');
  });
  return r;
}

function toggleVocab(el, word) {
  if (activeVocab.has(word)) { activeVocab.delete(word); el.classList.remove('on'); }
  else { activeVocab.add(word); el.classList.add('on'); }
  document.getElementById('dlg').innerHTML = buildDlg(window._currentScenario);
}

function toggleLineMute(idx) {
  window._currentScenario.lines[idx].muted = !window._currentScenario.lines[idx].muted;
  document.getElementById('dlg').innerHTML = buildDlg(window._currentScenario);
}

/* ── Text selection → save popup ── */
function setupSelectionListener() {
  document.addEventListener('mouseup', e => {
    const popup = document.getElementById('save-popup');
    if (popup.contains(e.target)) return;
    const sel = window.getSelection();
    const txt = sel?.toString().trim();
    if (!txt || txt.length < 2) { popup.classList.remove('vis'); return; }
    const node = sel.anchorNode?.parentElement;
    if (!node?.closest('.dlg')) { popup.classList.remove('vis'); return; }
    const range = sel.getRangeAt(0), rect = range.getBoundingClientRect();
    popup.style.top = (rect.bottom + window.scrollY + 6) + 'px';
    popup.style.left = Math.max(8, rect.left + window.scrollX - 10) + 'px';
    popup.classList.add('vis');
    const bubble = node.closest('.dbub');
    pendingCtx = bubble ? bubble.innerText.replace(/^[A-Z]{2,}\n/, '').trim() : '';
    pendingWord = txt;
    document.getElementById('sp-save-btn').onclick = () => { popup.classList.remove('vis'); openWordModal(txt, pendingCtx); };
    document.getElementById('sp-look-btn').onclick = () => { popup.classList.remove('vis'); openWordModal(txt, pendingCtx, true); };
  });
  document.addEventListener('mousedown', e => {
    if (!document.getElementById('save-popup').contains(e.target))
      document.getElementById('save-popup').classList.remove('vis');
  });
}

/* ── Add Scenario Modal (manual) ── */
function openAddModal() {
  modalLines = [{ speaker: 'PM', role: 'pm', text: '' }, { speaker: 'Client', role: 'client', text: '' }];
  renderModalLines();
  populateGroupSelects();
  document.getElementById('add-modal').classList.add('vis');
}
function closeAddModal() { document.getElementById('add-modal').classList.remove('vis'); }

function populateGroupSelects() {
  const opts = `<option value="">— No group —</option>` + GROUPS.map(g => `<option value="${g.id}">${g.label}</option>`).join('');
  const selAM = document.getElementById('m-group');
  const selAI = document.getElementById('ai-group');
  if (selAM) selAM.innerHTML = opts;
  if (selAI) selAI.innerHTML = opts;
}

function renderModalLines() {
  document.getElementById('m-lines').innerHTML = modalLines.map((l, i) => `
    <div class="line-block">
      <button class="rm-btn" onclick="removeModalLine(${i})">✕</button>
      <div class="row2">
        <div><div class="fl">Speaker</div><input class="fi" value="${l.speaker}" oninput="modalLines[${i}].speaker=this.value" placeholder="PM"></div>
        <div><div class="fl">Role</div><select class="fi" onchange="modalLines[${i}].role=this.value">
          <option value="pm" ${l.role === 'pm' ? 'selected' : ''}>PM</option>
          <option value="dev" ${l.role === 'dev' ? 'selected' : ''}>Dev Lead</option>
          <option value="client" ${l.role === 'client' ? 'selected' : ''}>Client</option>
        </select></div>
      </div>
      <div><div class="fl">Line (English)</div><textarea class="fi" oninput="modalLines[${i}].text=this.value" placeholder="Enter English dialogue…">${l.text}</textarea></div>
    </div>`).join('');
}
function addModalLine() { modalLines.push({ speaker: 'PM', role: 'pm', text: '' }); renderModalLines(); }
function removeModalLine(i) { modalLines.splice(i, 1); renderModalLines(); }

function resolveGroup(selId, newgroupId) {
  const selVal = document.getElementById(selId)?.value;
  const newVal = document.getElementById(newgroupId)?.value.trim();
  if (newVal) {
    const existing = GROUPS.find(g => g.label.toLowerCase() === newVal.toLowerCase());
    if (existing) return existing.id;
    const newId = 'g' + Date.now();
    GROUPS.push({ id: newId, label: newVal, icon: '📁' });
    return newId;
  }
  return selVal || null;
}

function saveManualScenario() {
  const title = document.getElementById('m-title').value.trim();
  if (!title) { alert('Please enter a title.'); return; }
  const lines = modalLines.filter(l => l.text.trim()).map(l => ({ ...l, muted: false }));
  if (!lines.length) { alert('Please add at least one line.'); return; }
  const vocab = (document.getElementById('m-vocab').value || '').split(',').map(v => v.trim()).filter(Boolean);
  const level = document.getElementById('m-level').value;
  const ls = LEVEL_S[level] || LEVEL_S.Intermediate;
  const icon = document.getElementById('m-icon').value.trim() || '📝';
  const sub = document.getElementById('m-sub').value.trim() || '';
  const tip = document.getElementById('m-tip').value.trim() || 'Practice this scenario regularly.';
  const iconBg = { Beginner: '#edf7e3', Intermediate: '#deeeff', Advanced: '#fde8e8' }[level] || '#deeeff';
  const groupId = resolveGroup('m-group', 'm-newgroup');
  SCENARIOS.push({ id: 'c' + Date.now(), groupId, title, sub, icon, iconBg, level, levelColor: ls.color, levelBg: ls.bg, vocab, lines, tip });
  closeAddModal(); renderSidebar(); loadScenario(SCENARIOS[SCENARIOS.length - 1].id);
}

/* ── AI Generate Scenario ── */
function openAiModal() {
  populateGroupSelects();
  document.getElementById('ai-prompt').value = '';
  document.getElementById('ai-status').classList.remove('vis');
  document.getElementById('ai-preview').classList.remove('vis');
  document.getElementById('ai-save-btn').style.display = 'none';
  document.getElementById('ai-gen-btn').style.display = 'inline-flex';
  document.getElementById('ai-spinner').style.display = 'none';
  aiGeneratedData = null;
  document.getElementById('ai-modal').classList.add('vis');
}
function closeAiModal() { document.getElementById('ai-modal').classList.remove('vis'); aiGeneratedData = null; }

async function generateAiScenario() {
  const prompt = document.getElementById('ai-prompt').value.trim();
  if (!prompt) { alert('Please describe the situation first.'); return; }
  const level = document.getElementById('ai-level').value;
  const numLines = parseInt(document.getElementById('ai-lines').value, 10);

  const genBtn = document.getElementById('ai-gen-btn');
  const spinner = document.getElementById('ai-spinner');
  const status = document.getElementById('ai-status');
  const preview = document.getElementById('ai-preview');

  genBtn.disabled = true; spinner.style.display = 'inline-block';
  status.textContent = 'Generating dialogue with AI…'; status.classList.add('vis');
  preview.classList.remove('vis');
  document.getElementById('ai-save-btn').style.display = 'none';

  const systemPrompt = `You are a business English content creator for project managers.
Generate a realistic workplace dialogue scenario based on the user's description.
Reply ONLY with a valid JSON object — no markdown, no preamble, no explanation.
JSON structure:
{
  "title": "short English title",
  "sub": "one-line English subtitle",
  "icon": "single emoji",
  "level": "${level}",
  "vocab": ["word1","word2","word3","word4","word5","word6"],
  "tip": "one concise PM language tip using <strong> tags for key phrases",
  "lines": [
    {"speaker":"PM","role":"pm","text":"..."},
    {"speaker":"Client","role":"client","text":"..."}
  ]
}
Rules:
- Exactly ${numLines} lines in the dialogue
- roles must be one of: pm, dev, client
- vocab: 6-10 key business/PM phrases from the dialogue
- All dialogue must be natural, professional English at ${level} level
- tip must reference specific phrases from the dialogue`;

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await resp.json();
    const raw = data.content?.find(c => c.type === 'text')?.text || '';
    const clean = raw.replace(/```json|```/g, '').trim();
    aiGeneratedData = JSON.parse(clean);
    aiGeneratedData.lines = aiGeneratedData.lines.map(l => ({ ...l, muted: false }));

    const previewText = `Title: ${aiGeneratedData.title}\nSubtitle: ${aiGeneratedData.sub}\nLevel: ${aiGeneratedData.level}\n\nDIALOGUE:\n${aiGeneratedData.lines.map(l => `[${l.speaker}] ${l.text}`).join('\n\n')}\n\nVOCABULARY: ${aiGeneratedData.vocab.join(', ')}\n\nTIP: ${aiGeneratedData.tip.replace(/<[^>]*>/g, '')}`;
    preview.textContent = previewText;
    preview.classList.add('vis');
    status.textContent = '✓ Dialogue generated — review and save.';
    document.getElementById('ai-save-btn').style.display = 'inline-flex';
  } catch (e) {
    status.textContent = '❌ Generation failed. Check your connection and try again.';
    console.error(e);
  } finally {
    genBtn.disabled = false; spinner.style.display = 'none';
  }
}

function saveAiScenario() {
  if (!aiGeneratedData) return;
  const level = aiGeneratedData.level || 'Intermediate';
  const ls = LEVEL_S[level] || LEVEL_S.Intermediate;
  const iconBg = { Beginner: '#edf7e3', Intermediate: '#deeeff', Advanced: '#fde8e8' }[level] || '#deeeff';
  const groupId = resolveGroup('ai-group', 'ai-newgroup');
  SCENARIOS.push({
    id: 'ai' + Date.now(), groupId,
    title: aiGeneratedData.title, sub: aiGeneratedData.sub,
    icon: aiGeneratedData.icon || '🤖', iconBg,
    level, levelColor: ls.color, levelBg: ls.bg,
    vocab: aiGeneratedData.vocab || [], lines: aiGeneratedData.lines, tip: aiGeneratedData.tip || ''
  });
  closeAiModal(); renderSidebar(); loadScenario(SCENARIOS[SCENARIOS.length - 1].id);
}

/* ── Helpers ── */
function esc(s) { return s.replace(/'/g, "\\'"); }
