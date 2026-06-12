// js/main.js
function initMusic() {
  const playerDiv = document.createElement('div');
  playerDiv.className = 'music-player';
  playerDiv.innerHTML = `<span>🎵 Focus</span><button class="music-btn" id="toggle-music">🔊 Play</button><input type="range" id="music-volume" min="0" max="1" step="0.05" value="0.3">`;
  document.body.appendChild(playerDiv);
  const audio = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
  audio.loop = true;
  audio.volume = 0.3;
  document.getElementById('toggle-music').onclick = () => {
    if(audio.paused) { audio.play(); document.getElementById('toggle-music').innerHTML = '🔇 Mute'; }
    else { audio.pause(); document.getElementById('toggle-music').innerHTML = '🔊 Play'; }
  };
  document.getElementById('music-volume').oninput = (e) => { audio.volume = e.target.value; };
}

async function initApp() {
  await loadScenarios();
  loadCompletionData();      // từ scenarios.js
  refreshVoices();
  if(window.speechSynthesis) speechSynthesis.onvoiceschanged = refreshVoices;
  renderScenarioGrid();
  updateFCPill();
  setupSelectionListener();
  initMusic();
  window.addEventListener('click', e => {
    if (e.target === document.getElementById('create-modal')) closeCreateModal();
    if (e.target === document.getElementById('import-modal')) closeImportModal();
    if (e.target === document.getElementById('word-modal')) closeWordModal();
  });
}

initApp();
