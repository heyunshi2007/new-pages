/**
 * english.js — 小学英语单词跟读和选择题模块
 * 挂载在 window.EnglishApp 下
 *
 * 依赖：
 *   - window.ENGLISH_WORDS（来自 data/english-words.js）
 *   - window.Points（来自 points.js）
 *   - window.WrongBook（来自 wrong-book.js）
 *   - window.Speech（来自 speech.js）
 */
window.EnglishApp = (function() {
  'use strict';

  // ========== 内部工具函数 ==========

  /** Fisher-Yates 洗牌算法 */
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /** 从数组中随机取 n 个不重复元素 */
  function pickRandom(arr, n) {
    return shuffle(arr).slice(0, n);
  }

  /** 安全获取指定年级的单词列表 */
  function getWords(grade) {
    return (window.ENGLISH_WORDS && window.ENGLISH_WORDS[grade]) || [];
  }

  /** 从单词列表中提取所有不重复的分类名 */
  function getCategories(words) {
    const set = new Set();
    words.forEach(function(w) { set.add(w.category); });
    return Array.from(set);
  }

  /** 按分类分组单词 */
  function groupByCategory(words) {
    const map = {};
    words.forEach(function(w) {
      if (!map[w.category]) map[w.category] = [];
      map[w.category].push(w);
    });
    return map;
  }

  // ========== 样式常量 ==========
  var THEME = '#66BB6A';          // 绿色主题色
  var CARD_MIN_W = 'min-w-[140px]';
  var OPTION_MIN_H = 'min-h-[56px]';

  // ========== 1. 渲染入口 ==========
  /**
   * 渲染英语模块主页面
   * @param {number} grade - 年级（1~6）
   * @param {HTMLElement} container - 容器 DOM
   */
  function render(grade, container) {
    // 显示模式选择按钮
    var html =
      '<div class="flex flex-col items-center justify-center py-12 px-6 gap-6">' +
        '<h2 class="text-2xl font-bold" style="color:' + THEME + '">英语学习</h2>' +
        '<p class="text-gray-500 text-sm">选择学习模式</p>' +
        '<div class="flex flex-col sm:flex-row gap-4 mt-4 w-full max-w-lg">' +
          // 单词跟读按钮
          '<button data-mode="readaloud" class="flex-1 bg-white hover:shadow-lg transition-all duration-200 rounded-2xl p-6 border-2 border-gray-100 hover:border-[#66BB6A] flex flex-col items-center gap-3 cursor-pointer group">' +
            '<span class="text-4xl group-hover:scale-110 transition-transform">🔊</span>' +
            '<span class="text-lg font-semibold text-gray-700">单词跟读</span>' +
            '<span class="text-xs text-gray-400">听发音、学拼写</span>' +
          '</button>' +
          // 单词选择题按钮
          '<button data-mode="quiz" class="flex-1 bg-white hover:shadow-lg transition-all duration-200 rounded-2xl p-6 border-2 border-gray-100 hover:border-[#66BB6A] flex flex-col items-center gap-3 cursor-pointer group">' +
            '<span class="text-4xl group-hover:scale-110 transition-transform">✏️</span>' +
            '<span class="text-lg font-semibold text-gray-700">单词选择题</span>' +
            '<span class="text-xs text-gray-400">看中文、选英文</span>' +
          '</button>' +
          // 错题重做按钮
          '<button data-mode="wrong" class="flex-1 bg-white hover:shadow-lg transition-all duration-200 rounded-2xl p-6 border-2 border-gray-100 hover:border-[#66BB6A] flex flex-col items-center gap-3 cursor-pointer group">' +
            '<span class="text-4xl group-hover:scale-110 transition-transform">📖</span>' +
            '<span class="text-lg font-semibold text-gray-700">错题重做</span>' +
            '<span class="text-xs text-gray-400">攻克薄弱单词</span>' +
          '</button>' +
        '</div>' +
      '</div>';

    container.innerHTML = html;

    // 绑定按钮事件
    container.querySelector('[data-mode="readaloud"]').addEventListener('click', function() {
      renderReadAloud(grade, container);
    });
    container.querySelector('[data-mode="quiz"]').addEventListener('click', function() {
      renderQuiz(grade, container);
    });
    container.querySelector('[data-mode="wrong"]').addEventListener('click', function() {
      renderWrongQuiz(grade, container);
    });
  }

  // ========== 2. 渲染单词跟读 ==========
  /**
   * 渲染单词跟读页面
   * @param {number} grade - 年级
   * @param {HTMLElement} container - 容器 DOM
   */
  function renderReadAloud(grade, container) {
    var words = getWords(grade);
    var categories = getCategories(words);
    var grouped = groupByCategory(words);

    // 记录每个分类中已朗读的单词（用于积分判定）
    var spokenMap = {};  // { category: Set<word> }
    var completedCategories = {}; // 已完成并奖励积分的分类

    // 渲染主页面
    function renderPage(activeCategory) {
      var displayWords = activeCategory === '全部' ? words : (grouped[activeCategory] || []);

      // 分类筛选标签
      var tabsHtml = '<div class="flex flex-wrap gap-2 mb-6 justify-center">';
      tabsHtml += '<button data-cat="全部" class="cat-tab px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ' +
        (activeCategory === '全部' ? 'text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200') +
        '" style="' + (activeCategory === '全部' ? 'background:' + THEME : '') + '">全部</button>';
      categories.forEach(function(cat) {
        var isActive = activeCategory === cat;
        tabsHtml += '<button data-cat="' + cat + '" class="cat-tab px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ' +
          (isActive ? 'text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200') +
          '" style="' + (isActive ? 'background:' + THEME : '') + '">' + cat + '</button>';
      });
      tabsHtml += '</div>';

      // 单词卡片网格
      var cardsHtml = '<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">';
      displayWords.forEach(function(w, idx) {
        cardsHtml +=
          '<div class="word-card bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col items-center gap-2 hover:shadow-md transition-all duration-200 ' + CARD_MIN_W + '" data-word="' + w.word + '" data-category="' + w.category + '">' +
            '<span class="text-xl font-bold text-gray-800">' + w.word + '</span>' +
            '<span class="text-xs text-gray-400">' + w.phonetic + '</span>' +
            '<span class="text-sm text-gray-500">' + w.meaning + '</span>' +
            '<div class="flex gap-2 mt-2">' +
              '<button class="btn-speak-en bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer" title="朗读英文">🔊 朗读</button>' +
              '<button class="btn-speak-cn bg-red-50 hover:bg-red-100 text-red-500 rounded-xl px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer" title="朗读中文">🇨🇳 中文</button>' +
            '</div>' +
          '</div>';
      });
      cardsHtml += '</div>';

      var fullHtml =
        '<div class="max-w-4xl mx-auto px-4 py-6">' +
          // 顶部标题栏
          '<div class="flex items-center justify-between mb-6">' +
            '<button class="btn-back text-gray-500 hover:text-gray-700 transition-colors cursor-pointer flex items-center gap-1 text-sm"><span>←</span> 返回</button>' +
            '<h3 class="text-lg font-bold" style="color:' + THEME + '">单词跟读 · ' + grade + '年级</h3>' +
            '<div class="w-16"></div>' + // 占位保持居中
          '</div>' +
          tabsHtml +
          cardsHtml +
        '</div>';

      container.innerHTML = fullHtml;

      // --- 事件绑定 ---

      // 返回按钮
      container.querySelector('.btn-back').addEventListener('click', function() {
        render(grade, container);
      });

      // 分类标签切换
      container.querySelectorAll('.cat-tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
          renderPage(this.dataset.cat);
        });
      });

      // 单词卡片 - 朗读按钮
      container.querySelectorAll('.word-card').forEach(function(card) {
        var word = card.dataset.word;
        var category = card.dataset.category;

        // 初始化该分类的已朗读集合
        if (!spokenMap[category]) spokenMap[category] = new Set();

        // 朗读英文按钮
        card.querySelector('.btn-speak-en').addEventListener('click', function(e) {
          e.stopPropagation();
          window.Speech.speakEnglish(word);
          // 标记为已朗读
          markSpoken(category, word);
          // 卡片轻微弹跳动画
          card.style.animation = 'none';
          void card.offsetHeight; // 触发重绘
          card.style.animation = 'cardBounce 0.4s ease';
        });

        // 朗读中文按钮
        card.querySelector('.btn-speak-cn').addEventListener('click', function(e) {
          e.stopPropagation();
          // 从原始单词数据中查找中文释义
          var wData = words.find(function(w) { return w.word === word; });
          if (wData) {
            window.Speech.speakChinese(wData.meaning);
          }
          markSpoken(category, word);
          card.style.animation = 'none';
          void card.offsetHeight;
          card.style.animation = 'cardBounce 0.4s ease';
        });
      });
    }

    /** 标记单词已朗读，并在分类全部完成后发放积分 */
    function markSpoken(category, word) {
      if (!spokenMap[category]) spokenMap[category] = new Set();
      spokenMap[category].add(word);

      // 检查该分类是否全部朗读完毕
      var catWords = grouped[category] || [];
      var allSpoken = catWords.every(function(w) {
        return spokenMap[category] && spokenMap[category].has(w.word);
      });

      if (allSpoken && !completedCategories[category]) {
        completedCategories[category] = true;
        // 学习完一个分类的所有单词，获得2积分
        window.Points.addPoints(2);
        showToast('🎉 完成「' + category + '」分类学习，积分 +2');
      }
    }

    /** 显示提示 Toast */
    function showToast(msg) {
      var toast = document.createElement('div');
      toast.className = 'fixed top-4 left-1/2 -translate-x-1/2 z-[9999] text-white px-6 py-3 rounded-2xl shadow-xl text-sm font-medium';
      toast.style.background = THEME;
      toast.textContent = msg;
      document.body.appendChild(toast);
      setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s';
        setTimeout(function() { toast.remove(); }, 500);
      }, 2000);
    }

    // 注入弹跳动画的 keyframe
    injectBounceAnimation();

    // 默认显示"全部"分类
    renderPage('全部');
  }

  /** 注入卡片弹跳 CSS 动画 */
  function injectBounceAnimation() {
    if (document.getElementById('english-bounce-style')) return;
    var style = document.createElement('style');
    style.id = 'english-bounce-style';
    style.textContent =
      '@keyframes cardBounce {' +
        '0% { transform: scale(1); }' +
        '50% { transform: scale(1.05); }' +
        '100% { transform: scale(1); }' +
      '}';
    document.head.appendChild(style);
  }

  // ========== 3. 渲染选择题 ==========
  /**
   * 渲染英语选择题页面
   * @param {number} grade - 年级
   * @param {HTMLElement} container - 容器 DOM
   */
  function renderQuiz(grade, container) {
    var words = getWords(grade);

    // 随机抽取10道题（如果单词不足10个，则取全部）
    var totalCount = Math.min(10, words.length);
    var selectedWords = shuffle(words).slice(0, totalCount);

    // 生成每道题的选项（1正确 + 3干扰）
    var questions = selectedWords.map(function(correctWord) {
      // 从同年级其他单词中选干扰项
      var others = words.filter(function(w) { return w.word !== correctWord.word; });
      var distractors = pickRandom(others, 3);
      var options = shuffle([correctWord].concat(distractors));
      return {
        correct: correctWord,
        options: options
      };
    });

    // 状态
    var currentIndex = 0;
    var correctCount = 0;
    var totalPoints = 0;
    var answered = false; // 防止重复点击

    injectBounceAnimation();

    function renderQuestion() {
      if (currentIndex >= questions.length) {
        renderResult();
        return;
      }

      var q = questions[currentIndex];
      answered = false;

      // 进度条
      var progressHtml =
        '<div class="flex items-center gap-2 mb-4">' +
          '<span class="text-sm text-gray-500 font-medium">' + (currentIndex + 1) + ' / ' + questions.length + '</span>' +
          '<div class="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">' +
            '<div class="h-full rounded-full transition-all duration-300" style="width:' + ((currentIndex) / questions.length * 100) + '%;background:' + THEME + '"></div>' +
          '</div>' +
          '<span class="text-sm font-bold" style="color:' + THEME + '">' + totalPoints + '分</span>' +
        '</div>';

      // 题目区域 - 中文释义
      var questionHtml =
        '<div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 text-center">' +
          '<div class="flex items-center justify-center gap-3 mb-2">' +
            '<button class="btn-speak-quiz text-2xl cursor-pointer hover:scale-110 transition-transform" title="朗读正确答案">🔊</button>' +
          '</div>' +
          '<p class="text-2xl font-bold text-gray-800">' + q.correct.meaning + '</p>' +
          '<p class="text-sm text-gray-400 mt-1">' + q.correct.phonetic + '</p>' +
        '</div>';

      // 选项列表
      var optionsHtml = '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">';
      q.options.forEach(function(opt, idx) {
        optionsHtml +=
          '<button data-idx="' + idx + '" data-word="' + opt.word + '" class="quiz-option bg-white hover:shadow-md border-2 border-gray-100 hover:border-[#66BB6A] rounded-2xl px-5 ' + OPTION_MIN_H + ' text-lg font-medium text-gray-700 transition-all duration-200 cursor-pointer text-center">' +
            opt.word +
          '</button>';
      });
      optionsHtml += '</div>';

      var fullHtml =
        '<div class="max-w-xl mx-auto px-4 py-6">' +
          // 顶部
          '<div class="flex items-center justify-between mb-6">' +
            '<button class="btn-back text-gray-500 hover:text-gray-700 transition-colors cursor-pointer flex items-center gap-1 text-sm"><span>←</span> 返回</button>' +
            '<h3 class="text-lg font-bold" style="color:' + THEME + '">英语选择题 · ' + grade + '年级</h3>' +
            '<div class="w-16"></div>' +
          '</div>' +
          progressHtml +
          questionHtml +
          optionsHtml +
          // 反馈区域
          '<div id="quiz-feedback" class="mt-4 text-center text-lg font-bold hidden"></div>' +
        '</div>';

      container.innerHTML = fullHtml;

      // --- 事件绑定 ---

      // 返回按钮
      container.querySelector('.btn-back').addEventListener('click', function() {
        render(grade, container);
      });

      // 朗读正确答案
      container.querySelector('.btn-speak-quiz').addEventListener('click', function() {
        window.Speech.speakEnglish(q.correct.word);
      });

      // 选项点击
      container.querySelectorAll('.quiz-option').forEach(function(btn) {
        btn.addEventListener('click', function() {
          if (answered) return; // 防止重复点击
          answered = true;
          handleAnswer(btn, q);
        });
      });
    }

    /** 处理答题结果 */
    function handleAnswer(clickedBtn, q) {
      var selectedWord = clickedBtn.dataset.word;
      var isCorrect = selectedWord === q.correct.word;
      var feedback = container.querySelector('#quiz-feedback');
      feedback.classList.remove('hidden');

      if (isCorrect) {
        // 正确：绿色高亮 + 弹跳动画
        clickedBtn.style.background = '#E8F5E9';
        clickedBtn.style.borderColor = '#66BB6A';
        clickedBtn.style.color = '#2E7D32';
        clickedBtn.style.animation = 'cardBounce 0.4s ease';
        feedback.innerHTML = '<span style="color:#66BB6A">✓ 太棒了！</span>';

        correctCount++;
        totalPoints += 2;
        window.Points.addPoints(2);
      } else {
        // 错误：红色标记错误选项，绿色高亮正确答案
        clickedBtn.style.background = '#FFEBEE';
        clickedBtn.style.borderColor = '#EF5350';
        clickedBtn.style.color = '#C62828';

        // 高亮正确答案
        container.querySelectorAll('.quiz-option').forEach(function(btn) {
          if (btn.dataset.word === q.correct.word) {
            btn.style.background = '#E8F5E9';
            btn.style.borderColor = '#66BB6A';
            btn.style.color = '#2E7D32';
          }
          // 禁用所有按钮
          btn.style.pointerEvents = 'none';
        });

        feedback.innerHTML = '<span style="color:#EF5350">✗ 正确答案是：<strong>' + q.correct.word + '</strong></span>';

        // 自动加入错题本
        addToWrongBook(grade, q.correct);
      }

      // 禁用所有选项的点击
      container.querySelectorAll('.quiz-option').forEach(function(btn) {
        btn.style.pointerEvents = 'none';
      });

      // 1.5秒后自动跳下一题
      setTimeout(function() {
        currentIndex++;
        renderQuestion();
      }, 1500);
    }

    /** 将错题加入错题本 */
    function addToWrongBook(grade, word) {
      if (window.WrongBook && window.WrongBook.add) {
        window.WrongBook.add({
          subject: 'english',
          grade: grade,
          question: word.meaning,       // 中文释义作为题目
          answer: word.word,            // 英文单词作为正确答案
          phonetic: word.phonetic,
          extra: word.category          // 分类信息
        });
      }
    }

    /** 渲染成绩页 */
    function renderResult() {
      var accuracy = questions.length > 0 ? Math.round(correctCount / questions.length * 100) : 0;
      var emoji = accuracy >= 80 ? '🏆' : accuracy >= 60 ? '👍' : '💪';

      var html =
        '<div class="max-w-md mx-auto px-4 py-12 text-center">' +
          '<div class="bg-white rounded-2xl shadow-lg p-8">' +
            '<div class="text-6xl mb-4">' + emoji + '</div>' +
            '<h3 class="text-2xl font-bold mb-2" style="color:' + THEME + '">练习完成！</h3>' +
            '<p class="text-gray-500 mb-6">本次成绩</p>' +
            '<div class="flex justify-center gap-8 mb-8">' +
              '<div class="text-center">' +
                '<p class="text-3xl font-bold" style="color:' + THEME + '">' + correctCount + '</p>' +
                '<p class="text-sm text-gray-400">正确 / ' + questions.length + ' 题</p>' +
              '</div>' +
              '<div class="text-center">' +
                '<p class="text-3xl font-bold text-amber-500">' + accuracy + '%</p>' +
                '<p class="text-sm text-gray-400">正确率</p>' +
              '</div>' +
              '<div class="text-center">' +
                '<p class="text-3xl font-bold text-blue-500">+' + totalPoints + '</p>' +
                '<p class="text-sm text-gray-400">获得积分</p>' +
              '</div>' +
            '</div>' +
            '<div class="flex flex-col gap-3">' +
              '<button class="btn-retry w-full py-3 rounded-2xl text-white font-bold text-lg transition-all duration-200 cursor-pointer hover:shadow-lg" style="background:' + THEME + '">再来一轮</button>' +
              '<button class="btn-back-result w-full py-3 rounded-2xl border-2 font-bold text-lg transition-all duration-200 cursor-pointer hover:bg-gray-50" style="border-color:' + THEME + ';color:' + THEME + '">返回</button>' +
            '</div>' +
          '</div>' +
        '</div>';

      container.innerHTML = html;

      // 满分检查 - 解锁"英语满分"勋章
      if (correctCount === questions.length && questions.length > 0) {
        window.Points.unlockMedal('perfect_en');
      }

      // 再来一轮
      container.querySelector('.btn-retry').addEventListener('click', function() {
        renderQuiz(grade, container);
      });

      // 返回
      container.querySelector('.btn-back-result').addEventListener('click', function() {
        render(grade, container);
      });
    }

    // 开始渲染第一题
    renderQuestion();
  }

  // ========== 4. 渲染错题重做 ==========
  /**
   * 渲染错题重做页面
   * @param {number} grade - 年级
   * @param {HTMLElement} container - 容器 DOM
   */
  function renderWrongQuiz(grade, container) {
    injectBounceAnimation();

    // 从错题本获取英语错题
    var wrongItems = [];
    if (window.WrongBook && window.WrongBook.getBySubject) {
      wrongItems = window.WrongBook.getBySubject('english', grade) || [];
    }

    // 没有错题
    if (wrongItems.length === 0) {
      container.innerHTML =
        '<div class="flex flex-col items-center justify-center py-20 px-6">' +
          '<div class="bg-white rounded-2xl shadow-lg p-10 text-center max-w-md">' +
            '<div class="text-6xl mb-4">🎉</div>' +
            '<p class="text-xl text-gray-600 font-medium">暂无错题，继续保持！</p>' +
            '<button class="btn-back mt-6 px-8 py-2.5 rounded-2xl text-white font-bold transition-all duration-200 cursor-pointer hover:shadow-lg" style="background:' + THEME + '">返回</button>' +
          '</div>' +
        '</div>';

      container.querySelector('.btn-back').addEventListener('click', function() {
        render(grade, container);
      });
      return;
    }

    // 用选择题形式重新练习错题
    var words = getWords(grade);

    // 构造题目
    var questions = wrongItems.map(function(item) {
      var correctWord = {
        word: item.answer,
        meaning: item.question,
        phonetic: item.phonetic || '',
        category: item.extra || ''
      };
      // 从同年级单词中选干扰项
      var others = words.filter(function(w) { return w.word !== correctWord.word; });
      // 如果干扰项不足3个，用错题中的其他单词补充
      if (others.length < 3) {
        var wrongOthers = wrongItems.filter(function(wi) { return wi.answer !== correctWord.word; });
        wrongOthers.forEach(function(wi) {
          if (others.length < 3) {
            others.push({ word: wi.answer, meaning: wi.question, phonetic: wi.phonetic || '', category: wi.extra || '' });
          }
        });
      }
      var distractors = pickRandom(others, Math.min(3, others.length));
      // 如果干扰项仍不足，补充空占位
      while (distractors.length < 3) {
        distractors.push({ word: '---', meaning: '---', phonetic: '', category: '' });
      }
      var options = shuffle([correctWord].concat(distractors));
      return {
        correct: correctWord,
        options: options
      };
    });

    // 状态
    var currentIndex = 0;
    var correctCount = 0;
    var answered = false;

    function renderQuestion() {
      if (currentIndex >= questions.length) {
        renderResult();
        return;
      }

      var q = questions[currentIndex];
      answered = false;

      var progressHtml =
        '<div class="flex items-center gap-2 mb-4">' +
          '<span class="text-sm text-gray-500 font-medium">' + (currentIndex + 1) + ' / ' + questions.length + '</span>' +
          '<div class="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">' +
            '<div class="h-full rounded-full transition-all duration-300" style="width:' + ((currentIndex) / questions.length * 100) + '%;background:' + THEME + '"></div>' +
          '</div>' +
        '</div>';

      var questionHtml =
        '<div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 text-center">' +
          '<div class="flex items-center justify-center gap-3 mb-2">' +
            '<button class="btn-speak-wrong text-2xl cursor-pointer hover:scale-110 transition-transform" title="朗读正确答案">🔊</button>' +
          '</div>' +
          '<p class="text-2xl font-bold text-gray-800">' + q.correct.meaning + '</p>' +
          '<p class="text-sm text-gray-400 mt-1">' + q.correct.phonetic + '</p>' +
        '</div>';

      var optionsHtml = '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">';
      q.options.forEach(function(opt, idx) {
        optionsHtml +=
          '<button data-idx="' + idx + '" data-word="' + opt.word + '" class="wrong-option bg-white hover:shadow-md border-2 border-gray-100 hover:border-[#66BB6A] rounded-2xl px-5 ' + OPTION_MIN_H + ' text-lg font-medium text-gray-700 transition-all duration-200 cursor-pointer text-center">' +
            opt.word +
          '</button>';
      });
      optionsHtml += '</div>';

      var fullHtml =
        '<div class="max-w-xl mx-auto px-4 py-6">' +
          '<div class="flex items-center justify-between mb-6">' +
            '<button class="btn-back text-gray-500 hover:text-gray-700 transition-colors cursor-pointer flex items-center gap-1 text-sm"><span>←</span> 返回</button>' +
            '<h3 class="text-lg font-bold" style="color:' + THEME + '">错题重做 · ' + grade + '年级</h3>' +
            '<div class="w-16"></div>' +
          '</div>' +
          progressHtml +
          questionHtml +
          optionsHtml +
          '<div id="wrong-feedback" class="mt-4 text-center text-lg font-bold hidden"></div>' +
        '</div>';

      container.innerHTML = fullHtml;

      // --- 事件绑定 ---

      container.querySelector('.btn-back').addEventListener('click', function() {
        render(grade, container);
      });

      container.querySelector('.btn-speak-wrong').addEventListener('click', function() {
        window.Speech.speakEnglish(q.correct.word);
      });

      container.querySelectorAll('.wrong-option').forEach(function(btn) {
        btn.addEventListener('click', function() {
          if (answered) return;
          answered = true;
          handleWrongAnswer(btn, q);
        });
      });
    }

    /** 处理错题重做的答题 */
    function handleWrongAnswer(clickedBtn, q) {
      var selectedWord = clickedBtn.dataset.word;
      var isCorrect = selectedWord === q.correct.word;
      var feedback = container.querySelector('#wrong-feedback');
      feedback.classList.remove('hidden');

      if (isCorrect) {
        clickedBtn.style.background = '#E8F5E9';
        clickedBtn.style.borderColor = '#66BB6A';
        clickedBtn.style.color = '#2E7D32';
        clickedBtn.style.animation = 'cardBounce 0.4s ease';
        feedback.innerHTML = '<span style="color:#66BB6A">✓ 太棒了！</span>';
        correctCount++;
      } else {
        clickedBtn.style.background = '#FFEBEE';
        clickedBtn.style.borderColor = '#EF5350';
        clickedBtn.style.color = '#C62828';

        container.querySelectorAll('.wrong-option').forEach(function(btn) {
          if (btn.dataset.word === q.correct.word) {
            btn.style.background = '#E8F5E9';
            btn.style.borderColor = '#66BB6A';
            btn.style.color = '#2E7D32';
          }
          btn.style.pointerEvents = 'none';
        });

        feedback.innerHTML = '<span style="color:#EF5350">✗ 正确答案是：<strong>' + q.correct.word + '</strong></span>';
      }

      container.querySelectorAll('.wrong-option').forEach(function(btn) {
        btn.style.pointerEvents = 'none';
      });

      setTimeout(function() {
        currentIndex++;
        renderQuestion();
      }, 1500);
    }

    /** 渲染错题重做成绩页 */
    function renderResult() {
      var allCorrect = correctCount === questions.length;
      var emoji = allCorrect ? '🏆' : '💪';

      var html =
        '<div class="max-w-md mx-auto px-4 py-12 text-center">' +
          '<div class="bg-white rounded-2xl shadow-lg p-8">' +
            '<div class="text-6xl mb-4">' + emoji + '</div>' +
            '<h3 class="text-2xl font-bold mb-2" style="color:' + THEME + '">' +
              (allCorrect ? '错题全部攻克！' : '错题重做完成') +
            '</h3>' +
            (allCorrect ? '<p class="text-amber-500 font-medium mb-4">解锁勋章：错题克星 📚</p>' : '') +
            '<p class="text-gray-500 mb-6">答对 <strong style="color:' + THEME + '">' + correctCount + '</strong> / ' + questions.length + ' 题</p>' +
            '<div class="flex flex-col gap-3">' +
              (allCorrect ?
                '<button class="btn-back-result w-full py-3 rounded-2xl text-white font-bold text-lg transition-all duration-200 cursor-pointer hover:shadow-lg" style="background:' + THEME + '">返回</button>'
              :
                '<div class="flex flex-col gap-3">' +
                  '<button class="btn-retry-wrong w-full py-3 rounded-2xl text-white font-bold text-lg transition-all duration-200 cursor-pointer hover:shadow-lg" style="background:' + THEME + '">再练一次</button>' +
                  '<button class="btn-back-result w-full py-3 rounded-2xl border-2 font-bold text-lg transition-all duration-200 cursor-pointer hover:bg-gray-50" style="border-color:' + THEME + ';color:' + THEME + '">返回</button>' +
                '</div>'
              ) +
            '</div>' +
          '</div>' +
        '</div>';

      container.innerHTML = html;

      // 全部答对则解锁"错题克星"勋章
      if (allCorrect) {
        if (window.Points && window.Points.unlockMedal) {
          window.Points.unlockMedal('wrong_master');
        }
        // 从错题本移除已掌握的题目
        if (window.WrongBook && window.WrongBook.removeBySubject) {
          window.WrongBook.removeBySubject('english', grade);
        }
      }

      // 再练一次
      var retryBtn = container.querySelector('.btn-retry-wrong');
      if (retryBtn) {
        retryBtn.addEventListener('click', function() {
          renderWrongQuiz(grade, container);
        });
      }

      // 返回
      container.querySelector('.btn-back-result').addEventListener('click', function() {
        render(grade, container);
      });
    }

    // 开始渲染
    renderQuestion();
  }

  // ========== 公开 API ==========
  return {
    render: render,
    renderReadAloud: renderReadAloud,
    renderQuiz: renderQuiz,
    renderWrongQuiz: renderWrongQuiz
  };
})();
