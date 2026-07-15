/**
 * app.js — 核心路由和页面渲染模块
 * 挂载在 window.App 下，管理 SPA 路由、页面切换和底部导航
 *
 * 依赖：
 *   - window.Points（points.js）
 *   - window.WrongBook（wrong-book.js）
 *   - window.ChineseApp（chinese.js）
 *   - window.MathApp（math.js）
 *   - window.EnglishApp（english.js）
 */
window.App = (function () {
  'use strict';

  // ==================== 常量 ====================

  // 年级中文名称
  var GRADE_NAMES = {
    1: '一年级', 2: '二年级', 3: '三年级',
    4: '四年级', 5: '五年级', 6: '六年级'
  };

  // 年级数字颜色（每个年级用不同颜色）
  var GRADE_COLORS = {
    1: '#FF7043', 2: '#FFA726', 3: '#42A5F5',
    4: '#66BB6A', 5: '#AB47BC', 6: '#EF5350'
  };

  // 年级数字浅色背景
  var GRADE_BG_COLORS = {
    1: '#FFF3E0', 2: '#FFF8E1', 3: '#E3F2FD',
    4: '#E8F5E9', 5: '#F3E5F5', 6: '#FFEBEE'
  };

  // 科目配置
  var SUBJECTS = {
    chinese: { name: '语文', icon: '📝', color: '#FF7043', bg: '#FFF3E0', desc: '生字听写·古诗·拼音' },
    math:    { name: '数学', icon: '🔢', color: '#42A5F5', bg: '#E3F2FD', desc: '口算练习·限时挑战' },
    english: { name: '英语', icon: '🔤', color: '#66BB6A', bg: '#E8F5E9', desc: '单词跟读·选择题' }
  };

  // ==================== 路由状态 ====================

  // 当前页面状态
  var state = {
    page: 'home',     // home | grade | subject | wrong-book | medals | settings
    grade: null,      // 1-6
    subject: null,    // chinese | math | english
    params: {}        // 额外参数
  };

  // 获取 #app 容器
  function getAppEl() {
    return document.getElementById('app');
  }

  // ==================== 路由方法 ====================

  /**
   * 导航到指定路径
   * 支持格式：#home, #grade/1, #chinese/1, #math/1, #english/1, #wrong-book, #medals, #settings
   */
  function navigate(path) {
    // 更新 hash（不触发多余的 hashchange，直接调用 _route）
    if (path.indexOf('#') === 0) {
      path = path.substring(1);
    }

    // 解析路径
    var parts = path.split('/');
    var page = parts[0];
    var grade = parts[1] ? parseInt(parts[1], 10) : null;

    // 更新状态
    state.page = page;
    state.grade = grade;
    state.subject = (page === 'chinese' || page === 'math' || page === 'english') ? page : null;
    state.params = {};

    // 设置 hash（触发 hashchange 事件来渲染）
    window.location.hash = path;

    // 渲染当前页面
    _route();
  }

  // 快捷导航方法
  function goHome() {
    navigate('home');
  }

  function goWrongBook() {
    navigate('wrong-book');
  }

  function goMedals() {
    navigate('medals');
  }

  function goSettings() {
    navigate('settings');
  }

  // ==================== 页面渲染 ====================

  /**
   * 根据当前状态渲染对应页面
   */
  function _route() {
    var appEl = getAppEl();
    if (!appEl) return;

    switch (state.page) {
      case 'home':
        renderHome(appEl);
        break;
      case 'grade':
        renderGrade(appEl, state.grade);
        break;
      case 'chinese':
      case 'math':
      case 'english':
        renderSubject(appEl, state.grade, state.subject);
        break;
      case 'wrong-book':
        WrongBook.render(appEl);
        updateNav('wrong-book');
        break;
      case 'medals':
        renderMedals(appEl);
        break;
      case 'settings':
        renderSettings(appEl);
        break;
      default:
        renderHome(appEl);
    }
  }

  // ==================== 首页 ====================

  /**
   * 渲染首页
   * 包含顶部横幅、积分显示、年级选择卡片
   */
  function renderHome(container) {
    var points = Points.getPoints();

    // 构建年级卡片HTML
    var gradeCards = '';
    for (var g = 1; g <= 6; g++) {
      gradeCards +=
        '<div class="grade-card bg-white rounded-3xl p-5 shadow-sm border border-gray-100 min-h-[100px] flex flex-col items-center justify-center gap-2" ' +
        '  onclick="App.navigate(\'grade/' + g + '\')">' +
        '  <div class="text-5xl font-black" style="color:' + GRADE_COLORS[g] + '">' + g + '</div>' +
        '  <div class="text-base font-bold text-gray-600">' + GRADE_NAMES[g] + '</div>' +
        '</div>';
    }

    container.innerHTML =
      '<div class="page-with-nav">' +
        // 顶部横幅
        '<div class="relative overflow-hidden" style="background: linear-gradient(135deg, #FF7043, #FFB300, #42A5F5); padding: 2.5rem 1.5rem 2rem;">' +
          '<div class="max-w-lg mx-auto relative z-10">' +
            // 积分显示（右上角）
            '<div class="flex justify-end mb-2">' +
              '<div class="points-badge">' +
                '<span>⭐</span>' +
                '<span>' + points + ' 积分</span>' +
              '</div>' +
            '</div>' +
            // 标题
            '<h1 class="text-3xl font-black text-white mb-2">快乐学习</h1>' +
            '<p class="text-white/80 text-base">小学1-6年级语数英</p>' +
          '</div>' +
          // 装饰圆
          '<div class="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full"></div>' +
          '<div class="absolute -bottom-4 -left-4 w-24 h-24 bg-white/10 rounded-full"></div>' +
        '</div>' +

        // 年级选择区
        '<div class="max-w-lg mx-auto px-4 py-6">' +
          '<h2 class="text-lg font-bold text-gray-600 mb-4">选择年级</h2>' +
          '<div class="grid grid-cols-2 md:grid-cols-3 gap-4">' +
            gradeCards +
          '</div>' +
        '</div>' +
      '</div>';

    updateNav('home');
  }

  // ==================== 年级页 ====================

  /**
   * 渲染年级页（科目选择）
   * @param {HTMLElement} container - 容器元素
   * @param {number} grade - 年级（1-6）
   */
  function renderGrade(container, grade) {
    if (!grade || grade < 1 || grade > 6) {
      renderHome(container);
      return;
    }

    var gradeName = GRADE_NAMES[grade];

    // 构建科目卡片
    var subjectKeys = ['chinese', 'math', 'english'];
    var subjectCards = '';

    for (var i = 0; i < subjectKeys.length; i++) {
      var key = subjectKeys[i];
      var sub = SUBJECTS[key];

      subjectCards +=
        '<div class="bg-white rounded-2xl min-h-[80px] flex items-center gap-4 p-5 shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer active:scale-[0.98]" ' +
        '  style="border-left: 4px solid ' + sub.color + '" ' +
        '  onclick="App.navigate(\'' + key + '/' + grade + '\')">' +
          '<span class="text-4xl">' + sub.icon + '</span>' +
          '<div>' +
            '<div class="text-lg font-bold" style="color:' + sub.color + '">' + sub.name + '</div>' +
            '<div class="text-sm text-gray-500">' + sub.desc + '</div>' +
          '</div>' +
        '</div>';
    }

    container.innerHTML =
      '<div class="page-with-nav">' +
        '<div class="max-w-lg mx-auto px-4 py-6">' +
          // 顶部返回 + 标题
          '<div class="flex items-center gap-3 mb-6">' +
            '<button class="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition text-gray-600 text-lg" onclick="App.goHome()">' +
              '\u2190' +
            '</button>' +
            '<h2 class="text-2xl font-bold text-gray-800">' + gradeName + '</h2>' +
          '</div>' +

          // 科目卡片
          '<div class="space-y-4">' +
            subjectCards +
          '</div>' +
        '</div>' +
      '</div>';

    updateNav('home');
  }

  // ==================== 科目页分发 ====================

  /**
   * 渲染科目页面
   * 根据科目类型分发到对应模块
   * @param {HTMLElement} container - 容器元素
   * @param {number} grade - 年级
   * @param {string} subject - 科目（chinese/math/english）
   */
  function renderSubject(container, grade, subject) {
    if (!grade || !subject) {
      renderHome(container);
      return;
    }

    // 记录该年级已练习（用于"全科探险家"勋章）
    _recordGradePractice(grade);

    switch (subject) {
      case 'chinese':
        // 语文模块自行渲染到容器
        if (window.ChineseApp) {
          ChineseApp.render(grade, container);
        }
        break;
      case 'math':
        // 数学模块：先显示难度选择
        if (window.MathApp) {
          MathApp.renderLevelSelect(grade, container);
          // 监听 MathApp 触发的 navigate 事件（返回按钮）
          container.addEventListener('navigate', function _onNavigate(e) {
            container.removeEventListener('navigate', _onNavigate);
            if (e.detail && e.detail.target === 'home') {
              App.navigate('grade/' + grade);
            }
          });
        }
        break;
      case 'english':
        // 英语模块自行渲染到容器
        if (window.EnglishApp) {
          EnglishApp.render(grade, container);
        }
        break;
      default:
        renderHome(container);
        return;
    }

    updateNav('home');
  }

  // ==================== 勋章页 ====================

  /**
   * 渲染勋章展示页面
   * @param {HTMLElement} container - 容器元素
   */
  function renderMedals(container) {
    var points = Points.getPoints();
    var medalStatus = Points.getMedalStatus();

    // 统计已解锁数量
    var unlockedCount = 0;
    for (var i = 0; i < medalStatus.length; i++) {
      if (medalStatus[i].unlocked) unlockedCount++;
    }

    // 构建勋章卡片HTML
    var medalCards = '';
    for (var j = 0; j < medalStatus.length; j++) {
      var m = medalStatus[j];
      var lockedClass = m.unlocked ? '' : 'medal-card locked';

      medalCards +=
        '<div class="medal-card ' + lockedClass + ' bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center cursor-pointer' +
        '  ' + (m.unlocked ? 'onclick="App._showMedalDetail(\'' + m.id + '\')"' : '') + '">' +
          '<div class="text-4xl mb-2">' + m.icon + '</div>' +
          '<div class="text-sm font-bold text-gray-800">' + m.name + '</div>' +
          '<div class="text-xs text-gray-400 mt-1">' + (m.unlocked ? m.desc : '??') + '</div>' +
        '</div>';
    }

    container.innerHTML =
      '<div class="page-with-nav">' +
        '<div class="max-w-lg mx-auto px-4 py-6">' +
          // 标题
          '<h2 class="text-2xl font-bold text-gray-800 text-center mb-2">我的勋章</h2>' +

          // 积分显示
          '<div class="text-center mb-6">' +
            '<div class="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 text-white px-8 py-3 rounded-2xl shadow-md">' +
              '<span class="text-2xl">⭐</span>' +
              '<span class="text-3xl font-black">' + points + '</span>' +
              '<span class="text-sm">积分</span>' +
            '</div>' +
          '</div>' +

          // 已解锁统计
          '<p class="text-center text-gray-500 mb-6 text-sm">已解锁 ' + unlockedCount + ' / ' + medalStatus.length + ' 枚勋章</p>' +

          // 勋章网格
          '<div class="grid grid-cols-3 sm:grid-cols-4 gap-3">' +
            medalCards +
          '</div>' +
        '</div>' +
      '</div>';

    updateNav('medals');
  }

  /**
   * 显示勋章详情弹窗
   * @param {string} medalId - 勋章ID
   */
  function _showMedalDetail(medalId) {
    var allMedals = Points.getMedalStatus();
    var medal = null;
    for (var i = 0; i < allMedals.length; i++) {
      if (allMedals[i].id === medalId) {
        medal = allMedals[i];
        break;
      }
    }
    if (!medal || !medal.unlocked) return;

    // 创建弹窗遮罩
    var overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black/40 z-[999] flex items-center justify-center p-6';
    overlay.onclick = function (e) {
      if (e.target === overlay) overlay.remove();
    };

    overlay.innerHTML =
      '<div class="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-xl">' +
        '<div class="text-7xl mb-4">' + medal.icon + '</div>' +
        '<h3 class="text-2xl font-black text-gray-800 mb-2">' + medal.name + '</h3>' +
        '<p class="text-gray-500">' + medal.desc + '</p>' +
        '<div class="mt-6">' +
          '<button class="px-8 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition"' +
          '  onclick="this.closest(\'.fixed\').remove()">关闭</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);
  }

  // ==================== 设置页 ====================

  /**
   * 渲染设置页面
   * @param {HTMLElement} container - 容器元素
   */
  function renderSettings(container) {
    // 检查浏览器是否支持语音
    var speechSupported = window.Speech && window.Speech.isSupported();

    container.innerHTML =
      '<div class="page-with-nav">' +
        '<div class="max-w-lg mx-auto px-4 py-6">' +
          // 标题
          '<h2 class="text-2xl font-bold text-gray-800 text-center mb-6">设置</h2>' +

          // 语音设置
          '<div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">' +
            '<h3 class="text-base font-bold text-gray-700 mb-3">语音功能</h3>' +
            '<div class="setting-item">' +
              '<span class="text-gray-600">语音朗读</span>' +
              '<span class="text-sm font-medium ' + (speechSupported ? 'text-green-500' : 'text-red-400') + '">' +
                (speechSupported ? '已支持' : '不支持') +
              '</span>' +
            '</div>' +
            '<div class="text-xs text-gray-400 mt-2">' +
              (speechSupported
                ? '当前浏览器支持语音合成功能，可在练习中点击朗读按钮听取发音。'
                : '当前浏览器不支持语音合成功能，请使用 Chrome 或 Safari 浏览器。') +
            '</div>' +
          '</div>' +

          // 数据管理
          '<div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">' +
            '<h3 class="text-base font-bold text-gray-700 mb-3">数据管理</h3>' +
            '<div class="setting-item">' +
              '<div>' +
                '<div class="text-gray-600">清除全部数据</div>' +
                '<div class="text-xs text-gray-400 mt-1">清空积分、错题、勋章记录</div>' +
              '</div>' +
              '<button class="px-4 py-2 bg-red-50 text-red-500 rounded-xl text-sm font-semibold hover:bg-red-100 transition"' +
              '  onclick="App._clearAllData()">清除</button>' +
            '</div>' +
          '</div>' +

          // 关于
          '<div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">' +
            '<h3 class="text-base font-bold text-gray-700 mb-3">关于</h3>' +
            '<div class="setting-item">' +
              '<span class="text-gray-600">应用名称</span>' +
              '<span class="text-gray-800 font-medium">快乐学习</span>' +
            '</div>' +
            '<div class="setting-item">' +
              '<span class="text-gray-600">适用范围</span>' +
              '<span class="text-gray-800 font-medium">小学1-6年级</span>' +
            '</div>' +
            '<div class="setting-item">' +
              '<span class="text-gray-600">包含科目</span>' +
              '<span class="text-gray-800 font-medium">语文·数学·英语</span>' +
            '</div>' +
            '<div class="setting-item">' +
              '<span class="text-gray-600">数据存储</span>' +
              '<span class="text-gray-800 font-medium">本地离线</span>' +
            '</div>' +
          '</div>' +

        '</div>' +
      '</div>';

    updateNav('settings');
  }

  /**
   * 清除全部数据
   */
  function _clearAllData() {
    if (!confirm('确定要清除全部数据吗？\n\n包括：积分、错题本、所有勋章记录。\n此操作不可撤销。')) {
      return;
    }
    // 清空积分
    localStorage.removeItem('ps-points');
    // 清空勋章
    localStorage.removeItem('ps-medals');
    // 清空错题本
    localStorage.removeItem('ps-wrong-book');
    // 清空已练习年级记录
    localStorage.removeItem('ps-grades-practiced');
    // 重新渲染设置页
    renderSettings(getAppEl());
  }

  // ==================== 底部导航高亮 ====================

  /**
   * 更新底部导航的 active 状态
   * @param {string} page - 当前页面标识
   */
  function updateNav(page) {
    var navItems = {
      'home': 'navHome',
      'wrong-book': 'navWrong',
      'medals': 'navMedals',
      'settings': 'navSettings'
    };

    // 清除所有 active
    var allNavEls = document.querySelectorAll('.bottom-nav-item');
    for (var i = 0; i < allNavEls.length; i++) {
      allNavEls[i].classList.remove('active');
    }

    // 设置当前 active
    var activeId = navItems[page];
    if (activeId) {
      var activeEl = document.getElementById(activeId);
      if (activeEl) {
        activeEl.classList.add('active');
      }
    }
  }

  // ==================== 年级练习记录（用于"全科探险家"勋章） ====================

  var GRADES_PRACTICED_KEY = 'ps-grades-practiced';

  /**
   * 记录某个年级已练习过
   * @param {number} grade - 年级
   */
  function _recordGradePractice(grade) {
    try {
      var practiced = JSON.parse(localStorage.getItem(GRADES_PRACTICED_KEY) || '[]');
      if (practiced.indexOf(grade) === -1) {
        practiced.push(grade);
        localStorage.setItem(GRADES_PRACTICED_KEY, JSON.stringify(practiced));

        // 检查是否1-6年级都练习过
        if (practiced.length >= 6 && window.Points) {
          window.Points.unlockMedal('all_grades');
        }
      }
    } catch (e) {
      // 忽略存储异常
    }
  }

  // ==================== 初始化 ====================

  /**
   * 解析当前 hash 为路由路径
   */
  function _parseHash() {
    var hash = window.location.hash.replace('#', '') || 'home';
    return hash;
  }

  /**
   * 应用初始化
   */
  function init() {
    // 读取初始 hash 路由
    var path = _parseHash();
    var parts = path.split('/');
    state.page = parts[0];
    state.grade = parts[1] ? parseInt(parts[1], 10) : null;
    state.subject = (parts[0] === 'chinese' || parts[0] === 'math' || parts[0] === 'english') ? parts[0] : null;
    state.params = {};

    // 首次渲染
    _route();

    // 监听 hash 变化
    window.addEventListener('hashchange', function () {
      var newPath = _parseHash();
      var newParts = newPath.split('/');
      state.page = newParts[0];
      state.grade = newParts[1] ? parseInt(newParts[1], 10) : null;
      state.subject = (newParts[0] === 'chinese' || newParts[0] === 'math' || newParts[0] === 'english') ? newParts[0] : null;
      state.params = {};
      _route();
    });

    // 监听来自子模块的 navigate 自定义事件（冒泡到 document）
    document.addEventListener('navigate', function (e) {
      if (e.detail && e.detail.target) {
        switch (e.detail.target) {
          case 'home':
            App.goHome();
            break;
          case 'grade':
            if (e.detail.grade) {
              App.navigate('grade/' + e.detail.grade);
            }
            break;
        }
      }
    });
  }

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ==================== 暴露公共 API ====================
  return {
    navigate: navigate,
    goHome: goHome,
    goWrongBook: goWrongBook,
    goMedals: goMedals,
    goSettings: goSettings,
    _showMedalDetail: _showMedalDetail,
    _clearAllData: _clearAllData
  };
})();