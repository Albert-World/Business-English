/* ═══════════════════════════
   PM English — vocab.js
   Saved words + flashcards
   ═══════════════════════════ */

const STAGES = [
  { id: 'new',      label: 'New',      color: '#f59e0b', bg: '#fef3c7', min: 0,  max: 1   },
  { id: 'learning', label: 'Learning', color: '#3b82f6', bg: '#dbeafe', min: 2,  max: 4   },
  { id: 'review',   label: 'Review',   color: '#8b5cf6', bg: '#ede9fe', min: 5,  max: 9   },
  { id: 'mastered', label: 'Mastered', color: '#10b981', bg: '#d1fae5', min: 10, max: 999 },
];

let savedWords = JSON.parse(localStorage.getItem('pm_vocab') || '[]').map(w => ({ reps: 0, ...w }));
let fcTab = 'study', listSubTab = null, fcIdx = 0, fcFlipped = false;
let pendingWord = null, pendingCtx = null, editingIdx = null, tempDefData = null;

function getStage(w) {
  const reps = w.reps || 0;
  return STAGES.find(s => reps >= s.min && reps <= s.max) || STAGES[0];
}

function persist() {
  try { localStorage.setItem('pm_vocab', JSON.stringify(savedWords)); } catch (e) {}
}

function updateFCPill() {
  const pill = document.getElementById('fc-pill');
  document.getElementById('fc-pill-n').textContent = savedWords.length;
  pill.style.display = savedWords.length ? 'inline-flex' : 'none';
}

function scrollToFC() {
  const a = document.getElementById('fc-anchor');
  if (a) a.scrollIntoView({ behavior: 'smooth' });
}

function getDefaultListTab() {
  if (!savedWords.length) return 'all';
  const counts = {};
  savedWords.forEach(w => {
    const s = getStage(w);
    if (s.id !== 'mastered') counts[s.id] = (counts[s.id] || 0) + 1;
  });
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return best ? best[0] : 'all';
}

/* ── Dictionary lookup ── */
async function lookupDict(word) {
  try {
    const r = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    if (!r.ok) return null;
    const data = await r.json(), entry = data[0], meaning = entry?.meanings?.[0], def = meaning?.definitions?.[0];
    let phoneticUS = '', phoneticUK = '', audioUS = '', audioUK = '';
    if (entry.phonetics) {
      entry.phonetics.forEach(p => {
        if (p.audio) {
          if (p.audio.includes('-us.mp3')) audioUS = p.audio;
          else if (p.audio.includes('-uk.mp3')) audioUK = p.audio;
          else if (!audioUS && !p.audio.includes('-au.mp3')) audioUS = p.audio;
        }
        if (p.text) {
          if (p.audio && p.audio.includes('-us.mp3')) phoneticUS = p.text;
          else if (p.audio && p.audio.includes('-uk.mp3')) phoneticUK = p.text;
          else if (!phoneticUS) phoneticUS = p.text;
        }
      });
      if (!phoneticUK && phoneticUS) phoneticUK = phoneticUS;
      if (!phoneticUS && phoneticUK) phoneticUS = phoneticUK;
    }
    return { word: entry.word, pos: meaning?.partOfSpeech || '', definition: def?.definition || '', examples: [def?.example].filter(Boolean), phoneticUS, phoneticUK, audioUS, audioUK };
  } catch (e) { return null; }
}

/* ── Word modal ── */
async function openWordModal(word, ctx, lookupOnly = false) {
  editingIdx = null; tempDefData = null;
  document.getElementById('wm-title').textContent = lookupOnly ? `"${word}"` : `Save: "${word}"`;
  document.getElementById('wm-note').value = '';
  document.getElementById('wm-ctx').value = ctx || '';
  document.getElementById('wm-def-area').innerHTML = '<span class="wsm-loading">Looking up dictionary…</span>';
  document.getElementById('word-modal').classList.add('vis');
  const def = await lookupDict(word);
  tempDefData = def;
  renderDefArea(def, word);
}

async function openEditModal(idx) {
  const item = savedWords[idx];
  editingIdx = idx; tempDefData = item;
  document.getElementById('wm-title').textContent = `Edit: "${item.word}"`;
  document.getElementById('wm-note').value = item.note || '';
  document.getElementById('wm-ctx').value = item.ctx || '';
  document.getElementById('wm-def-area').innerHTML = '<span class="wsm-loading">Looking up…</span>';
  document.getElementById('word-modal').classList.add('vis');
  const def = await lookupDict(item.word);
  if (def) tempDefData = { ...item, ...def };
  renderDefArea(tempDefData, item.word);
}

function renderDefArea(def, wordToSpeak) {
  const wS = wordToSpeak.replace(/'/g, "\\'");
  if (!def || !def.definition) {
    document.getElementById('wm-def-area').innerHTML = `
      <div class="wsm-def-block">
        <strong style="font-size:14px">${wordToSpeak}</strong>
        <div style="display:flex;gap:8px;margin-top:6px;margin-bottom:6px">
          <button class="audio-btn" onclick="playPronunciation(event,'${wS}','US','')">🔊 US</button>
          <button class="audio-btn" onclick="playPronunciation(event,'${wS}','UK','')">🔊 UK</button>
        </div>
        <div style="font-size:13px;color:var(--text3);font-style:italic">No definition found.</div>
      </div>`;
    return;
  }
  const audUS = (def.audioUS || '').replace(/'/g, "\\'"), audUK = (def.audioUK || '').replace(/'/g, "\\'");
  document.getElementById('wm-def-area').innerHTML = `
    <div class="wsm-def-block">
      <strong style="font-size:14px">${def.word}</strong>
      ${def.pos ? `<em style="font-size:12px;color:#1a4a6a;margin-left:6px">${def.pos}</em>` : ''}
      <div style="display:flex;gap:8px;margin-top:6px;margin-bottom:6px">
        <button class="audio-btn" onclick="playPronunciation(event,'${wS}','US','${audUS}')">🔊 US <span style="opacity:.8">${def.phoneticUS || ''}</span></button>
        <button class="audio-btn" onclick="playPronunciation(event,'${wS}','UK','${audUK}')">🔊 UK <span style="opacity:.8">${def.phoneticUK || ''}</span></button>
      </div>
      <div style="margin-top:5px;font-size:13px">${def.definition}</div>
      ${def.examples?.length ? `<div class="wsm-examples">"${def.examples[0]}"</div>` : ''}
    </div>`;
  if (!document.getElementById('wm-note').value && def.definition)
    document.getElementById('wm-note').value = def.definition;
}

function closeWordModal() {
  document.getElementById('word-modal').classList.remove('vis');
  editingIdx = null; tempDefData = null;
}

function confirmSaveWord() {
  const note = document.getElementById('wm-note').value.trim();
  const ctx = document.getElementById('wm-ctx').value.trim();
  const defEl = document.getElementById('wm-def-area').querySelector('.wsm-def-block');
  const def = defEl ? defEl.querySelector('div:nth-of-type(2)')?.textContent.trim() : '';
  const word = editingIdx !== null
    ? savedWords[editingIdx].word
    : (pendingWord || document.getElementById('wm-title').textContent.replace(/^(Save|Edit): "/, '').replace(/"$/, ''));
  const dataToSave = { word, note, ctx, def, updatedAt: Date.now(), phoneticUS: tempDefData?.phoneticUS || '', phoneticUK: tempDefData?.phoneticUK || '', audioUS: tempDefData?.audioUS || '', audioUK: tempDefData?.audioUK || '' };
  if (editingIdx !== null) {
    savedWords[editingIdx] = { ...savedWords[editingIdx], ...dataToSave };
  } else {
    const ei = savedWords.findIndex(w => w.word.toLowerCase() === word.toLowerCase());
    if (ei >= 0) { if (!confirm(`"${word}" already saved. Update?`)) return; savedWords[ei] = { ...savedWords[ei], ...dataToSave }; }
    else savedWords.push({ ...dataToSave, scenario: window._currentScenario?.id || '', addedAt: Date.now(), due: Date.now(), interval: 1, reps: 0, aiExample: null });
  }
  persist(); closeWordModal(); updateFCPill(); listSubTab = getDefaultListTab(); renderFC();
}

function deleteWord(idx) {
  if (!confirm(`Remove "${savedWords[idx].word}"?`)) return;
  savedWords.splice(idx, 1); persist(); updateFCPill(); listSubTab = getDefaultListTab(); renderFC();
}

/* ── AI example for a word ── */
async function loadAiExample(idx) {
  const btn = document.getElementById(`ai-ex-btn-${idx}`);
  if (btn) { btn.disabled = true; btn.textContent = 'Loading…'; }
  const word = savedWords[idx].word;
  const stage = getStage(savedWords[idx]);
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: `Give one short example sentence using the word or phrase "${word}" in a professional project management context. The sentence should be appropriate for ${stage.label} level English learners. Also state which CEFR level (A1/A2/B1/B2/C1/C2) the sentence is. Reply ONLY in this JSON format with no preamble or markdown: {"sentence":"...","level":"B1"}` }]
      })
    });
    const data = await resp.json();
    const raw = data.content?.find(c => c.type === 'text')?.text || '';
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    savedWords[idx].aiExample = { sentence: parsed.sentence, level: parsed.level, addedAt: Date.now() };
    persist();
    renderFCBody();
  } catch (e) {
    const btn = document.getElementById(`ai-ex-btn-${idx}`);
    if (btn) { btn.disabled = false; btn.textContent = '+ AI example'; }
  }
}

function removeAiExample(idx) {
  savedWords[idx].aiExample = null; persist(); renderFCBody();
}

/* ── Flashcard rendering ── */
function renderFC() {
  const anchor = document.getElementById('fc-anchor');
  if (!anchor) return;
  if (!savedWords.length) {
    anchor.innerHTML = `<div class="fc-panel" style="margin-top:1rem">
      <div class="fc-hd"><span class="fc-hd-title">📚 Vocabulary Review</span></div>
      <div class="empty-fc">Select any word or phrase in the dialogue above to save it here for spaced-repetition practice.</div>
    </div>`;
    return;
  }
  const due = savedWords.filter(w => w.due <= Date.now());
  anchor.innerHTML = `<div class="fc-panel">
    <div class="fc-hd">
      <span class="fc-hd-title">📚 Vocabulary Review</span>
      <div class="fc-hd-right"><span class="fc-count">${savedWords.length} saved · ${due.length} due</span></div>
    </div>
    <div class="tab-row">
      <button class="tab-btn ${fcTab === 'study' ? 'on' : ''}" onclick="switchFCTab('study')">Study cards</button>
      <button class="tab-btn ${fcTab === 'list' ? 'on' : ''}"  onclick="switchFCTab('list')">All words</button>
    </div>
    <div class="fc-body" id="fc-body">${fcTab === 'study' ? renderStudy() : renderListPanel()}</div>
  </div>`;
}

function renderFCBody() {
  const b = document.getElementById('fc-body');
  if (b) b.innerHTML = fcTab === 'study' ? renderStudy() : renderListPanel();
}

function switchFCTab(tab) { fcTab = tab; fcIdx = 0; fcFlipped = false; renderFCBody(); }

function renderStudy() {
  const studySet = savedWords.filter(w => w.due <= Date.now());
  if (!studySet.length) {
    const next = Math.min(...savedWords.map(w => w.due));
    const mins = Math.round((next - Date.now()) / 60000);
    return `<div class="empty-fc">🎉 All caught up!${mins > 0 ? ` Next review in ${mins < 60 ? mins + 'm' : Math.round(mins / 60) + 'h'}` : ''}</div>`;
  }
  const item = studySet[Math.min(fcIdx, studySet.length - 1)];
  const wS = item.word.replace(/'/g, "\\'");
  const aUS = (item.audioUS || '').replace(/'/g, "\\'"), aUK = (item.audioUK || '').replace(/'/g, "\\'");
  const stage = getStage(item);
  const globalIdx = savedWords.indexOf(item);

  return `<div class="fc-study">
    <div class="fc-card-wrap">
      <div class="fc-card ${fcFlipped ? 'flipped' : ''}" id="fc-card" onclick="flipCard()">
        <div class="fc-face fc-front">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <div class="fc-word">${item.word}</div>
            <span class="si-stage" style="background:${stage.bg};color:${stage.color}">${stage.label}</span>
          </div>
          <div class="fc-pron-row">
            <button class="audio-btn" onclick="playPronunciation(event,'${wS}','US','${aUS}')">🔊 US ${item.phoneticUS || ''}</button>
            <button class="audio-btn" onclick="playPronunciation(event,'${wS}','UK','${aUK}')">🔊 UK ${item.phoneticUK || ''}</button>
          </div>
          ${item.ctx ? `<div class="fc-context">"${item.ctx.substring(0, 120)}${item.ctx.length > 120 ? '…' : ''}"</div>` : ''}
          <div class="fc-hint" style="margin-top:12px">Click to reveal · reviewed ${item.reps || 0}×</div>
        </div>
        <div class="fc-face fc-back">
          <div class="fc-def">${item.def || '(no definition)'}</div>
          ${item.note && item.note !== item.def ? `<div class="fc-custom">📝 ${item.note}</div>` : ''}
          ${item.aiExample ? `<div class="fc-ai-ex"><div class="fc-ai-ex-label">AI Example · ${item.aiExample.level}</div>${item.aiExample.sentence}</div>` : ''}
          <div class="fc-hint" style="margin-top:14px">How well did you remember?</div>
        </div>
      </div>
    </div>
    ${fcFlipped ? `<div class="fc-actions">
      <button class="fc-act-btn fc-again" onclick="rateCard('${wS}','again')">😓 Again</button>
      <button class="fc-act-btn fc-good"  onclick="rateCard('${wS}','good')">👍 Good</button>
      <button class="fc-act-btn fc-easy"  onclick="rateCard('${wS}','easy')">⭐ Easy</button>
    </div>` : ''}
    <div class="fc-nav">
      <button class="fc-nav-btn" onclick="fcMove(-1)" ${fcIdx === 0 ? 'disabled' : ''}>←</button>
      <span class="fc-pos">${Math.min(fcIdx + 1, studySet.length)} / ${studySet.length}</span>
      <button class="fc-nav-btn" onclick="fcMove(1)" ${fcIdx >= studySet.length - 1 ? 'disabled' : ''}>→</button>
    </div>
    ${!item.aiExample ? `<button class="si-ai-btn" id="ai-ex-btn-${globalIdx}" onclick="loadAiExample(${globalIdx})">✦ Load AI example</button>` : ''}
  </div>`;
}

function renderListPanel() {
  const stageCounts = {};
  STAGES.forEach(s => stageCounts[s.id] = 0);
  savedWords.forEach(w => { const s = getStage(w); stageCounts[s.id]++; });

  const subTabs = [
    { id: 'all', label: 'All', color: 'var(--text2)', warn: false },
    ...STAGES.map(s => ({ id: s.id, label: s.label, color: s.color, warn: s.id !== 'mastered', count: stageCounts[s.id] }))
  ];

  if (!listSubTab) listSubTab = getDefaultListTab();

  const tabsHtml = subTabs.map(t => {
    const cnt = t.id === 'all' ? savedWords.length : (stageCounts[t.id] || 0);
    const isWarn = t.warn && cnt > 0;
    return `<button class="aw-stab ${listSubTab === t.id ? 'on' : ''} ${isWarn ? 'warn' : ''}"
      onclick="switchListSubTab('${t.id}')">${t.label}
      <span class="aw-count-badge" style="background:${t.id === 'all' ? 'var(--surf3)' : STAGES.find(s => s.id === t.id)?.bg || 'var(--surf3)'};color:${t.id === 'all' ? 'var(--text2)' : t.color}">${cnt}</span>
    </button>`;
  }).join('');

  const filtered = listSubTab === 'all' ? savedWords : savedWords.filter(w => getStage(w).id === listSubTab);

  const legendHtml = `<div class="stage-legend">
    ${STAGES.map(s => `<div class="sl-item"><div class="sl-dot" style="background:${s.color}"></div><span style="color:${s.color};font-weight:600">${s.label}</span> ${s.min === s.max ? s.min : s.min + '–' + s.max} reviews</div>`).join('')}
  </div>`;

  const listHtml = !filtered.length
    ? `<div class="empty-fc">No words in this stage yet.</div>`
    : `<div class="saved-list">${filtered.map(w => {
        const idx = savedWords.indexOf(w);
        const stage = getStage(w);
        const wS = w.word.replace(/'/g, "\\'");
        const aUS = (w.audioUS || '').replace(/'/g, "\\'"), aUK = (w.audioUK || '').replace(/'/g, "\\'");
        return `<div class="saved-item stage-${stage.id}">
          <div class="si-word-col">
            <div class="si-word">${w.word}</div>
            <div class="si-pron">
              <span style="cursor:pointer" onclick="playPronunciation(event,'${wS}','US','${aUS}')">🔊 US</span> |
              <span style="cursor:pointer" onclick="playPronunciation(event,'${wS}','UK','${aUK}')">🔊 UK</span>
            </div>
            <span class="si-stage" style="background:${stage.bg};color:${stage.color}">${stage.label}</span>
            <span class="si-reps">${w.reps || 0}× reviewed</span>
          </div>
          <div style="flex:1">
            <div class="si-def">${w.note || w.def || '—'}</div>
            ${w.aiExample ? `<div class="si-ai-ex">
              <span style="font-size:10px;font-weight:700;color:#7c5fc5">AI · ${w.aiExample.level}</span> ${w.aiExample.sentence}
              <button class="si-ai-rm" onclick="removeAiExample(${idx})">✕ remove</button>
            </div>` : `<button class="si-ai-btn" id="ai-ex-btn-${idx}" style="margin-top:5px" onclick="loadAiExample(${idx})">✦ Load AI example</button>`}
          </div>
          <div class="si-actions">
            <span class="si-due">${w.due <= Date.now() ? '<span style="color:#d97706;font-weight:700">Due now</span>' : dueLabel(w.due)}</span>
            <button class="si-edit" onclick="openEditModal(${idx})">Edit</button>
            <button class="si-del" onclick="deleteWord(${idx})">✕</button>
          </div>
        </div>`;
      }).join('')}</div>`;

  return `<div class="aw-subtabs">${tabsHtml}</div>
    <div style="padding:10px 0 0">${legendHtml}${listHtml}</div>`;
}

function switchListSubTab(tab) { listSubTab = tab; renderFCBody(); }

function dueLabel(ts) {
  const m = Math.round((ts - Date.now()) / 60000);
  if (m < 60) return `in ${m}m`;
  if (m < 1440) return `in ${Math.round(m / 60)}h`;
  return `in ${Math.round(m / 1440)}d`;
}

function flipCard() {
  fcFlipped = !fcFlipped;
  const c = document.getElementById('fc-card');
  if (c) c.classList.toggle('flipped', fcFlipped);
  const b = document.getElementById('fc-body');
  if (b) b.innerHTML = renderStudy();
}

function fcMove(d) {
  const due = savedWords.filter(w => w.due <= Date.now());
  fcIdx = Math.max(0, Math.min(fcIdx + d, due.length - 1));
  fcFlipped = false;
  renderFCBody();
}

function rateCard(word, rating) {
  const idx = savedWords.findIndex(w => w.word === word);
  if (idx < 0) return;
  const w = savedWords[idx];
  const intervals = { again: 1, good: Math.max(1, (w.interval || 1) * 2), easy: Math.max(1, (w.interval || 1) * 4) };
  w.interval = intervals[rating];
  w.due = Date.now() + w.interval * 60 * 1000;
  w.reps = (w.reps || 0) + (rating === 'again' ? 0 : 1);
  if (rating !== 'again') fcIdx = Math.max(0, fcIdx - 1);
  persist(); updateFCPill(); renderFCBody();
}
