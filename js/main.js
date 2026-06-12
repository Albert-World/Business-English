// js/main.js
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
  loadCompletionData(); // phải có hàm này (đã export trong scenarios.js)
  refreshVoices();
  if(window.speechSynthesis) speechSynthesis.onvoiceschanged = refreshVoices;
  renderScenarioGrid();
  updateFCPill(); // từ vocab.js
  setupSelectionListener();
  initMusic();
  // Đóng modal khi click ra ngoài
  window.addEventListener('click', e => {
    if(e.target === document.getElementById('create-modal')) closeCreateModal();
    if(e.target === document.getElementById('import-modal')) closeImportModal();
    if(e.target === document.getElementById('word-modal')) closeWordModal();
  });
}

initApp();
