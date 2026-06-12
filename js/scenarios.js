// js/scenarios.js
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
let currentViewMode = 'list';
let currentGroupFilter = 'all';
let scenarioCompletionMap = {};

// ========== COMPLETION ==========
function loadCompletionData() {
  const stored = localStorage.getItem('be_scenario_progress');
  scenarioCompletionMap = stored ? JSON.parse(stored) : {};
  SCENARIOS.forEach(s => {
    if (!scenarioCompletionMap[s.id])
      scenarioCompletionMap[s.id] = new Array(s.lines.length).fill(false);
  });
}
function saveCompletion() { localStorage.setItem('be_scenario_progress', JSON.stringify(scenarioCompletionMap)); }
function getCompletionPercent(scenario) {
  const comp = scenarioCompletionMap[scenario.id] || new Array(scenario.lines.length).fill(false);
  const done = comp.filter(v => v === true).length;
  return Math.round((done / scenario.lines.length) * 100) || 0;
}
function toggleLineCompletion(scenarioId, lineIdx) {
  if (!scenarioCompletionMap[scenarioId])
    scenarioCompletionMap[scenarioId] = new Array(SCENARIOS.find(s => s.id === scenarioId).lines.length).fill(false);
  scenarioCompletionMap[scenarioId][lineIdx] = !scenarioCompletionMap[scenarioId][lineIdx];
  saveCompletion();
  const scenario = SCENARIOS.find(s => s.id === scenarioId);
  if (getCompletionPercent(scenario) === 100) showAchievement(`🎉 Amazing! You mastered "${scenario.title}"! 🌟`, '🎯');
  if (window._currentScenario?.id === scenarioId) renderDetailView(window._currentScenario);
  if (currentViewMode === 'list') renderScenarioGrid();
}
function showAchievement(msg, emoji) {
  const toast = document.createElement('div');
  toast.className = 'achievement-toast';
  toast.innerHTML = `<span style="font-size:1.8rem">${emoji || '🏆'}</span><span>${msg}</span><span style="font-size:1.2rem">✨</span>`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ========== RENDER GRID ==========
function renderScenarioGrid() {
  let filtered = SCENARIOS.filter(s => currentGroupFilter === 'all' ? true : s.groupId === currentGroupFilter);
  const html = `<div class="filter-bar"><div class="filter-group" id="filter-group-buttons"></div><div><button class="filter-chip" onclick="resetGroupFilter()">All</button></div></div><div class="scenario-grid" id="scenario-grid-container"></div>`;
  document.getElementById('dynamic-content').innerHTML = html;
  const filterDiv = document.getElementById('filter-group-buttons');
  filterDiv.innerHTML = GROUPS.map(g => `<button class="filter-chip ${currentGroupFilter === g.id ? 'active' : ''}" onclick="setGroupFilter('${g.id}')">${g.icon} ${g.label}</button>`).join('');
  const grid = document.getElementById('scenario-grid-container');
  if (!filtered.length) grid.innerHTML = '<div class="empty-state">📭 No scenarios. Create one using AI or Paste!</div>';
  else {
    grid.innerHTML = filtered.map(s => {
      const percent = getCompletionPercent(s);
      return `<div class="scenario-card" onclick="loadScenario('${s.id}')">
        <div class="card-icon" style="background:${s.iconBg || '#deeeff'}">${s.icon}</div>
        <div class="card-info"><div class="card-title">${escapeHtml(s.title)}</div><div class="card-sub">${escapeHtml(s.sub)}</div>
        <div class="card-meta"><span class="level-badge">${s.level}</span><div class="progress-mini"><div class="progress-mini-fill" style="width:${percent}%"></div></div><span>${percent}%</span></div></div>
      </div>`;
    }).join('');
  }
  currentViewMode = 'list';
  document.getElementById('sc-pill').textContent = SCENARIOS.length + ' scenarios';
}
function setGroupFilter(g) { currentGroupFilter = g; renderScenarioGrid(); }
function resetGroupFilter() { currentGroupFilter = 'all'; renderScenarioGrid(); }

// ========== LOAD & DETAIL ==========
function loadScenario(id) {
  stopAudio();
  window._currentScenario = SCENARIOS.find(s => s.id === id);
  if (!window._currentScenario) return;
  activeVocab.clear();
  currentViewMode = 'detail';
  renderDetailView(window._currentScenario);
}
function renderDetailView(s) {
  const ls = LEVEL_S[s.level] || LEVEL_S.Intermediate;
  const voiceOpts = allVoices.length ? allVoices.map((v,i)=>`<option value="${i}">${escapeHtml(v.name)}</option>`).join('') : '<option>Default</option>';
  const percent = getCompletionPercent(s);
  const completions = scenarioCompletionMap[s.id] || [];
  let dialogHtml = s.lines.map((l,idx)=>{
    const cfg = ROLES[l.role] || ROLES.pm;
    const isComp = completions[idx] === true;
    const txt = hlText(l.text, activeVocab);
    return `<div class="dline ${l.role === 'dev' ? 'r' : ''}" style="display:flex; gap:8px">
      <div class="completion-check" onclick="toggleLineCompletion('${s.id}', ${idx})"><div class="check-circle ${isComp ? 'completed' : ''}">${isComp ? '✓' : ''}</div></div>
      <div><div class="dav" style="background:${cfg.avBg};color:${cfg.avColor}">${cfg.label}</div>
      <div class="dbub"><div class="dspk">${escapeHtml(l.speaker)}</div>${txt}<div class="dline-audio"><button class="dline-audio-btn" onclick="playLine(${idx})">▶</button></div></div></div>
    </div>`;
  }).join('');
  const mainHtml = `<button class="back-btn" onclick="renderScenarioGrid()">← Back</button>
    <div class="scard"><div class="scard-hd"><div class="scard-ico" style="background:${s.iconBg}">${s.icon}</div>
    <div class="scard-meta"><div class="scard-title">${escapeHtml(s.title)}</div><div class="scard-sub">${escapeHtml(s.sub)}</div></div>
    <div class="scard-actions"><button class="icon-btn" onclick="editScenario('${s.id}')">✏️</button><button class="icon-btn" onclick="deleteScenarioConfirm('${s.id}')">🗑️</button></div>
    <span class="lvl-pill" style="background:${ls.bg};color:${ls.color}">${s.level}</span></div>
    <div class="scenario-progress"><span>Completion: ${percent}%</span><div class="progress-mini" style="width:120px"><div class="progress-mini-fill" style="width:${percent}%; background:green"></div></div></div>
    <div class="vocab-bar"><div class="chips">${s.vocab.map(v=>`<span class="chip ${activeVocab.has(v)?'on':''}" onclick="toggleVocab(this,'${escapeAttr(v)}')">${escapeHtml(v)}</span>`).join('')}</div></div>
    <div class="script"><div class="dlg">${dialogHtml}</div></div>
    <div class="audio-panel" id="audio-panel-placeholder"></div>
    <div class="tip-box">💡 ${s.tip}</div><div id="fc-anchor"></div></div>`;
  document.getElementById('dynamic-content').innerHTML = mainHtml;
  const audioPanel = `<div class="ap-title">Voice</div><div class="voice-grid">${Object.entries(ROLES).map(([role,cfg])=>`<div><label>${cfg.label}</label><select id="vs-${role}" onchange="setVoice('${role}',this.value)">${voiceOpts}</select></div>`).join('')}</div>
  <div><label>Speed</label><input type="range" min="0.5" max="1.4" step="0.05" value="${speechRate}" oninput="speechRate=this.value;document.getElementById('spd-val').innerText=speechRate"> <span id="spd-val">${speechRate}</span></div>
  <div><button class="btn-play" onclick="togglePlay()">▶ Play</button><button onclick="downloadMp3()">⬇ MP3</button><div class="prog-bar"><div id="pfill"></div></div><div id="pstatus"></div></div>`;
  document.querySelector('.audio-panel').innerHTML = audioPanel;
  refreshVoices();
  if (typeof renderFC === 'function') renderFC();
}
function hlText(text, vocabSet) {
  let r = escapeHtml(text);
  vocabSet.forEach(w => { r = r.replace(new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '<mark class="hl">$&</mark>'); });
  return r;
}
function toggleVocab(el, word) {
  if (activeVocab.has(word)) activeVocab.delete(word); else activeVocab.add(word);
  el.classList.toggle('on', activeVocab.has(word));
  if (window._currentScenario) document.querySelector('.dlg').innerHTML = renderDetailView(window._currentScenario);
}

// ========== EDIT/DELETE ==========
function editScenario(id) {
  const s = SCENARIOS.find(s=>s.id===id);
  if(!s) return;
  // Chỉ cho phép sửa title, sub, icon, level, vocab, tip (không sửa lines vì phức tạp)
  const newTitle = prompt('Edit title:', s.title);
  if (newTitle && newTitle.trim()) s.title = newTitle.trim();
  const newSub = prompt('Edit subtitle:', s.sub);
  if (newSub !== null) s.sub = newSub;
  const newIcon = prompt('Edit icon (emoji):', s.icon);
  if (newIcon && newIcon.trim()) s.icon = newIcon.trim();
  persistScenarios();
  if (window._currentScenario?.id === id) renderDetailView(s);
  else renderScenarioGrid();
}
function deleteScenarioConfirm(id) {
  if(confirm('Delete scenario permanently?')) {
    const idx = SCENARIOS.findIndex(s=>s.id===id);
    if(idx!==-1) SCENARIOS.splice(idx,1);
    persistScenarios();
    if(window._currentScenario?.id===id) renderScenarioGrid();
    else renderScenarioGrid();
  }
}

// ========== AI GEMINI (key lưu trong localStorage) ==========
function getGeminiApiKey() { return localStorage.getItem('gemini_api_key'); }
function setGeminiApiKey(key) { localStorage.setItem('gemini_api_key', key); }
function promptForApiKey() {
  const key = prompt(
    '🔑 Enter your Gemini API key\n\nGet free key: https://aistudio.google.com/apikey\n\nKey will be stored in your browser only.'
  );
  if (key && key.trim()) { setGeminiApiKey(key.trim()); return key.trim(); }
  return null;
}
async function callGemini(system, user) {
  let apiKey = getGeminiApiKey();
  if (!apiKey) {
    apiKey = promptForApiKey();
    if (!apiKey) throw new Error('API key required');
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: `${system}\n\n${user}` }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
    })
  });
  if (!resp.ok) {
    if (resp.status === 403 || resp.status === 401) {
      localStorage.removeItem('gemini_api_key');
      throw new Error('Invalid API key. Please re-enter.');
    }
    throw new Error(`API error: ${resp.status}`);
  }
  const data = await resp.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const clean = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}
async function generateAiScenario() {
  const prompt = document.getElementById('ai-prompt-text').value.trim();
  if (!prompt) return alert('Describe situation');
  const level = document.getElementById('ai-level-gen').value;
  const numLines = parseInt(document.getElementById('ai-lines-num').value);
  const preview = document.getElementById('ai-preview-area');
  preview.innerHTML = '<span>🤖 Generating...</span>';
  const system = `Generate JSON dialogue: title, sub, icon, level:${level}, vocab array (6-10 words), tip, lines array exactly ${numLines} lines with speaker,role,text. No markdown.`;
  try {
    const gen = await callGemini(system, prompt);
    window._aiTemp = gen;
    preview.innerHTML = `<pre style="background:#f0f0f0;padding:8px;border-radius:8px">${JSON.stringify(gen,null,2)}</pre><button class="btn-save" onclick="saveAiGeneratedScenario()">✅ Save</button>`;
  } catch(e) { preview.innerHTML = `<span style="color:red">❌ ${e.message}</span>`; }
}
async function generateByKeyword() {
  const kw = document.getElementById('keyword-input').value.trim();
  if (!kw) return alert('Enter keyword');
  const level = document.getElementById('keyword-level').value;
  const numLines = parseInt(document.getElementById('keyword-lines').value);
  const preview = document.getElementById('keyword-preview-area');
  preview.innerHTML = '<span>🤖 Generating...</span>';
  try {
    const gen = await callGemini(`Create dialogue about ${kw}, level ${level}, ${numLines} lines, JSON only.`, kw);
    window._aiTemp = gen;
    preview.innerHTML = `<pre style="background:#f0f0f0;padding:8px;border-radius:8px">${JSON.stringify(gen,null,2)}</pre><button class="btn-save" onclick="saveAiGeneratedScenario()">✅ Save</button>`;
  } catch(e) { preview.innerHTML = `<span style="color:red">❌ ${e.message}</span>`; }
}
function saveAiGeneratedScenario() {
  if (!window._aiTemp) return;
  const gen = window._aiTemp;
  const level = gen.level || 'Intermediate';
  const ls = LEVEL_S[level] || LEVEL_S.Intermediate;
  const iconBg = { Beginner: '#edf7e3', Intermediate: '#deeeff', Advanced: '#fde8e8' }[level] || '#deeeff';
  const groupId = null; // không cho chọn group lúc này, có thể set sau
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

// ========== IMPORT PASTE ==========
function openImportTextModal() { document.getElementById('import-modal').classList.add('vis'); }
function closeImportModal() { document.getElementById('import-modal').classList.remove('vis'); }
function importParsedDialogue() {
  const raw = document.getElementById('paste-dialogue').value;
  const lines = raw.split(/\r?\n/).filter(l=>l.trim()).map(l=>{
    const m = l.match(/^([^:：]+)[:：]\s*(.+)/);
    if (m) return { speaker: m[1].trim(), role: m[1].toLowerCase().includes('dev')?'dev':(m[1].toLowerCase().includes('client')?'client':'pm'), text: m[2].trim(), muted: false };
    return null;
  }).filter(l=>l);
  if (!lines.length) return alert('Invalid format. Use "Speaker: text"');
  const title = document.getElementById('import-title').value.trim() || 'Imported Dialogue';
  const newId = 'imp_' + Date.now();
  const newScenario = {
    id: newId, groupId: null, title: title, sub: '', icon: '📄', iconBg: '#deeeff',
    level: 'Intermediate', vocab: [], tip: '', lines: lines
  };
  SCENARIOS.push(normalizeScenario(newScenario));
  persistScenarios();
  renderScenarioGrid();
  closeImportModal();
  loadScenario(newId);
}

// ========== SELECTION & UTILS ==========
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
    window.pendingCtx = bubble ? bubble.innerText.replace(/^[A-Z]{2,}\n/, '').trim() : '';
    window.pendingWord = txt;
    document.getElementById('sp-save-btn').onclick = () => { popup.classList.remove('vis'); openWordModal(window.pendingWord, window.pendingCtx); };
    document.getElementById('sp-look-btn').onclick = () => { popup.classList.remove('vis'); openWordModal(window.pendingWord, window.pendingCtx, true); };
  });
}
function escapeHtml(str) { return str?.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m])) || ''; }
function escapeAttr(str) { return str?.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') || ''; }

// Export
window.renderScenarioGrid = renderScenarioGrid;
window.loadScenario = loadScenario;
window.setGroupFilter = setGroupFilter;
window.resetGroupFilter = resetGroupFilter;
window.toggleLineCompletion = toggleLineCompletion;
window.editScenario = editScenario;
window.deleteScenarioConfirm = deleteScenarioConfirm;
window.openImportTextModal = openImportTextModal;
window.closeImportModal = closeImportModal;
window.importParsedDialogue = importParsedDialogue;
window.toggleVocab = toggleVocab;
window.saveAiGeneratedScenario = saveAiGeneratedScenario;
window.setupSelectionListener = setupSelectionListener;
window.loadCompletionData = loadCompletionData;
window.generateAiScenario = generateAiScenario;
window.generateByKeyword = generateByKeyword;

// Gắn sự kiện cho nút AI sau khi DOM load
document.addEventListener('DOMContentLoaded', () => {
  const btnAi = document.getElementById('trigger-ai-gen');
  if (btnAi) btnAi.addEventListener('click', generateAiScenario);
  const btnKw = document.getElementById('trigger-keyword-gen');
  if (btnKw) btnKw.addEventListener('click', generateByKeyword);
});
