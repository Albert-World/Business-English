// js/main.js
const ACCESS_CODE = 'pmenglish2025'; // 👈 Đổi mã theo ý bạn

function checkAccess() {
  const granted = sessionStorage.getItem('access_granted');
  if (granted === 'true') {
    document.getElementById('access-modal').style.display = 'none';
    document.getElementById('app-container').style.display = 'block';
    initApp();
  } else {
    document.getElementById('access-modal').style.display = 'flex';
    document.getElementById('app-container').style.display = 'none';
  }
}

function submitAccessCode() {
  const input = document.getElementById('access-code-input').value.trim();
  const errorDiv = document.getElementById('access-error');
  if (input === ACCESS_CODE) {
    sessionStorage.setItem('access_granted', 'true');
    document.getElementById('access-modal').style.display = 'none';
    document.getElementById('app-container').style.display = 'block';
    initApp();
  } else {
    errorDiv.textContent = '❌ Invalid code. Access denied.';
    document.getElementById('access-code-input').value = '';
  }
}

function initMusic() {
  const div = document.createElement('div');
  div.className = 'music-player';
  div.innerHTML = `<span>🎵 Focus</span><button id="toggle-music">🔊 Play</button><input type="range" id="music-volume" min="0" max="1" step="0.05" value="0.3">`;
  document.body.appendChild(div);
  const audio = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
  audio.loop = true; audio.volume = 0.3;
  document.getElementById('toggle-music').onclick = () => { audio.paused ? audio.play() : audio.pause(); };
  document.getElementById('music-volume').oninput = e => audio.volume = e.target.value;
}

async function initApp() {
  await loadScenarios();
  if (typeof loadCompletionData === 'function') loadCompletionData();
  refreshVoices();
  if(window.speechSynthesis) speechSynthesis.onvoiceschanged = refreshVoices;
  renderScenarioGrid();
  if (typeof updateFCPill === 'function') updateFCPill();
  setupSelectionListener();
  initMusic();
  window.addEventListener('click', e => {
    if(e.target === document.getElementById('create-modal')) closeCreateModal();
    if(e.target === document.getElementById('import-modal')) closeImportModal();
    if(e.target === document.getElementById('word-modal')) closeWordModal();
  });
}

// Gắn sự kiện
document.getElementById('submit-access-btn').addEventListener('click', submitAccessCode);
document.getElementById('access-code-input').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') submitAccessCode();
});

// Bắt đầu
checkAccess();
