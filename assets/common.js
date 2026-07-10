// 公共脚本：被各游戏页共用（音效模块）
// 轻量 WebAudio 蜂鸣声，支持一键静音。各游戏通过 beep() 触发不同事件音。
let soundOn = true;
let audioCtx = null;

function beep(freq, duration, type, vol) {
  if (!soundOn) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type || 'square';
    o.frequency.value = freq || 440;
    g.gain.value = vol || 0.04;
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + (duration || 0.08));
    o.stop(audioCtx.currentTime + (duration || 0.08));
  } catch (e) {}
}

function toggleSound() {
  soundOn = !soundOn;
  const btn = document.getElementById('soundBtn');
  if (btn) btn.textContent = soundOn ? '🔊 音效' : '🔇 静音';
}
