/**
 * math.js — 小学数学口算练习模块
 * 挂载在 window.MathApp 下
 * 依赖：
 *   - window.MATH_CONFIG（来自 data/math-config.js）
 *   - window.Points（来自 points.js）
 *   - window.WrongBook（来自 wrong-book.js）
 *   - window.Speech（来自 speech.js）
 */

window.MathApp = (function () {
  'use strict';

  /** 计时模式开关（内部状态） */
  var _isTimerMode = true;

  // ==================== 工具函数 ====================

  /**
   * 生成指定范围内的随机整数 [min, max]
   */
  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * 从数组中随机选取一个元素
   */
  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // ==================== 1. 出题函数 ====================

  /**
   * 根据年级和难度等级生成口算题目
   * @param {number} grade - 年级（1-6）
   * @param {number} levelIndex - 难度等级索引
   * @returns {Array} 题目数组 [{ id, expression, answer, userAnswer, isCorrect }]
   */
  function generateQuestions(grade, levelIndex) {
    var config = window.MATH_CONFIG[grade];
    if (!config || !config.levels[levelIndex]) {
      console.error('无效的年级或难度等级:', grade, levelIndex);
      return [];
    }

    var level = config.levels[levelIndex];
    var questions = [];

    // 渐进挑战模式：按题目位置分配递增的难度
    var baseLevels = config.levels.filter(function(l) { return !l.progressive; });

    for (var i = 0; i < level.count; i++) {
      var actualLevel = level;
      if (level.progressive && baseLevels.length > 0) {
        // 按题目位置选择难度：前段简单 → 中段中等 → 后段困难
        var ratio = i / level.count;
        var levelIdx = Math.floor(ratio * baseLevels.length);
        if (levelIdx >= baseLevels.length) levelIdx = baseLevels.length - 1;
        actualLevel = baseLevels[levelIdx];
      }
      var question = generateOneQuestion(grade, actualLevel);
      question.id = i + 1;
      question.userAnswer = null;
      question.isCorrect = null;
      if (level.progressive) {
        question.difficultyTag = actualLevel.name;
      }
      questions.push(question);
    }

    return questions;
  }

  /**
   * 生成单道题目（内部函数）
   */
  function generateOneQuestion(grade, level) {
    const op = pickRandom(level.ops);
    const [min, max] = level.range;

    switch (grade) {
      case 1:
        return generateGrade1(op, min, max);
      case 2:
        return generateGrade2(op, min, max);
      default:
        return generateGradeUpper(op, min, max, grade);
    }
  }

  /**
   * 一年级题目：简单加减法，结果不为负数
   */
  function generateGrade1(op, min, max) {
    let a, b, answer, expression;

    if (op === '+') {
      // 加法：确保结果不超过 max
      a = randInt(min, max);
      b = randInt(min, max - a);
      answer = a + b;
      expression = a + ' + ' + b;
    } else {
      // 减法：确保结果不为负数（大数减小数）
      a = randInt(min, max);
      b = randInt(min, a);
      answer = a - b;
      expression = a + ' - ' + b;
    }

    return { expression, answer };
  }

  /**
   * 二年级题目：表内乘除法及100以内加减
   */
  function generateGrade2(op, min, max) {
    let a, b, answer, expression;

    if (op === '×') {
      // 乘法：1-9 之间的数相乘
      a = randInt(1, 9);
      b = randInt(1, 9);
      answer = a * b;
      expression = a + ' × ' + b;
    } else if (op === '÷') {
      // 除法：乘法逆运算，确保整除
      b = randInt(1, 9);
      answer = randInt(1, 9);
      a = b * answer;
      expression = a + ' ÷ ' + b;
    } else if (op === '+') {
      // 100以内加法
      a = randInt(min, max);
      b = randInt(min, Math.min(max, 99 - a + min));
      answer = a + b;
      expression = a + ' + ' + b;
    } else {
      // 100以内减法，结果不为负
      a = randInt(min, max);
      b = randInt(min, a);
      answer = a - b;
      expression = a + ' - ' + b;
    }

    return { expression, answer };
  }

  /**
   * 三年级及以上题目
   */
  function generateGradeUpper(op, min, max, grade) {
    let a, b, answer, expression;

    if (op === '+') {
      // 加法
      a = randInt(min, max);
      b = randInt(min, max);
      answer = a + b;
      expression = a + ' + ' + b;
    } else if (op === '-') {
      // 减法，确保结果不为负数
      a = randInt(min, max);
      b = randInt(min, a);
      answer = a - b;
      expression = a + ' - ' + b;
    } else if (op === '×') {
      // 乘法：用较小的数
      a = randInt(Math.min(2, min), Math.min(9, max));
      b = randInt(min, Math.min(max, 99));
      answer = a * b;
      expression = a + ' × ' + b;
    } else if (op === '÷') {
      // 除法：乘法逆运算，确保整除
      a = randInt(Math.min(2, min), Math.min(9, max));
      answer = randInt(1, Math.min(99, max));
      b = a * answer;
      expression = b + ' ÷ ' + a;
    } else {
      // 其他运算符号暂不支持自动生成，退化为加法
      a = randInt(min, max);
      b = randInt(min, max);
      answer = a + b;
      expression = a + ' + ' + b;
    }

    return { expression, answer };
  }

  // ==================== 2. 计时器 ====================

  /**
   * 创建倒计时器
   * @param {number} seconds - 总秒数
   * @param {Function} onTick - 每秒回调，参数为剩余秒数
   * @param {Function} onEnd - 倒计时结束回调
   * @returns {Object} { start, stop, getElapsed }
   */
  function startTimer(seconds, onTick, onEnd) {
    let remaining = seconds;
    let intervalId = null;
    let startTime = null;
    let elapsed = 0;

    function tick() {
      remaining--;
      elapsed++;
      if (remaining <= 0) {
        remaining = 0;
        stop();
        if (onEnd) onEnd();
      }
      if (onTick) onTick(remaining);
    }

    return {
      /** 开始计时 */
      start: function () {
        startTime = Date.now();
        elapsed = 0;
        intervalId = setInterval(tick, 1000);
        if (onTick) onTick(remaining);
      },
      /** 停止计时 */
      stop: function () {
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
        // 精确计算已用时间
        if (startTime) {
          elapsed = Math.round((Date.now() - startTime) / 1000);
        }
      },
      /** 获取已用时间（秒） */
      getElapsed: function () {
        return elapsed;
      },
    };
  }

  // ==================== 3. 判题函数 ====================

  /**
   * 判断用户答案是否正确
   * @param {Object} question - 题目对象 { answer }
   * @param {number|string} userAnswer - 用户答案
   * @returns {boolean} 是否正确
   */
  function checkAnswer(question, userAnswer) {
    const numAnswer = Number(userAnswer);
    return numAnswer === question.answer;
  }

  // ==================== 4. 计分函数 ====================

  /**
   * 统计答题成绩
   * @param {Array} questions - 题目数组
   * @param {number} timeTaken - 用时（秒）
   * @returns {Object} { total, correct, wrong, rate, timeTaken }
   */
  function calculateScore(questions, timeTaken) {
    let correct = 0;
    let wrong = 0;

    questions.forEach(function (q) {
      if (q.isCorrect === true) {
        correct++;
      } else if (q.isCorrect === false) {
        wrong++;
      }
    });

    const total = questions.length;
    const rate = total > 0 ? Math.round((correct / total) * 100) : 0;

    return {
      total: total,
      correct: correct,
      wrong: wrong,
      rate: rate,
      timeTaken: timeTaken,
    };
  }

  // ==================== 5. 渲染练习界面 ====================

  /**
   * 渲染口算练习界面
   * @param {number} grade - 年级
   * @param {number} levelIndex - 难度等级索引
   * @param {HTMLElement} container - 容器元素
   */
  function renderPractice(grade, levelIndex, container) {
    const config = window.MATH_CONFIG[grade];
    const level = config.levels[levelIndex];
    const timeLimit = config.timeLimit;
    const questions = generateQuestions(grade, levelIndex);

    // 内部状态
    let currentIndex = 0;
    let timer = null;
    let isTimerMode = _isTimerMode !== false;
    let startTime = Date.now();
    let feedbackTimeout = null;
    let streak = 0; // 连续答对计数

    // 朗读当前题目
    function speakCurrentQuestion() {
      if (window.Speech && window.Speech.isSupported()) {
        const q = questions[currentIndex];
        window.Speech.speakMath(q.expression + '等于', q.answer);
      }
    }

    // 生成圆形计时器SVG
    function buildTimerCircle(remaining, total) {
      const radius = 28;
      const circumference = 2 * Math.PI * radius;
      const progress = total > 0 ? remaining / total : 1;
      const offset = circumference * (1 - progress);
      const percent = Math.round(progress * 100);

      // 根据剩余时间改变颜色
      let color = '#42A5F5'; // 蓝色
      if (remaining <= 10) {
        color = '#EF5350'; // 红色警告
      } else if (remaining <= 30) {
        color = '#FFA726'; // 橙色提醒
      }

      return (
        '<div class="relative w-16 h-16 flex items-center justify-center">' +
        '<svg class="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 64 64">' +
        '<circle cx="32" cy="32" r="' + radius + '" fill="none" stroke="#e5e7eb" stroke-width="4"/>' +
        '<circle cx="32" cy="32" r="' + radius + '" fill="none" stroke="' + color + '" stroke-width="4" ' +
        'stroke-dasharray="' + circumference + '" stroke-dashoffset="' + offset + '" ' +
        'stroke-linecap="round" style="transition: stroke-dashoffset 1s linear, stroke 0.5s;"/>' +
        '</svg>' +
        '<span class="text-sm font-bold text-gray-700">' + remaining + '</span>' +
        '</div>'
      );
    }

    // 渲染界面
    function render() {
      if (currentIndex >= questions.length) {
        renderResult();
        return;
      }

      const q = questions[currentIndex];
      const progress = ((currentIndex) / questions.length) * 100;
      const remaining = timer ? timeLimit - timer.getElapsed() : timeLimit;
      const timerDisplay = isTimerMode ? buildTimerCircle(Math.max(0, remaining), timeLimit) : '';

      container.innerHTML =
        // 顶部信息栏
        '<div class="flex items-center justify-between px-4 py-3 mb-4">' +
          '<div class="text-lg font-bold text-gray-600">' +
            '<span class="text-blue-500">' + (currentIndex + 1) + '</span>' +
            '<span class="text-gray-400"> / ' + questions.length + '</span>' +
            (q.difficultyTag ? '<span class="ml-2 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-600">' + q.difficultyTag + '</span>' : '') +
          '</div>' +
          '<div id="timer-display">' + timerDisplay + '</div>' +
          '<div class="text-sm text-gray-400">连续答对: ' + streak + '</div>' +
        '</div>' +

        // 进度条
        '<div class="w-full bg-gray-200 rounded-full h-2 mb-8">' +
          '<div class="bg-blue-400 h-2 rounded-full transition-all duration-300" style="width: ' + progress + '%"></div>' +
        '</div>' +

        // 算式显示区域
        '<div id="question-area" class="flex flex-col items-center justify-center py-12">' +
          '<div class="text-4xl sm:text-5xl font-bold text-gray-800 mb-8 tracking-wider" id="expression">' +
            q.expression + ' = ?' +
          '</div>' +

          // 反馈区域
          '<div id="feedback" class="text-xl font-semibold mb-4 h-8"></div>' +

          // 输入区域
          '<div class="flex items-center gap-4">' +
            '<input type="number" id="answer-input" ' +
              'class="min-w-[120px] text-center text-3xl py-3 px-4 border-3 border-gray-300 rounded-xl ' +
              'focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-colors" ' +
              'inputmode="numeric" pattern="[0-9]*" placeholder="?" autocomplete="off">' +
            '<button id="confirm-btn" ' +
              'class="py-3 px-6 rounded-xl text-white text-lg font-bold ' +
              'bg-[#42A5F5] hover:bg-[#1E88E5] active:bg-[#1565C0] ' +
              'transition-colors shadow-md hover:shadow-lg min-h-[52px]">' +
              '确认' +
            '</button>' +
          '</div>' +

          // 语音按钮
          '<button id="speak-btn" class="mt-6 py-2 px-4 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm transition-colors">' +
            '🔊 朗读' +
          '</button>' +
        '</div>';

      // 绑定事件
      var input = document.getElementById('answer-input');
      var confirmBtn = document.getElementById('confirm-btn');
      var speakBtn = document.getElementById('speak-btn');

      // 自动聚焦输入框
      setTimeout(function () { input.focus(); }, 100);

      // 确认按钮点击
      confirmBtn.addEventListener('click', function () { handleSubmit(); });

      // 回车键提交
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleSubmit();
        }
      });

      // 朗读按钮
      speakBtn.addEventListener('click', function () {
        speakCurrentQuestion();
      });
    }

    // 处理答案提交
    function handleSubmit() {
      var input = document.getElementById('answer-input');
      var value = input.value.trim();

      if (value === '') return;

      var userAnswer = parseInt(value, 10);
      var q = questions[currentIndex];

      // 判断对错
      var correct = checkAnswer(q, userAnswer);
      q.userAnswer = userAnswer;
      q.isCorrect = correct;

      var feedbackEl = document.getElementById('feedback');
      var expressionEl = document.getElementById('expression');
      var confirmBtn = document.getElementById('confirm-btn');
      var inputEl = document.getElementById('answer-input');

      // 禁用输入防止重复提交
      inputEl.disabled = true;
      confirmBtn.disabled = true;
      confirmBtn.classList.add('opacity-50');

      if (correct) {
        // 正确反馈
        streak++;
        feedbackEl.className = 'text-xl font-semibold mb-4 h-8 bg-green-100 text-green-700 px-6 py-2 rounded-xl';
        feedbackEl.textContent = '✓ 正确！';

        // 检查连续答对勋章
        if (window.Points) {
          if (streak === 5) window.Points.unlockMedal('streak_5');
          if (streak === 10) window.Points.unlockMedal('streak_10');
          if (streak === 20) window.Points.unlockMedal('streak_20');
        }
      } else {
        // 错误反馈
        streak = 0;
        feedbackEl.className = 'text-xl font-semibold mb-4 h-8 bg-red-100 text-red-700 px-6 py-2 rounded-xl';
        feedbackEl.textContent = '✗ 错误，正确答案是 ' + q.answer;

        // 添加到错题本
        if (window.WrongBook && window.WrongBook.add) {
          window.WrongBook.add({
            grade: grade,
            level: levelIndex,
            expression: q.expression,
            answer: q.answer,
            userAnswer: userAnswer,
          });
        }
      }

      // 语音反馈
      if (window.Speech && window.Speech.isSupported()) {
        if (correct) {
          window.Speech.speakChinese('正确', 0.9);
        } else {
          window.Speech.speakChinese('答案是' + q.answer, 0.8);
        }
      }

      // 延迟后自动跳到下一题
      if (feedbackTimeout) clearTimeout(feedbackTimeout);
      feedbackTimeout = setTimeout(function () {
        currentIndex++;
        render();
      }, correct ? 800 : 1500);
    }

    // 渲染成绩页面
    function renderResult() {
      // 停止计时器
      if (timer) timer.stop();

      var timeTaken = timer ? timer.getElapsed() : Math.round((Date.now() - startTime) / 1000);
      var score = calculateScore(questions, timeTaken);

      // 计算获得积分
      var earnedPoints = 0;
      if (score.rate >= 100) {
        earnedPoints = 20; // 满分20分
      } else if (score.rate >= 80) {
        earnedPoints = 15;
      } else if (score.rate >= 60) {
        earnedPoints = 10;
      } else {
        earnedPoints = 5; // 完成练习至少得5分
      }

      // 添加积分
      if (window.Points && window.Points.addPoints) {
        window.Points.addPoints(earnedPoints);
      }

      // 检查满分勋章
      if (score.rate === 100 && window.Points && window.Points.unlockMedal) {
        window.Points.unlockMedal('perfect_math');
      }
      // 检查初次练习勋章
      if (window.Points && window.Points.unlockMedal) {
        window.Points.unlockMedal('first_practice');
      }

      // 格式化时间
      var minutes = Math.floor(timeTaken / 60);
      var seconds = timeTaken % 60;
      var timeStr = (minutes > 0 ? minutes + '分' : '') + seconds + '秒';

      // 成绩颜色
      var rateColor = score.rate >= 80 ? 'text-green-600' : (score.rate >= 60 ? 'text-yellow-600' : 'text-red-600');
      var rateBg = score.rate >= 80 ? 'bg-green-50' : (score.rate >= 60 ? 'bg-yellow-50' : 'bg-red-50');

      container.innerHTML =
        '<div class="flex flex-col items-center justify-center py-8 px-4 max-w-md mx-auto">' +

          // 标题
          '<h2 class="text-2xl font-bold text-gray-700 mb-6">练习完成！</h2>' +

          // 成绩卡片
          '<div class="' + rateBg + ' rounded-2xl p-6 w-full mb-6 shadow-sm">' +

            // 正确率大号显示
            '<div class="text-center mb-4">' +
              '<span class="' + rateColor + ' text-5xl font-black">' + score.rate + '%</span>' +
              '<div class="text-gray-500 mt-1">正确率</div>' +
            '</div>' +

            // 统计详情
            '<div class="grid grid-cols-3 gap-4 text-center mb-4">' +
              '<div>' +
                '<div class="text-2xl font-bold text-blue-500">' + score.total + '</div>' +
                '<div class="text-sm text-gray-500">总题数</div>' +
              '</div>' +
              '<div>' +
                '<div class="text-2xl font-bold text-green-500">' + score.correct + '</div>' +
                '<div class="text-sm text-gray-500">答对</div>' +
              '</div>' +
              '<div>' +
                '<div class="text-2xl font-bold text-red-500">' + score.wrong + '</div>' +
                '<div class="text-sm text-gray-500">答错</div>' +
              '</div>' +
            '</div>' +

            // 用时和积分
            '<div class="flex justify-between items-center pt-4 border-t border-gray-200">' +
              '<span class="text-gray-500">用时</span>' +
              '<span class="font-bold text-gray-700">' + timeStr + '</span>' +
            '</div>' +
            '<div class="flex justify-between items-center pt-2">' +
              '<span class="text-gray-500">获得积分</span>' +
              '<span class="font-bold text-amber-500 text-lg">+' + earnedPoints + '</span>' +
            '</div>' +
          '</div>' +

          // 操作按钮
          '<div class="flex gap-4 w-full">' +
            '<button id="retry-btn" ' +
              'class="flex-1 py-3 px-6 rounded-xl text-white text-lg font-bold ' +
              'bg-[#42A5F5] hover:bg-[#1E88E5] active:bg-[#1565C0] ' +
              'transition-colors shadow-md hover:shadow-lg">' +
              '再来一轮' +
            '</button>' +
            '<button id="back-btn" ' +
              'class="flex-1 py-3 px-6 rounded-xl text-gray-600 text-lg font-bold ' +
              'bg-gray-100 hover:bg-gray-200 active:bg-gray-300 ' +
              'transition-colors border border-gray-200">' +
              '返回' +
            '</button>' +
          '</div>' +

          // 错题回顾（如果有错题）
          (score.wrong > 0 ?
            '<div class="w-full mt-6">' +
              '<h3 class="text-lg font-bold text-gray-600 mb-3">错题回顾</h3>' +
              '<div class="space-y-2">' +
                questions.filter(function(q) { return q.isCorrect === false; }).map(function(q) {
                  return '<div class="flex items-center justify-between bg-red-50 rounded-xl px-4 py-2">' +
                    '<span class="text-gray-700">' + q.expression + ' = ' + q.answer + '</span>' +
                    '<span class="text-red-400 text-sm">你的答案: ' + q.userAnswer + '</span>' +
                  '</div>';
                }).join('') +
              '</div>' +
            '</div>'
          : '') +

        '</div>';

      // 绑定按钮事件
      var retryBtn = document.getElementById('retry-btn');
      var backBtn = document.getElementById('back-btn');

      retryBtn.addEventListener('click', function () {
        renderPractice(grade, levelIndex, container);
      });

      backBtn.addEventListener('click', function () {
        renderLevelSelect(grade, container);
      });

      // 语音播报成绩
      if (window.Speech && window.Speech.isSupported()) {
        window.Speech.speakChinese(
          '练习完成！正确率' + score.rate + '%，用时' + timeStr + '，获得' + earnedPoints + '积分',
          0.8
        );
      }
    }

    // 更新计时器显示
    function updateTimerDisplay(remaining) {
      var timerEl = document.getElementById('timer-display');
      if (timerEl) {
        timerEl.innerHTML = buildTimerCircle(Math.max(0, remaining), timeLimit);
      }
    }

    // 初始化
    function init() {
      currentIndex = 0;
      streak = 0;
      startTime = Date.now();

      // 创建计时器
      timer = startTimer(timeLimit, function (remaining) {
        updateTimerDisplay(remaining);
      }, function () {
        // 时间到，强制显示结果
        currentIndex = questions.length;
        renderResult();
      });

      render();

      // 启动计时器
      if (isTimerMode) {
        timer.start();
      }
    }

    init();
  }

  // ==================== 6. 渲染难度选择 ====================

  /**
   * 渲染难度等级选择界面
   * @param {number} grade - 年级
   * @param {HTMLElement} container - 容器元素
   */
  function renderLevelSelect(grade, container) {
    var config = window.MATH_CONFIG[grade];
    if (!config) {
      container.innerHTML = '<p class="text-center text-red-500">无效的年级</p>';
      return;
    }

    // 获取计时模式状态（默认为开启）
    var isTimerMode = _isTimerMode !== false;

    // 渲染界面
    container.innerHTML =
      // 页头
      '<div class="text-center mb-8">' +
        '<h2 class="text-2xl font-bold text-gray-700 mb-2">' + config.label + ' · 数学口算</h2>' +
        '<p class="text-gray-500">选择练习难度</p>' +
      '</div>' +

      // 计时模式切换
      '<div class="flex items-center justify-center gap-3 mb-8 px-4">' +
        '<span class="text-gray-600 font-medium">计时模式</span>' +
        '<label class="relative inline-flex items-center cursor-pointer">' +
          '<input type="checkbox" id="timer-toggle" class="sr-only peer" ' + (isTimerMode ? 'checked' : '') + '>' +
          '<div class="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-200 rounded-full ' +
            'peer peer-checked:after:translate-x-7 peer-checked:after:border-white ' +
            'after:absolute after:top-0.5 after:left-[4px] ' +
            'after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 ' +
            'after:transition-all peer-checked:bg-[#42A5F5] shadow-inner"></div>' +
        '</label>' +
        '<span class="text-sm text-gray-400">' + (isTimerMode ? '已开启' : '已关闭') + '</span>' +
      '</div>' +

      // 难度等级按钮列表
      '<div class="space-y-3 px-4 max-w-md mx-auto" id="level-list">' +
        config.levels.map(function (level, index) {
          var isProgressive = level.progressive;
          var btnClass = isProgressive
            ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 hover:border-amber-400 hover:shadow-md active:bg-amber-100'
            : 'bg-white border-2 border-gray-100 hover:border-[#42A5F5] hover:shadow-md active:bg-blue-50';
          var titleClass = isProgressive ? 'text-amber-700' : 'text-gray-700';
          var subText = isProgressive
            ? '难度递增 · ' + level.count + '题'
            : level.ops.join('、') + ' · ' + level.count + '题';
          var iconSvg = isProgressive
            ? '<svg class="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>'
            : '<svg class="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>';
          return (
            '<button class="level-btn w-full flex items-center justify-between py-4 px-6 rounded-xl ' +
            btnClass + ' transition-all text-left" data-index="' + index + '">' +
              '<div>' +
                '<div class="text-lg font-bold ' + titleClass + '">' + level.name + '</div>' +
                '<div class="text-sm text-gray-400 mt-1">' + subText + '</div>' +
              '</div>' +
              iconSvg +
            '</button>'
          );
        }).join('') +
      '</div>' +

      // 返回按钮
      '<div class="mt-8 text-center">' +
        '<button id="back-home" class="py-2 px-6 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors text-base">' +
          '← 返回科目选择' +
        '</button>' +
      '</div>';

    // 绑定难度按钮事件
    var levelBtns = container.querySelectorAll('.level-btn');
    levelBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var levelIndex = parseInt(this.getAttribute('data-index'), 10);
        renderPractice(grade, levelIndex, container);
      });
    });

    // 绑定计时模式切换
    var timerToggle = document.getElementById('timer-toggle');
    timerToggle.addEventListener('change', function () {
      _isTimerMode = this.checked;
      // 更新提示文字
      this.parentElement.nextElementSibling.textContent = this.checked ? '已开启' : '已关闭';
    });

    // 绑定返回按钮
    var backHomeBtn = document.getElementById('back-home');
    backHomeBtn.addEventListener('click', function () {
      // 触发自定义事件，由上层页面处理导航
      var event = new CustomEvent('navigate', { detail: { target: 'home' } });
      container.dispatchEvent(event);
    });
  }

  // ==================== 暴露公共接口 ====================

  return {
    /** 出题函数 */
    generateQuestions: generateQuestions,
    /** 计时器 */
    startTimer: startTimer,
    /** 判题函数 */
    checkAnswer: checkAnswer,
    /** 计分函数 */
    calculateScore: calculateScore,
    /** 渲染口算练习界面 */
    renderPractice: renderPractice,
    /** 渲染难度选择界面 */
    renderLevelSelect: renderLevelSelect,
  };
})();
