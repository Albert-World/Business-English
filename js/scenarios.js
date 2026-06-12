/* ═══════════════════════════════════════════════════════
   Business English — scenarios.js
   Quản lý scenario: grid, detail, edit/delete, AI generate (Gemini), 
   đánh dấu hoàn thành dòng, progress, achievement, v.v.
   ═══════════════════════════════════════════════════════ */

// ==================== CẤU HÌNH ====================
const GEMINI_API_KEY = AQ.Ab8RN6KbdCgXbro5fE0VoW85Vu8nP0oiZD-iFpUi3dcKbrKuyQ; // 👈 THAY BẰNG KEY THẬT CỦA BẠN

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

// ==================== BIẾN TOÀN CỤC ====================
let activeVocab = new Set();
let currentViewMode = 'list';       // 'list' hoặc 'detail'
let currentGroupFilter = 'all';
let scenarioCompletionMap = {};     // { scenarioId: boolean[] }
let tempManualLines = [];           // dùng trong modal tạo/sửa
let pendingWord = null, pendingCtx = null;

// ==================== COMPLETION & PROGRESS ====================
function loadCompletionData() {
  const stored = localStorage.getItem('be_scenario_progress');
  if (stored) scenarioCompletionMap = JSON.parse(stored);
  else scenarioCompletionMap = {};
  SCENARIOS.forEach(s => {
    if (!scenarioCompletionMap[s.id])
      scenarioCompletionMap[s.id] = new Array(s.lines.length).fill(false);
  });
}
function saveCompletion() {
  localStorage.setItem('be_scenario_progress', JSON.stringify(scenarioCompletionMap));
}
function getCompletionPercent(scenario) {
  const comp = scenarioCompletionMap[scenario.id] || new Array(scenario.lines.length).fill(false);
  const done = comp.filter(v => v === true).length;
  return Math.round((done / scenario.lines.length) * 100) || 0;
}
function toggleLineCompletion(scenarioId, lineIdx) {
  if (!scenarioCompletionMap[scenarioId])
    scenarioCompletionMap[scenarioId] = new Array(SCENARIOS.find(s => s.id === scenarioId).lines.length).fill(false);
  const completed = scenarioCompletionMap[scenarioId][lineIdx];
  scenarioCompletionMap[scenarioId][lineIdx] = !completed;
  saveCompletion();
  const scenario = SCENARIOS.find(s => s.id === scenarioId);
  const percent = getCompletionPercent(scenario);
  if (percent === 100) showAchievement(`🎉 Amazing! You mastered "${scenario.title}"! 🌟`, '🎯');
  if (window._currentScenario && window._currentScenario.id === scenarioId) renderDetailView(window._currentScenario);
  if (currentViewMode === 'list') renderScenarioGrid();
}
function showAchievement(message, emoji) {
  const toast = document.createElement('div');
  toast.className = 'achievement-toast';
  toast.innerHTML = `<span style="font-size:1.8rem">${emoji || '🏆'}</span><span>${message}</span><span style="font-size:1.2rem">✨</span>`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ==================== RENDER GRID (DANH SÁCH CHÍNH) ====================
function renderScenarioGrid() {
  let filtered = SCENARIOS.filter(s => currentGroupFilter === 'all' ? true : s.groupId === currentGroupFilter);
  const html = `
    <div class="filter-bar">
      <div class="filter-group" id="filter-group-buttons"></div>
      <div><button class="filter-chip" onclick="resetGroupFilter()">All</button></div>
    </div>
    <div class="scenario-grid" id="scenario-grid-container"></div>
  `;
  document.getElementById('dynamic-content').innerHTML = html;
  const filterDiv = document.getElementById('filter-group-buttons');
  filterDiv.innerHTML = GROUPS.map(g => `<button class="filter-chip ${currentGroupFilter === g.id ? 'active' : ''}" onclick="setGroupFilter('${g.id}')">${g.icon} ${g.label}</button>`).join('');
  const gridContainer = document.getElementById('scenario-grid-container');
  if (filtered.length === 0) gridContainer.innerHTML = '<div class="empty-state">📭 No scenarios in this group. Create one!</div>';
  else {
    gridContainer.innerHTML = filtered.map(s => {
      const percent = getCompletionPercent(s);
      return `<div class="scenario-card" onclick="loadScenario('${s.id}')">
        <div class="card-icon" style="background:${s.iconBg || '#deeeff'}">${s.icon}</div>
        <div class="card-info">
          <div class="card-title">${escapeHtml(s.title)}</div>
          <div class="card-sub">${escapeHtml(s.sub)}</div>
          <div class="card-meta"><span class="level-badge">${s.level}</span>
            <div style="display:flex; align-items:center; gap:8px"><div class="progress-mini"><div class="progress-mini-fill" style="width:${percent}%"></div></div><span style="font-size:11px">${percent}%</span></div>
          </div>
        </div>
      </div>`;
    }).join('');
  }
  currentViewMode = 'list';
  document.getElementById('sc-pill').textContent = SCENARIOS.length + ' scenarios';
}
function setGroupFilter(groupId) { currentGroupFilter = groupId; renderScenarioGrid(); }
function resetGroupFilter() { currentGroupFilter = 'all'; renderScenarioGrid(); }

// ==================== LOAD CHI TIẾT SCENARIO ====================
function loadScenario(id) {
  stopAudio();
  const scenario = SCENARIOS.find(s => s.id === id);
  if (!scenario) return;
  window._currentScenario = scenario;
  activeVocab.clear();
  currentViewMode = 'detail';
  renderDetailView(scenario);
  if (typeof renderSidebar === 'function') renderSidebar();
}
function renderDetailView(s) {
  const ls = LEVEL_S[s.level] || LEVEL_S.Intermediate;
  const voiceOpts = allVoices.length ? allVoices.map((v, i) => `<option value="${i}">${escapeHtml(v.name)}</option>`).join('') : '<option>Default</option>';
  const completionPercent = getCompletionPercent(s);
  const lineCompletions = scenarioCompletionMap[s.id] || [];
  let dialogHtml = s.lines.map((l, idx) => {
    const cfg = ROLES[l.role] || ROLES.pm;
    const isCompleted = lineCompletions[idx] === true;
    const txt = hlText(l.text, activeVocab);
    return `<div class="dline ${l.role === 'dev' ? 'r' : ''}" style="display:flex; align-items:flex-start;">
      <div class="completion-check" onclick="event.stopPropagation(); toggleLineCompletion('${s.id}', ${idx})">
        <div class="check-circle ${isCompleted ? 'completed' : ''}">${isCompleted ? '✓' : ''}</div>
      </div>
      <div style="flex:1">
        <div class="dav" style="background:${cfg.avBg};color:${cfg.avColor};width:48px">${cfg.label}</div>
        <div class="dbub ${l.role}">
          <div class="dspk">${escapeHtml(l.speaker)}</div>
          ${txt}
          <div class="dline-audio"><button class="dline-audio-btn" onclick="playLine(${idx})">▶</button></div>
        </div>
      </div>
    </div>`;
  }).join('');
  const mainHtml = `
    <button class="back-btn" onclick="renderScenarioGrid()">← Back to all scenarios</button>
    <div class="scard">
      <div class="scard-hd">
        <div class="scard-ico" style="background:${s.iconBg}">${s.icon}</div>
        <div class="scard-meta"><div class="scard-title">${escapeHtml(s.title)}</div><div class="scard-sub">${escapeHtml(s.sub)}</div></div>
        <div class="scard-actions"><button class="icon-btn" onclick="editScenario('${s.id}')">✏️</button><button class="icon-btn" onclick="deleteScenarioConfirm('${s.id}')">🗑️</button></div>
        <span class="lvl-pill" style="background:${ls.bg};color:${ls.color}">${s.level}</span>
      </div>
      <div class="scenario-progress" style="margin:0 20px 12px"><span>📖 Completion: ${completionPercent}%</span><div class="progress-mini" style="width:120px"><div class="progress-mini-fill" style="width:${completionPercent}%; background:var(--success)"></div></div></div>
      <div class="vocab-bar"><div class="vocab-bar-hd"><span>📚 Key vocabulary</span><span class="vocab-bar-hint">Click to highlight</span></div><div class="chips">${s.vocab.map(v => `<span class="chip ${activeVocab.has(v) ? 'on' : ''}" onclick="toggleVocab(this,'${escapeAttr(v)}')">${escapeHtml(v)}</span>`).join('')}</div></div>
      <div class="script"><div class="dlg" id="dlg">${dialogHtml}</div></div>
      <div class="audio-panel" id="audio-panel-placeholder"></div>
      <div class="tip-box">💡 PM tip: ${s.tip}</div>
      <div id="fc-anchor"></div>
    </div>
  `;
  document.getElementById('dynamic-content').innerHTML = mainHtml;
  // Tạo lại panel audio
  const audioPanelHtml = `<div class="ap-title">Voice settings</div><div class="voice-grid">${Object.entries(ROLES).map(([role, cfg]) => `<div class="vg-item"><div class="vg-label"><div class="vg-dot" style="background:${cfg.dot}"></div>${cfg.label}</div><select class="vg-sel" id="vs-${role}" onchange="setVoice('${role}',this.value)">${voiceOpts}</select></div>`).join('')}</div><div class="speed-row"><label>Speed</label><input type="range" min="0.5" max="1.4" step="0.05" value="${speechRate}" oninput="speechRate=parseFloat(this.value);document.getElementById('spd-val').textContent=speechRate.toFixed(2)+'x'"><span class="speed-val" id="spd-val">${speechRate.toFixed(2)}x</span></div><div class="audio-actions"><button class="btn btn-play" id="btn-play" onclick="togglePlay()">▶ Play</button><button class="btn btn-dl" id="btn-dl" onclick="downloadMp3()">⬇ Download MP3</button><div class="prog-wrap"><div class="prog-bar"><div class="prog-fill" id="pfill"></div></div><div class="prog-status" id="pstatus">Press ▶ to listen</div></div></div>`;
  document.querySelector('.audio-panel').innerHTML = audioPanelHtml;
  refreshVoices();
  if (typeof renderFC === 'function') renderFC();
}
function hlText(text, vocabSet) {
  if (!vocabSet.size) return escapeHtml(text);
  let r = escapeHtml(text);
  vocabSet.forEach(word => {
    const regex = new RegExp(`(${word.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')})`, 'gi');
    r = r.replace(regex, '<mark class="hl">$1</mark>');
  });
  return r;
}
function toggleVocab(el, word) {
  if (activeVocab.has(word)) { activeVocab.delete(word); el.classList.remove('on'); }
  else { activeVocab.add(word); el.classList.add('on'); }
  if (window._currentScenario) {
    document.getElementById('dlg').innerHTML = buildDlg(window._currentScenario);
  }
}
function buildDlg(s) {
  return s.lines.map((l, i) => {
    const cfg = ROLES[l.role] || ROLES.pm;
    const txt = hlText(l.text, activeVocab);
    return `<div class="dline ${l.role === 'dev' ? 'r' : ''}">
      <div class="dav" style="background:${cfg.avBg};color:${cfg.avColor}">${cfg.label}</div>
      <div class="dbub ${l.role}">
        <div class="dspk">${escapeHtml(l.speaker)}</div>
        ${txt}
        <div class="dline-audio"><button class="dline-audio-btn" onclick="playLine(${i})">▶</button></div>
      </div>
    </div>`;
  }).join('');
}

// ==================== EDIT / DELETE ====================
function editScenario(id) {
  const s = SCENARIOS.find(s => s.id === id);
  if (!s) return;
  document.getElementById('editing-scenario-id').value = id;
  document.getElementById('c-title').value = s.title;
  document.getElementById('c-sub').value = s.sub || '';
  document.getElementById('c-icon').value = s.icon;
  document.getElementById('c-level').value = s.level;
  document.getElementById('c-vocab').value = s.vocab.join(', ');
  document.getElementById('c-tip').value = s.tip.replace(/<[^>]*>/g, '');
  tempManualLines = s.lines.map(l => ({ speaker: l.speaker, role: l.role, text: l.text }));
  renderManualLines();
  openCreateModal('manual');
}
function deleteScenarioConfirm(id) {
  if (confirm('Delete scenario permanently?')) {
    const idx = SCENARIOS.findIndex(s => s.id === id);
    if (idx !== -1) SCENARIOS.splice(idx, 1);
    persistScenarios();
    if (window._currentScenario && window._currentScenario.id === id) renderScenarioGrid();
    else renderScenarioGrid();
  }
}
function persistScenarios() {
  localStorage.setItem('be_scenarios', JSON.stringify(SCENARIOS));
}

// ==================== MODAL TẠO / SỬA SCENARIO ====================
function openCreateModal(tab = 'manual') {
  document.getElementById('create-modal').classList.add('vis');
  document.getElementById('editing-scenario-id').value = '';
  tempManualLines = [{ speaker: 'PM', role: 'pm', text: '' }, { speaker: 'Client', role: 'client', text: '' }];
  renderManualLines();
  switchCreateTab(tab);
  populateGroupSelects();
}
function closeCreateModal() { document.getElementById('create-modal').classList.remove('vis'); }
function switchCreateTab(tab) {
  document.querySelectorAll('.create-tab-pane').forEach(p => p.style.display = 'none');
  document.getElementById(`create-tab-${tab}`).style.display = 'block';
}
function renderManualLines() {
  const container = document.getElementById('c-lines-container');
  if (!container) return;
  container.innerHTML = tempManualLines.map((l, i) => `<div class="line-block">
    <button class="rm-btn" onclick="removeManualLine(${i})">✕</button>
    <div class="row2">
      <div><div class="fl">Speaker</div><input class="fi" value="${escapeAttr(l.speaker)}" oninput="tempManualLines[${i}].speaker=this.value"></div>
      <div><div class="fl">Role</div><select class="fi" onchange="tempManualLines[${i}].role=this.value">
        <option value="pm" ${l.role === 'pm' ? 'selected' : ''}>PM</option>
        <option value="dev" ${l.role === 'dev' ? 'selected' : ''}>Dev Lead</option>
        <option value="client" ${l.role === 'client' ? 'selected' : ''}>Client</option>
      </select></div>
    </div>
    <div><div class="fl">Text</div><textarea class="fi" oninput="tempManualLines[${i}].text=this.value">${escapeHtml(l.text)}</textarea></div>
  </div>`).join('');
}
function addManualLine() { tempManualLines.push({ speaker: 'PM', role: 'pm', text: '' }); renderManualLines(); }
function removeManualLine(i) { tempManualLines.splice(i, 1); renderManualLines(); }
function populateGroupSelects() {
  const opts = `<option value="">— No group —</option>` + GROUPS.map(g => `<option value="${g.id}">${escapeHtml(g.label)}</option>`).join('');
  const sel = document.getElementById('c-group');
  if (sel) sel.innerHTML = opts;
}
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
  const title = document.getElementById('c-title').value.trim();
  if (!title) { alert('Please enter a title.'); return; }
  const lines = tempManualLines.filter(l => l.text.trim()).map(l => ({ ...l, muted: false }));
  if (!lines.length) { alert('Please add at least one line.'); return; }
  const vocab = (document.getElementById('c-vocab').value || '').split(',').map(v => v.trim()).filter(Boolean);
  const level = document.getElementById('c-level').value;
  const ls = LEVEL_S[level] || LEVEL_S.Intermediate;
  const icon = document.getElementById('c-icon').value.trim() || '📝';
  const sub = document.getElementById('c-sub').value.trim() || '';
  const tip = document.getElementById('c-tip').value.trim() || 'Practice this scenario regularly.';
  const iconBg = { Beginner: '#edf7e3', Intermediate: '#deeeff', Advanced: '#fde8e8' }[level] || '#deeeff';
  const groupId = resolveGroup('c-group', 'c-newgroup');
  const editingId = document.getElementById('editing-scenario-id').value;
  if (editingId) {
    const idx = SCENARIOS.findIndex(s => s.id === editingId);
    if (idx !== -1) {
      SCENARIOS[idx] = { ...SCENARIOS[idx], groupId, title, sub, icon, iconBg, level, levelColor: ls.color, levelBg: ls.bg, vocab, lines, tip };
    }
  } else {
    SCENARIOS.push({ id: 'c' + Date.now(), groupId, title, sub, icon, iconBg, level, levelColor: ls.color, levelBg: ls.bg, vocab, lines, tip });
  }
  persistScenarios();
  closeCreateModal();
  renderScenarioGrid();
  if (!editingId) loadScenario(SCENARIOS[SCENARIOS.length - 1].id);
  else loadScenario(editingId);
}

// ==================== AI GENERATE (GEMINI) ====================
async function callGemini(systemPrompt, userPrompt) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
    throw new Error('Please set your Gemini API key in scenarios.js');
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
  const requestBody = {
    contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\nUser request: ${userPrompt}` }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
  };
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }
  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const clean = rawText.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}
async function generateAiScenario() {
  const prompt = document.getElementById('ai-prompt-text').value.trim();
  if (!prompt) { alert('Please describe the situation.'); return; }
  const level = document.getElementById('ai-level-gen').value;
  const numLines = parseInt(document.getElementById('ai-lines-num').value, 10);
  const previewDiv = document.getElementById('ai-preview-area');
  previewDiv.innerHTML = '<span class="wsm-loading">Generating with Gemini...</span>';
  const systemPrompt = `You are a business English content creator for project managers.
Generate a realistic workplace dialogue scenario based on the user's description.
Reply ONLY with a valid JSON object — no markdown, no preamble.
JSON structure:
{
  "title": "short English title",
  "sub": "one-line English subtitle",
  "icon": "single emoji",
  "level": "${level}",
  "vocab": ["word1","word2","word3","word4","word5"],
  "tip": "one concise PM language tip using <strong> tags",
  "lines": [
    {"speaker":"PM","role":"pm","text":"..."},
    {"speaker":"Client","role":"client","text":"..."}
  ]
}
Rules: exactly ${numLines} lines, roles: pm/dev/client, professional English at ${level} level.`;
  try {
    const generated = await callGemini(systemPrompt, prompt);
    window._aiTemp = generated;
    previewDiv.innerHTML = `<pre style="white-space:pre-wrap; font-size:12px;">${JSON.stringify(generated, null, 2)}</pre>
    <button class="btn-save" onclick="saveAiGeneratedScenario()">✅ Save this scenario</button>`;
  } catch (e) {
    previewDiv.innerHTML = `<span style="color:red">Error: ${e.message}</span>`;
  }
}
async function generateByKeyword() {
  const keyword = document.getElementById('keyword-input').value.trim();
  if (!keyword) { alert('Enter a keyword'); return; }
  const level = document.getElementById('keyword-level').value;
  const numLines = parseInt(document.getElementById('keyword-lines').value, 10);
  const previewDiv = document.getElementById('keyword-preview-area');
  previewDiv.innerHTML = '<span class="wsm-loading">Generating with Gemini...</span>';
  const systemPrompt = `Create a professional business English dialogue about "${keyword}". 
Level ${level}, exactly ${numLines} lines. Output JSON only with same structure as before.`;
  try {
    const generated = await callGemini(systemPrompt, `Topic: ${keyword}`);
    window._aiTemp = generated;
    previewDiv.innerHTML = `<pre style="white-space:pre-wrap;">${JSON.stringify(generated, null, 2)}</pre>
    <button class="btn-save" onclick="saveAiGeneratedScenario()">✅ Save</button>`;
  } catch (e) {
    previewDiv.innerHTML = `<span style="color:red">Error: ${e.message}</span>`;
  }
}
function saveAiGeneratedScenario() {
  if (!window._aiTemp) return;
  const gen = window._aiTemp;
  const level = gen.level || 'Intermediate';
  const ls = LEVEL_S[level] || LEVEL_S.Intermediate;
  const iconBg = { Beginner: '#edf7e3', Intermediate: '#deeeff', Advanced: '#fde8e8' }[level] || '#deeeff';
  const groupId = resolveGroup('c-group', 'c-newgroup');
  const newScenario = {
    id: 'ai_' + Date.now(),
    groupId: groupId,
    title: gen.title,
    sub: gen.sub,
    icon: gen.icon || '🤖',
    iconBg: iconBg,
    level: level,
    levelColor: ls.color,
    levelBg: ls.bg,
    vocab: gen.vocab || [],
    lines: gen.lines.map(l => ({ ...l, muted: false })),
    tip: gen.tip || ''
  };
  SCENARIOS.push(newScenario);
  persistScenarios();
  renderScenarioGrid();
  closeCreateModal();
  loadScenario(newScenario.id);
}

// ==================== IMPORT DIALOGUE (PASTE) ====================
function openImportTextModal() { document.getElementById('import-modal').classList.add('vis'); }
function closeImportModal() { document.getElementById('import-modal').classList.remove('vis'); }
function importParsedDialogue() {
  const raw = document.getElementById('paste-dialogue').value;
  const linesArr = raw.split(/\r?\n/).filter(l => l.trim()).map(line => {
    const match = line.match(/^([^:：]+)[:：]\s*(.+)/);
    if (match) return { speaker: match[1].trim(), role: match[1].toLowerCase().includes('dev') ? 'dev' : (match[1].toLowerCase().includes('client') ? 'client' : 'pm'), text: match[2].trim(), muted: false };
    return null;
  }).filter(l => l);
  if (linesArr.length === 0) { alert('No valid lines. Use format: Speaker: text'); return; }
  const title = document.getElementById('import-title').value.trim() || 'Imported Dialogue';
  const newId = 'imp_' + Date.now();
  SCENARIOS.push({
    id: newId, groupId: null, title: title, sub: '', icon: '📄', iconBg: '#deeeff',
    level: 'Intermediate', vocab: [], tip: '', lines: linesArr
  });
  persistScenarios();
  renderScenarioGrid();
  closeImportModal();
  loadScenario(newId);
}

// ==================== TEXT SELECTION (SAVE VOCAB) ====================
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

// ==================== UTILITY ====================
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  }).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, function(c) {
    return c;
  });
}
function escapeAttr(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Gắn sự kiện cho các nút AI trong modal (sau khi DOM load)
document.addEventListener('DOMContentLoaded', () => {
  const btnAiGen = document.getElementById('trigger-ai-gen');
  if (btnAiGen) btnAiGen.addEventListener('click', generateAiScenario);
  const btnKeywordGen = document.getElementById('trigger-keyword-gen');
  if (btnKeywordGen) btnKeywordGen.addEventListener('click', generateByKeyword);
  const finalSaveBtn = document.getElementById('final-save-scenario');
  if (finalSaveBtn) finalSaveBtn.addEventListener('click', saveManualScenario);
});

// Export toàn bộ hàm ra window để dùng trong HTML
window.renderScenarioGrid = renderScenarioGrid;
window.loadScenario = loadScenario;
window.setGroupFilter = setGroupFilter;
window.resetGroupFilter = resetGroupFilter;
window.toggleLineCompletion = toggleLineCompletion;
window.editScenario = editScenario;
window.deleteScenarioConfirm = deleteScenarioConfirm;
window.openCreateModal = openCreateModal;
window.closeCreateModal = closeCreateModal;
window.switchCreateTab = switchCreateTab;
window.addManualLine = addManualLine;
window.removeManualLine = removeManualLine;
window.openImportTextModal = openImportTextModal;
window.closeImportModal = closeImportModal;
window.importParsedDialogue = importParsedDialogue;
window.toggleVocab = toggleVocab;
window.showAchievement = showAchievement;
window.saveAiGeneratedScenario = saveAiGeneratedScenario;
window.setupSelectionListener = setupSelectionListener;
