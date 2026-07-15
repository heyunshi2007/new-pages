/**
 * wrong-book.js — 错题本模块
 * 自动收集错题，支持按科目查看和重做
 * 数据存储在 localStorage
 */
window.WrongBook = (function() {
  const STORAGE_KEY = 'ps-wrong-book';

  // 获取所有错题
  function getAll() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch(e) { return []; }
  }

  // 保存
  function save(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  // 添加错题
  function add(item) {
    // item = { subject: 'math'|'chinese'|'english', grade: 1-6, question: string, correctAnswer, userAnswer: string, timestamp: number }
    const items = getAll();
    // 去重：同一道题只存一次（根据question+subject判断）
    const exists = items.find(i => i.question === item.question && i.subject === item.subject);
    if (!exists) {
      items.push(item);
      save(items);
    }
  }

  // 按科目获取错题
  function getBySubject(subject, grade) {
    return getAll().filter(i => i.subject === subject && (grade ? i.grade === grade : true));
  }

  // 删除错题
  function remove(index) {
    const items = getAll();
    items.splice(index, 1);
    save(items);
  }

  // 清空某科目错题
  function clearSubject(subject) {
    const items = getAll().filter(i => i.subject !== subject);
    save(items);
  }

  // 清空全部
  function clearAll() {
    localStorage.removeItem(STORAGE_KEY);
  }

  // 获取各科目错题数量统计
  function getStats() {
    const items = getAll();
    return {
      total: items.length,
      math: items.filter(i => i.subject === 'math').length,
      chinese: items.filter(i => i.subject === 'chinese').length,
      english: items.filter(i => i.subject === 'english').length,
    };
  }

  // 渲染错题本页面
  function render(container) {
    const stats = getStats();
    container.innerHTML = `
      <div class="max-w-2xl mx-auto">
        <h2 class="text-2xl font-bold mb-6 text-center" style="color:#2D3436">📚 错题本</h2>

        <!-- 统计卡片 -->
        <div class="grid grid-cols-4 gap-3 mb-6">
          <div class="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
            <div class="text-3xl font-bold text-gray-800">${stats.total}</div>
            <div class="text-sm text-gray-500 mt-1">全部</div>
          </div>
          <div class="bg-orange-50 rounded-2xl p-4 text-center shadow-sm border border-orange-100">
            <div class="text-3xl font-bold" style="color:#FF7043">${stats.math}</div>
            <div class="text-sm mt-1" style="color:#FF7043">数学</div>
          </div>
          <div class="bg-blue-50 rounded-2xl p-4 text-center shadow-sm border border-blue-100">
            <div class="text-3xl font-bold" style="color:#42A5F5">${stats.chinese}</div>
            <div class="text-sm mt-1" style="color:#42A5F5">语文</div>
          </div>
          <div class="bg-green-50 rounded-2xl p-4 text-center shadow-sm border border-green-100">
            <div class="text-3xl font-bold" style="color:#66BB6A">${stats.english}</div>
            <div class="text-sm mt-1" style="color:#66BB6A">英语</div>
          </div>
        </div>

        <!-- 科目标签 -->
        <div class="flex gap-2 mb-4 flex-wrap" id="wrongBookTabs">
          <button class="px-4 py-2 rounded-full text-sm font-semibold bg-gray-800 text-white" onclick="WrongBook._showList('all', this)">全部</button>
          <button class="px-4 py-2 rounded-full text-sm font-semibold bg-white text-gray-600 border border-gray-200 hover:bg-gray-50" onclick="WrongBook._showList('math', this)">🔢 数学</button>
          <button class="px-4 py-2 rounded-full text-sm font-semibold bg-white text-gray-600 border border-gray-200 hover:bg-gray-50" onclick="WrongBook._showList('chinese', this)">📝 语文</button>
          <button class="px-4 py-2 rounded-full text-sm font-semibold bg-white text-gray-600 border border-gray-200 hover:bg-gray-50" onclick="WrongBook._showList('english', this)">🔤 英语</button>
        </div>

        <!-- 错题列表 -->
        <div id="wrongBookList"></div>

        ${stats.total > 0 ? `
        <div class="mt-6 text-center">
          <button class="px-6 py-3 bg-red-100 text-red-600 rounded-xl font-semibold hover:bg-red-200 transition" onclick="if(confirm('确定清空所有错题吗？')){WrongBook.clearAll();WrongBook.render(document.getElementById('app'))}">
            🗑️ 清空全部错题
          </button>
        </div>` : ''}

        <div class="mt-4 text-center">
          <button class="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-semibold hover:bg-gray-200 transition" onclick="App.goHome()">
            🏠 返回首页
          </button>
        </div>
      </div>
    `;

    // 默认显示全部
    const listEl = container.querySelector('#wrongBookList');
    if (listEl) {
      WrongBook._showList('all', container.querySelector('#wrongBookTabs button'));
    }
  }

  // 内部方法：显示错题列表
  function _showList(subject, btnEl) {
    // 更新标签样式
    const tabs = document.querySelectorAll('#wrongBookTabs button');
    tabs.forEach(t => { t.className = 'px-4 py-2 rounded-full text-sm font-semibold bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'; });
    if (btnEl) btnEl.className = 'px-4 py-2 rounded-full text-sm font-semibold bg-gray-800 text-white';

    const listEl = document.getElementById('wrongBookList');
    if (!listEl) return;

    const items = subject === 'all' ? getAll() : getBySubject(subject);

    if (items.length === 0) {
      listEl.innerHTML = '<div class="text-center py-8 text-gray-400">暂无错题，继续保持！ 🎉</div>';
      return;
    }

    const subjectIcons = { math: '🔢', chinese: '📝', english: '🔤' };
    const subjectColors = { math: '#FF7043', chinese: '#42A5F5', english: '#66BB6A' };

    listEl.innerHTML = items.map((item, i) => `
      <div class="bg-white rounded-xl p-4 mb-3 border border-gray-100 shadow-sm flex items-start gap-3">
        <span class="text-xl">${subjectIcons[item.subject] || '❓'}</span>
        <div class="flex-1">
          <div class="font-semibold text-gray-800">${item.question}</div>
          <div class="text-sm text-gray-500 mt-1">
            正确答案：<span class="font-bold" style="color:${subjectColors[item.subject]}">${item.correctAnswer}</span>
            ${item.userAnswer ? ` | 你的答案：<span class="text-red-500 line-through">${item.userAnswer}</span>` : ''}
          </div>
          <div class="text-xs text-gray-400 mt-1">${item.grade || ''}年级 · ${new Date(item.timestamp).toLocaleDateString('zh-CN')}</div>
        </div>
        <button class="text-gray-400 hover:text-red-500 text-sm px-2 py-1" onclick="WrongBook.remove(${i});WrongBook.render(document.getElementById('app'))">✕</button>
      </div>
    `).join('');
  }

  return {
    getAll,
    add,
    getBySubject,
    remove,
    clearSubject,
    clearAll,
    getStats,
    render,
    _showList
  };
})();