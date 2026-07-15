/**
 * speech.js — 语音朗读模块
 * 使用 Web Speech API 的 SpeechSynthesis
 * 必须通过用户点击按钮触发朗读（遵守浏览器策略）
 */
window.Speech = (function() {
  // 内部状态
  let synth = window.speechSynthesis;
  let currentUtterance = null;
  let _voicesLoaded = false;
  let _cachedVoices = [];

  // 加载语音列表（异步，部分浏览器需要等待 voiceschanged 事件）
  function loadVoices() {
    if (_voicesLoaded) return _cachedVoices;
    _cachedVoices = synth.getVoices() || [];
    if (_cachedVoices.length > 0) {
      _voicesLoaded = true;
    }
    return _cachedVoices;
  }

  // 监听语音列表加载
  if (synth && synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = function() {
      _cachedVoices = synth.getVoices() || [];
      _voicesLoaded = true;
    };
  }

  // 检查是否有可用的语音
  function hasVoices() {
    if (!isSupported()) return false;
    var voices = loadVoices();
    return voices.length > 0;
  }

  // 显示语音不可用提示
  function showNoVoiceToast() {
    var existing = document.getElementById('speech-toast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.id = 'speech-toast';
    toast.className = 'fixed top-4 left-1/2 -translate-x-1/2 z-[9999] bg-amber-500 text-white px-5 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-sm font-bold';
    toast.innerHTML = '🔇 当前浏览器暂不支持语音朗读';
    document.body.appendChild(toast);
    setTimeout(function() {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.5s';
      setTimeout(function() { toast.remove(); }, 500);
    }, 2500);
  }

  // 朗读中文文本
  function speakChinese(text, rate) {
    rate = rate || 0.8;
    if (!hasVoices()) { showNoVoiceToast(); return; }
    synth.cancel();
    var utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'zh-CN';
    utter.rate = rate;
    utter.pitch = 1.2;      // 音调稍高，更清晰
    utter.volume = 1.0;     // 最大音量
    var voices = loadVoices();
    var zhVoice = voices.find(function(v) { return v.lang && v.lang.indexOf('zh') === 0; });
    if (zhVoice) utter.voice = zhVoice;
    currentUtterance = utter;
    synth.speak(utter);
  }

  // 朗读英文文本
  function speakEnglish(text, rate) {
    rate = rate || 0.8;
    if (!hasVoices()) { showNoVoiceToast(); return; }
    synth.cancel();
    var utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    utter.rate = rate;
    utter.pitch = 1.2;      // 音调稍高，更清晰
    utter.volume = 1.0;     // 最大音量
    var voices = loadVoices();
    var enVoice = voices.find(function(v) { return v.lang && v.lang.indexOf('en') === 0; });
    if (enVoice) utter.voice = enVoice;
    currentUtterance = utter;
    synth.speak(utter);
  }

  // 朗读数学算式（如 "3 + 5 = 8" 读作 "三加五等于八"）
  function speakMath(expression) {
    var text = expression
      .replace(/\+/g, '加')
      .replace(/-/g, '减')
      .replace(/×/g, '乘以')
      .replace(/÷/g, '除以')
      .replace(/=/g, '等于');
    speakChinese(text, 0.7);
  }

  // 停止朗读
  function stop() {
    if (synth) synth.cancel();
  }

  // 检查是否支持
  function isSupported() {
    return 'speechSynthesis' in window;
  }

  return {
    speakChinese: speakChinese,
    speakEnglish: speakEnglish,
    speakMath: speakMath,
    stop: stop,
    isSupported: isSupported,
    hasVoices: hasVoices
  };
})();
