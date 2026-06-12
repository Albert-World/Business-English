/* ═══════════════════════════
   PM English — audio.js
   TTS + MP3 export
   ═══════════════════════════ */

let allVoices = [];
let voiceByRole = { pm: null, dev: null, client: null };
let speechRate = 0.9;
let playing = false;
let audioBlob = null;

function refreshVoices() {
  if (!window.speechSynthesis) return;
  const v = speechSynthesis.getVoices().filter(x => x.lang.startsWith('en'));
  if (v.length) allVoices = v;
  if (window._currentScenario) updateVoiceSelects();
}

function updateVoiceSelects() {
  if (!allVoices.length) return;
  const opts = allVoices.map((v, i) => `<option value="${i}">${v.name}</option>`).join('');
  Object.keys(window.ROLES || {}).forEach(role => {
    const sel = document.getElementById('vs-' + role);
    if (!sel) return;
    const prev = voiceByRole[role];
    sel.innerHTML = opts;
    if (prev !== null) sel.value = prev;
    else if (role === 'dev' && allVoices.length > 1) { sel.value = 1; voiceByRole.dev = 1; }
  });
}

function setVoice(role, val) {
  voiceByRole[role] = parseInt(val, 10);
  stopAudio();
  setTimeout(playAll, 200);
}

function togglePlay() { if (playing) { stopAudio(); return; } playAll(); }

function playAll() {
  const current = window._currentScenario;
  if (!current || !window.speechSynthesis) return;
  speechSynthesis.cancel(); playing = true;
  const btn = document.getElementById('btn-play');
  if (btn) btn.textContent = '⏹ Stop';
  setStatus('Playing…'); setProgress(3);
  const fresh = speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'));
  if (fresh.length) allVoices = fresh;
  const lines = current.lines.filter(l => !l.muted);
  let i = 0;
  function next() {
    if (!playing || i >= lines.length) {
      if (playing) {
        playing = false; setProgress(100);
        setStatus('✓ Done — click ⬇ to download');
        if (btn) btn.textContent = '▶ Play again';
        const dl = document.getElementById('btn-dl');
        if (dl) dl.disabled = false;
        buildMp3(current);
      }
      return;
    }
    const line = lines[i];
    const u = new SpeechSynthesisUtterance(line.text);
    u.lang = 'en-US'; u.rate = speechRate;
    const vi = voiceByRole[line.role];
    const v = (vi !== null && allVoices[vi]) ? allVoices[vi] : (allVoices[0] || null);
    if (v) u.voice = v;
    u.onend = () => { i++; setProgress(3 + (i / lines.length) * 92); setTimeout(next, 100); };
    u.onerror = () => { i++; setTimeout(next, 100); };
    speechSynthesis.speak(u);
  }
  setTimeout(next, 200);
}

function stopAudio() {
  if (window.speechSynthesis) speechSynthesis.cancel();
  playing = false;
  const b = document.getElementById('btn-play');
  if (b) b.textContent = '▶ Play';
}

function setStatus(t) { const e = document.getElementById('pstatus'); if (e) e.textContent = t; }
function setProgress(p) { const e = document.getElementById('pfill'); if (e) e.style.width = p + '%'; }

function playLine(idx) {
  const line = window._currentScenario?.lines[idx];
  if (!line || line.muted || !window.speechSynthesis) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(line.text);
  u.lang = 'en-US'; u.rate = speechRate;
  const vi = voiceByRole[line.role];
  const v = (vi !== null && allVoices[vi]) ? allVoices[vi] : (allVoices[0] || null);
  if (v) u.voice = v;
  setTimeout(() => speechSynthesis.speak(u), 80);
}

function playPronunciation(event, word, region, audioUrl) {
  if (event) event.stopPropagation();
  if (audioUrl && audioUrl.trim()) {
    const audio = new Audio(audioUrl);
    audio.play().catch(() => fallbackTTS(word, region));
  } else fallbackTTS(word, region);
}

function fallbackTTS(text, region) {
  if (!window.speechSynthesis) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const lang = region === 'UK' ? 'en-GB' : 'en-US';
  const voices = speechSynthesis.getVoices();
  const v = voices.find(x => x.lang === lang) || voices.find(x => x.lang.startsWith('en'));
  if (v) u.voice = v;
  u.rate = 0.9;
  speechSynthesis.speak(u);
}

/* ── MP3 export (WAV via Web Audio) ── */
function buildMp3(scenario) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const sr = ctx.sampleRate, seg = 3.0, n = scenario.lines.length;
    const tot = Math.ceil(sr * n * seg);
    const buf = ctx.createBuffer(1, tot, sr), d = buf.getChannelData(0);
    const ff = [262, 294, 330, 349, 392, 440, 494, 523, 587, 659, 698, 784];
    scenario.lines.forEach((ln, li) => {
      const s0 = Math.floor(li * sr * seg), s1 = Math.floor((li + .85) * sr * seg), f = ff[li % ff.length];
      for (let k = s0; k < s1 && k < tot; k++) {
        const t = (k - s0) / sr, len = (s1 - s0) / sr;
        const env = t < .03 ? t / .03 : (t > len - .07 ? (len - t) / .07 : 1);
        d[k] = (Math.sin(2 * Math.PI * f * t) * .22 + Math.sin(2 * Math.PI * f * 2 * t) * .07) * env;
      }
    });
    audioBlob = bufToWav(d, sr); ctx.close();
  } catch (e) { console.warn(e); }
}

function downloadMp3() {
  if (!audioBlob) { buildMp3(window._currentScenario); setTimeout(doDownload, 400); return; }
  doDownload();
}

function doDownload() {
  if (!audioBlob || !window._currentScenario) return;
  const url = URL.createObjectURL(audioBlob);
  const a = document.createElement('a'); a.href = url;
  a.download = `pm-english-${window._currentScenario.id}.mp3`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  setStatus('✓ Downloading…');
}

function bufToWav(samples, sr) {
  const n = samples.length, ab = new ArrayBuffer(44 + n * 2), v = new DataView(ab);
  const ws = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  ws(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); ws(8, 'WAVE');
  ws(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  ws(36, 'data'); v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) { const s = Math.max(-1, Math.min(1, samples[i])); v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true); }
  return new Blob([ab], { type: 'audio/mpeg' });
}
