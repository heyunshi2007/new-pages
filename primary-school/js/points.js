/**
 * points.js — 学习积分与勋章系统
 * 数据存储在 localStorage，刷新不丢失
 */
window.Points = (function() {
  const STORAGE_KEY = 'ps-points';
  const MEDALS_KEY = 'ps-medals';

  // 勋章定义
  const MEDALS_DEF = [
    { id: 'first_practice', name: '初次练习', icon: '🌱', desc: '完成第一次练习' },
    { id: 'score_10', name: '小试牛刀', icon: '⭐', desc: '累计获得10分' },
    { id: 'score_50', name: '学习达人', icon: '🌟', desc: '累计获得50分' },
    { id: 'score_100', name: '百分校尉', icon: '🏆', desc: '累计获得100分' },
    { id: 'score_500', name: '学霸之星', icon: '👑', desc: '累计获得500分' },
    { id: 'perfect_cn', name: '语文满分', icon: '📖', desc: '语文练习满分通关' },
    { id: 'perfect_math', name: '数学满分', icon: '🔢', desc: '数学练习满分通关' },
    { id: 'perfect_en', name: '英语满分', icon: '🔤', desc: '英语练习满分通关' },
    { id: 'streak_5', name: '连胜五题', icon: '🔥', desc: '连续答对5题' },
    { id: 'streak_10', name: '连胜十题', icon: '💪', desc: '连续答对10题' },
    { id: 'streak_20', name: '连胜二十题', icon: '🎯', desc: '连续答对20题' },
    { id: 'wrong_master', name: '错题克星', icon: '📚', desc: '重做错题全对' },
    { id: 'all_grades', name: '全科探险家', icon: '🗺️', desc: '每个年级都练习过' },
  ];

  // 获取当前积分
  function getPoints() {
    return parseInt(localStorage.getItem(STORAGE_KEY) || '0');
  }

  // 增加积分
  function addPoints(n) {
    const current = getPoints();
    const updated = current + n;
    localStorage.setItem(STORAGE_KEY, updated.toString());
    checkMedals();
    return updated;
  }

  // 减少积分（可选）
  function deductPoints(n) {
    const current = getPoints();
    const updated = Math.max(0, current - n);
    localStorage.setItem(STORAGE_KEY, updated.toString());
    return updated;
  }

  // 获取已解锁勋章
  function getMedals() {
    try {
      return JSON.parse(localStorage.getItem(MEDALS_KEY) || '[]');
    } catch(e) {
      return [];
    }
  }

  // 解锁勋章
  function unlockMedal(medalId) {
    const medals = getMedals();
    if (!medals.includes(medalId)) {
      medals.push(medalId);
      localStorage.setItem(MEDALS_KEY, JSON.stringify(medals));
      const def = MEDALS_DEF.find(m => m.id === medalId);
      if (def) {
        showMedalToast(def);
      }
    }
  }

  // 检查是否应该解锁勋章
  function checkMedals() {
    const pts = getPoints();
    if (pts >= 10) unlockMedal('score_10');
    if (pts >= 50) unlockMedal('score_50');
    if (pts >= 100) unlockMedal('score_100');
    if (pts >= 500) unlockMedal('score_500');
  }

  // 获取所有勋章定义
  function getAllMedals() {
    return MEDALS_DEF;
  }

  // 获取勋章详情（含是否已解锁）
  function getMedalStatus() {
    const unlocked = getMedals();
    return MEDALS_DEF.map(m => ({
      ...m,
      unlocked: unlocked.includes(m.id)
    }));
  }

  // 显示解锁toast通知
  function showMedalToast(medal) {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 left-1/2 -translate-x-1/2 z-[9999] bg-gradient-to-r from-yellow-400 to-amber-500 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce';
    toast.innerHTML = `<span class="text-2xl">${medal.icon}</span><span class="font-bold">解锁勋章：${medal.name}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.5s';
      setTimeout(() => toast.remove(), 500);
    }, 3000);
  }

  return {
    getPoints,
    addPoints,
    deductPoints,
    getMedals,
    unlockMedal,
    checkMedals,
    getAllMedals,
    getMedalStatus
  };
})();
