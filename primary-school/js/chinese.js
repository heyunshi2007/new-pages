/**
 * chinese.js — 语文学习模块
 * 包含生字听写、必背古诗、拼音练习
 * 依赖 window.CHINESE_WORDS（data/chinese-words.js）
 * 依赖 window.POEMS_DATA（data/poems.js）
 * 依赖 window.Points（points.js）
 * 依赖 window.WrongBook（wrong-book.js）
 * 依赖 window.Speech（speech.js）
 */
window.ChineseApp = (function() {

  // ===== 生字听写内部状态 =====
  var _dictation = {
    words: [],
    index: 0,
    score: 0,
    grade: 0,
    answered: false
  };

  // ===== 背诵测试内部状态 =====
  var _recite = {
    poem: null,
    chars: [],
    hiddenIndices: [],
    userAnswers: {},
    filledCount: 0,
    grade: 0
  };

  // ===== 工具函数：从数组中随机取n个元素 =====
  function _randomPick(arr, n) {
    var copy = arr.slice();
    var result = [];
    for (var i = 0; i < n && copy.length > 0; i++) {
      var idx = Math.floor(Math.random() * copy.length);
      result.push(copy.splice(idx, 1)[0]);
    }
    return result;
  }

  // ========================================
  //  1. 渲染入口 — 模式选择
  // ========================================
  function render(grade, container) {
    container.innerHTML =
      '<div class="max-w-2xl mx-auto">' +
        '<h2 class="text-2xl font-bold mb-2 text-center" style="color:#2D3436">\u{1F4DD} 语文学习</h2>' +
        '<p class="text-center text-gray-500 mb-8">' + grade + '年级</p>' +

        '<div class="space-y-4">' +

          // 生字听写
          '<button onclick="ChineseApp.renderDictation(' + grade + ', document.getElementById(\'app\'))"' +
          '  class="w-full bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition text-left flex items-center gap-4">' +
            '<span class="text-4xl">\u{1F4DD}</span>' +
            '<div>' +
              '<div class="text-lg font-bold text-gray-800">生字听写</div>' +
              '<div class="text-sm text-gray-500">听拼音写汉字，共10题</div>' +
            '</div>' +
          '</button>' +

          // 必背古诗
          '<button onclick="ChineseApp.renderPoems(' + grade + ', document.getElementById(\'app\'))"' +
          '  class="w-full bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition text-left flex items-center gap-4">' +
            '<span class="text-4xl">\u{1F4D6}</span>' +
            '<div>' +
              '<div class="text-lg font-bold text-gray-800">必背古诗</div>' +
              '<div class="text-sm text-gray-500">欣赏古诗，背诵测试</div>' +
            '</div>' +
          '</button>' +

          // 拼音练习（仅1年级显示）
          (grade === 1
            ? '<button onclick="ChineseApp.renderPinyin(document.getElementById(\'app\'))"' +
              '  class="w-full bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition text-left flex items-center gap-4">' +
                '<span class="text-4xl">\u{1F524}</span>' +
                '<div>' +
                  '<div class="text-lg font-bold text-gray-800">拼音练习</div>' +
                  '<div class="text-sm text-gray-500">学习声母、韵母和整体认读音节</div>' +
                '</div>' +
              '</button>'
            : '') +

        '</div>' +

        '<div class="mt-8 text-center">' +
          '<button class="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-semibold hover:bg-gray-200 transition" onclick="App.goHome()">' +
            '\u{1F3E0} 返回首页' +
          '</button>' +
        '</div>' +
      '</div>';
  }

  // ========================================
  //  2. 渲染生字听写
  // ========================================
  function renderDictation(grade, container) {
    var wordList = window.CHINESE_WORDS && window.CHINESE_WORDS[grade];
    if (!wordList || wordList.length === 0) {
      container.innerHTML = '<div class="text-center py-12 text-gray-400">暂无该年级生字数据</div>';
      return;
    }

    // 随机抽取10个字
    var count = Math.min(10, wordList.length);
    _dictation.words = _randomPick(wordList, count);
    _dictation.index = 0;
    _dictation.score = 0;
    _dictation.grade = grade;
    _dictation.answered = false;

    _renderDictationQuestion(container);
  }

  // 渲染当前听写题目
  function _renderDictationQuestion(container) {
    var d = _dictation;
    var total = d.words.length;

    // 全部完成 → 显示成绩页
    if (d.index >= total) {
      _renderDictationResult(container);
      return;
    }

    var current = d.words[d.index];
    d.answered = false;

    var progressPct = ((d.index) / total * 100).toFixed(1);

    container.innerHTML =
      '<div class="max-w-2xl mx-auto">' +
        '<h2 class="text-2xl font-bold mb-2 text-center" style="color:#2D3436">\u{1F4DD} 生字听写</h2>' +
        '<p class="text-center text-gray-400 mb-6">' + d.grade + '年级</p>' +

        // 进度
        '<div class="flex items-center justify-center gap-2 mb-4">' +
          '<span class="text-sm text-gray-500">第</span>' +
          '<span class="text-xl font-bold" style="color:#42A5F5">' + (d.index + 1) + '</span>' +
          '<span class="text-sm text-gray-500">/</span>' +
          '<span class="text-xl font-bold text-gray-400">' + total + '</span>' +
          '<span class="text-sm text-gray-500">题</span>' +
        '</div>' +

        // 进度条
        '<div class="w-full bg-gray-100 rounded-full h-2 mb-8">' +
          '<div class="h-2 rounded-full transition-all duration-300" style="width:' + progressPct + '%; background:#42A5F5"></div>' +
        '</div>' +

        // 朗读按钮
        '<div class="text-center mb-8">' +
          '<button id="dictSpeakBtn" onclick="ChineseApp._speakDictation()"' +
          '  class="w-28 h-28 rounded-full bg-blue-50 border-2 border-blue-200 text-5xl hover:bg-blue-100 hover:scale-105 active:scale-95 transition-all flex items-center justify-center mx-auto shadow-sm">' +
            '\u{1F50A}' +
          '</button>' +
          '<p class="text-sm text-gray-400 mt-3">点击听拼音</p>' +
        '</div>' +

        // 输入区域
        '<div class="flex justify-center gap-3 mb-6">' +
          '<input type="text" id="dictInput" maxlength="1" placeholder="写汉字"' +
          '  class="w-32 h-16 text-center text-3xl border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 transition" />' +
          '<button id="dictConfirmBtn" onclick="ChineseApp._checkDictation(document.getElementById(\'app\'))"' +
          '  class="min-h-[56px] px-8 text-lg font-semibold bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition shadow-sm">' +
            '确认' +
          '</button>' +
        '</div>' +

        // 反馈区域
        '<div id="dictFeedback" class="text-center text-lg font-bold min-h-[40px]"></div>' +

        // 积分
        '<div class="text-center mt-4">' +
          '<span class="text-sm text-gray-400">当前得分：</span>' +
          '<span class="font-bold" style="color:#42A5F5">' + d.score + '</span>' +
        '</div>' +
      '</div>';

    // 自动聚焦输入框
    var input = document.getElementById('dictInput');
    if (input) {
      input.focus();
      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          ChineseApp._checkDictation(document.getElementById('app'));
        }
      });
    }
  }

  // 朗读当前听写字（读汉字，更清晰）
  function _speakDictation() {
    var current = _dictation.words[_dictation.index];
    if (current && window.Speech) {
      // 先读拼音，再读汉字和释义，让孩子更清楚
      Speech.speakChinese(current.char + '，' + current.meaning, 0.9);
    }
  }

  // 检查听写答案
  function _checkDictation(container) {
    if (_dictation.answered) return;

    var input = document.getElementById('dictInput');
    var feedback = document.getElementById('dictFeedback');
    if (!input || !feedback) return;

    var userChar = input.value.trim();
    if (!userChar) return;

    _dictation.answered = true;
    var current = _dictation.words[_dictation.index];
    var isCorrect = (userChar === current.char);

    if (isCorrect) {
      // 正确：绿色 ✓，积分+2
      feedback.innerHTML = '<span style="color:#4CAF50">\u2713 正确！</span>';
      _dictation.score += 2;
      window.Points.addPoints(2);
    } else {
      // 错误：红色 ✗，显示正确答案，加入错题本
      feedback.innerHTML =
        '<span style="color:#F44336">\u2717 错误！正确答案：<span class="text-xl">' + current.char + '</span>（' + current.pinyin + '）</span>';
      window.WrongBook.add({
        subject: 'chinese',
        grade: _dictation.grade,
        question: '听写：' + current.pinyin,
        correctAnswer: current.char,
        userAnswer: userChar,
        timestamp: Date.now()
      });
    }

    // 禁用输入和按钮
    input.disabled = true;
    input.classList.add('opacity-50');
    var confirmBtn = document.getElementById('dictConfirmBtn');
    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.classList.add('opacity-50');
    }

    // 1.5秒后自动下一题
    setTimeout(function() {
      _dictation.index++;
      _renderDictationQuestion(container);
    }, 1500);
  }

  // 渲染听写成绩页
  function _renderDictationResult(container) {
    var d = _dictation;
    var total = d.words.length;
    var maxScore = total * 2;
    var accuracy = Math.round((d.score / maxScore) * 100);

    var emoji, message;
    if (accuracy >= 100) {
      emoji = '\u{1F389}';
      message = '太棒了，全对！';
    } else if (accuracy >= 60) {
      emoji = '\u{1F44D}';
      message = '表现不错，再接再厉！';
    } else {
      emoji = '\u{1F4AA}';
      message = '继续加油，多练几次！';
    }

    container.innerHTML =
      '<div class="max-w-2xl mx-auto text-center">' +
        '<div class="text-6xl mb-4">' + emoji + '</div>' +
        '<h2 class="text-2xl font-bold mb-2" style="color:#2D3436">听写完成！</h2>' +
        '<p class="text-gray-500 mb-8">' + message + '</p>' +

        '<div class="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-6">' +
          '<div class="text-5xl font-bold mb-2" style="color:#42A5F5">' + d.score + '</div>' +
          '<div class="text-gray-400">总分（满分' + maxScore + '）</div>' +
          '<div class="mt-4 text-sm text-gray-400">正确率 ' + accuracy + '%</div>' +
        '</div>' +

        '<div class="flex gap-3 justify-center">' +
          '<button onclick="ChineseApp.renderDictation(' + d.grade + ', document.getElementById(\'app\'))"' +
          '  class="min-h-[56px] px-6 text-lg font-semibold bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition shadow-sm">' +
            '\u{1F504} 再来一次' +
          '</button>' +
          '<button onclick="ChineseApp.render(' + d.grade + ', document.getElementById(\'app\'))"' +
          '  class="min-h-[56px] px-6 text-lg font-semibold bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition">' +
            '\u{1F3E0} 返回语文' +
          '</button>' +
        '</div>' +
      '</div>';

    // 满分解锁勋章
    if (accuracy === 100) {
      window.Points.unlockMedal('perfect_cn');
    }
  }

  // ========================================
  //  3. 渲染古诗页面
  // ========================================
  function renderPoems(grade, container) {
    var allPoems = window.POEMS_DATA || [];
    var poems = allPoems.filter(function(p) { return p.grade === grade; });

    var poemCards = '';
    for (var i = 0; i < poems.length; i++) {
      var poem = poems[i];
      var realIndex = allPoems.indexOf(poem);
      var lines = poem.text.split('\n');
      var isLong = lines.length > 2;
      var preview = isLong ? lines.slice(0, 2).join('\uFF0C') + '\u2026\u2026' : poem.text;

      poemCards +=
        '<div class="bg-amber-50 rounded-2xl border border-amber-200 p-5 shadow-sm">' +
          // 标题行
          '<div class="flex items-start justify-between mb-3">' +
            '<div>' +
              '<span class="text-lg font-bold text-gray-800">' + poem.title + '</span>' +
              '<span class="text-sm text-gray-500 ml-2">\u3010' + poem.dynasty + '\u3011' + poem.author + '</span>' +
            '</div>' +
            '<button onclick="ChineseApp._speakPoem(' + realIndex + ')"' +
            '  class="text-2xl hover:scale-110 transition">\u{1F50A}</button>' +
          '</div>' +

          // 诗句预览
          '<div id="poemContent_' + realIndex + '">' +
            '<p class="text-gray-700 leading-relaxed">' + preview + '</p>' +
          '</div>' +

          // 诗句全文（默认隐藏）
          '<div id="poemFull_' + realIndex + '" class="hidden">' +
            '<p class="text-gray-700 leading-relaxed whitespace-pre-line">' + poem.text + '</p>' +
          '</div>' +

          // 操作按钮
          '<div class="flex gap-2 mt-3">' +
            (isLong
              ? '<button onclick="ChineseApp._togglePoem(' + realIndex + ')" id="poemToggle_' + realIndex + '"' +
                '  class="text-sm px-3 py-1 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition">查看全部</button>'
              : '') +
            '<button onclick="ChineseApp.renderPoemRecite(' + grade + ', ' + realIndex + ', document.getElementById(\'app\'))"' +
            '  class="text-sm px-3 py-1 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition font-semibold">' +
              '\u{1F4CB} 背诵测试' +
            '</button>' +
          '</div>' +
        '</div>';
    }

    container.innerHTML =
      '<div class="max-w-2xl mx-auto">' +
        '<div class="flex items-center justify-between mb-6">' +
          '<h2 class="text-2xl font-bold" style="color:#2D3436">\u{1F4D6} 必背古诗</h2>' +
          '<button class="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition"' +
          '  onclick="ChineseApp.render(' + grade + ', document.getElementById(\'app\'))">' +
            '\u2190 返回' +
          '</button>' +
        '</div>' +
        '<p class="text-gray-400 mb-6">' + grade + '年级 \u00B7 共' + poems.length + '首</p>' +

        (poems.length === 0
          ? '<div class="text-center py-12 text-gray-400">暂无该年级古诗数据</div>'
          : '<div class="space-y-4" id="poemsList">' + poemCards + '</div>') +

        '<div class="mt-8 text-center">' +
          '<button class="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-semibold hover:bg-gray-200 transition" onclick="App.goHome()">' +
            '\u{1F3E0} 返回首页' +
          '</button>' +
        '</div>' +
      '</div>';
  }

  // 朗读古诗
  function _speakPoem(index) {
    var poem = window.POEMS_DATA && window.POEMS_DATA[index];
    if (poem && window.Speech) {
      // 去掉换行，保留逗号句号让语音更自然
      var cleanText = poem.text.replace(/\n/g, '。');
      Speech.speakChinese(poem.title + '，' + poem.author + '。' + cleanText, 0.85);
    }
  }

  // 展开/收起古诗全文
  function _togglePoem(index) {
    var content = document.getElementById('poemContent_' + index);
    var full = document.getElementById('poemFull_' + index);
    var toggle = document.getElementById('poemToggle_' + index);
    if (!content || !full) return;

    if (full.classList.contains('hidden')) {
      full.classList.remove('hidden');
      content.classList.add('hidden');
      if (toggle) toggle.textContent = '收起';
    } else {
      full.classList.add('hidden');
      content.classList.remove('hidden');
      if (toggle) toggle.textContent = '查看全部';
    }
  }

  // ========================================
  //  4. 背诵测试
  // ========================================
  function renderPoemRecite(grade, poemIndex, container) {
    var poem = window.POEMS_DATA && window.POEMS_DATA[poemIndex];
    if (!poem) {
      container.innerHTML = '<div class="text-center py-12 text-gray-400">古诗数据不存在</div>';
      return;
    }

    // 将诗句拆成字符，区分汉字、标点和换行
    var chars = [];
    for (var i = 0; i < poem.text.length; i++) {
      var ch = poem.text[i];
      if (ch === '\n') {
        chars.push({ type: 'newline' });
      } else if (/[，。、！？；：\u201C\u201D\u2018\u2019（）\s]/.test(ch)) {
        chars.push({ type: 'punct', char: ch });
      } else {
        chars.push({ type: 'char', char: ch });
      }
    }

    // 找出所有可隐藏的汉字索引
    var charIndices = [];
    chars.forEach(function(c, i) {
      if (c.type === 'char') charIndices.push(i);
    });

    // 随机隐藏约35%的汉字（至少2个，不超过一半）
    var hideCount = Math.max(2, Math.min(Math.ceil(charIndices.length * 0.35), Math.floor(charIndices.length / 2)));
    var hiddenIndices = _randomPick(charIndices, hideCount).sort(function(a, b) { return a - b; });

    // 构建隐藏位置的快速查找
    var hiddenSet = {};
    hiddenIndices.forEach(function(idx) { hiddenSet[idx] = true; });

    // 初始化背诵状态
    _recite = {
      poem: poem,
      chars: chars,
      hiddenIndices: hiddenIndices,
      userAnswers: {},
      filledCount: 0,
      grade: grade
    };

    // 构建诗句区域HTML
    var charsHTML = _buildReciteCharsHTML(chars, hiddenSet, null);

    container.innerHTML =
      '<div class="max-w-2xl mx-auto">' +
        '<div class="flex items-center justify-between mb-6">' +
          '<h2 class="text-2xl font-bold" style="color:#2D3436">\u{1F4CB} 背诵测试</h2>' +
          '<button class="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition"' +
          '  onclick="ChineseApp.renderPoems(' + grade + ', document.getElementById(\'app\'))">' +
            '\u2190 返回' +
          '</button>' +
        '</div>' +

        // 诗题信息
        '<div class="bg-amber-50 rounded-2xl border border-amber-200 p-6 mb-6 text-center">' +
          '<div class="text-xl font-bold text-gray-800">' + poem.title + '</div>' +
          '<div class="text-sm text-gray-500 mt-1">\u3010' + poem.dynasty + '\u3011' + poem.author + '</div>' +
          '<div class="text-xs text-gray-400 mt-2">共需填写 ' + hideCount + ' 个字</div>' +
        '</div>' +

        // 诗句填空区域
        '<div id="reciteArea" class="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">' +
          charsHTML +
        '</div>' +

        // 反馈区域
        '<div id="reciteFeedback" class="text-center mb-6"></div>' +
      '</div>';
  }

  // 构建背诵测试字符HTML（支持渲染模式和结果模式）
  function _buildReciteCharsHTML(chars, hiddenSet, userAnswers) {
    var html = '<div class="text-xl leading-loose text-center font-serif">';

    for (var i = 0; i < chars.length; i++) {
      var c = chars[i];

      if (c.type === 'newline') {
        html += '<br>';
      } else if (c.type === 'punct') {
        html += '<span class="text-gray-400 mx-0.5">' + c.char + '</span>';
      } else if (hiddenSet[i]) {
        if (userAnswers) {
          // 结果模式：显示对错
          var ans = userAnswers[i] || '';
          var correct = c.char;
          var ok = (ans === correct);
          if (ok) {
            html += '<span class="inline-block min-w-[32px] text-center py-1 px-1 rounded-lg font-bold" style="color:#4CAF50; background:#E8F5E9">' + correct + '</span>';
          } else {
            html += '<span class="inline-flex flex-col items-center min-w-[32px] mx-0.5">' +
              '<span class="py-1 px-1 rounded-lg font-bold" style="color:#F44336; background:#FFEBEE">' + correct + '</span>' +
              '<span class="text-xs text-gray-400 line-through">' + (ans || '?') + '</span>' +
            '</span>';
          }
        } else {
          // 填写模式：空白框
          html += '<button onclick="ChineseApp._onBlankClick(' + i + ')"' +
            '  class="inline-block min-w-[36px] min-h-[36px] border-2 border-dashed border-blue-300 rounded-lg bg-blue-50 hover:bg-blue-100 transition text-blue-400 cursor-pointer mx-0.5 align-middle"' +
            '  id="blank_' + i + '"></button>';
        }
      } else {
        html += '<span class="inline-block mx-0.5">' + c.char + '</span>';
      }
    }

    html += '</div>';
    return html;
  }

  // 点击空白框 → 弹出输入
  function _onBlankClick(charIndex) {
    // 已填写则忽略
    if (_recite.userAnswers[charIndex] !== undefined) return;

    var blank = document.getElementById('blank_' + charIndex);
    if (!blank) return;

    // 创建输入框替换空白按钮
    var input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 1;
    input.className = 'w-10 h-10 text-center text-xl border-2 border-blue-400 rounded-lg focus:outline-none bg-white';
    input.placeholder = '?';
    blank.replaceWith(input);
    input.focus();

    // 处理输入
    function handleSubmit() {
      var val = input.value.trim();
      if (!val) return;

      _recite.userAnswers[charIndex] = val;
      _recite.filledCount++;

      // 替换为已填写的显示
      var span = document.createElement('span');
      span.className = 'inline-block min-w-[36px] min-h-[36px] text-center leading-9 rounded-lg font-bold bg-blue-100 text-blue-700 mx-0.5';
      span.id = 'filled_' + charIndex;
      span.textContent = val;
      if (input.parentNode) {
        input.replaceWith(span);
      }

      // 全部填完自动判题
      if (_recite.filledCount >= _recite.hiddenIndices.length) {
        setTimeout(function() {
          _checkReciteResult();
        }, 300);
      }
    }

    input.addEventListener('input', handleSubmit);
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') handleSubmit();
    });
    input.addEventListener('blur', handleSubmit);
  }

  // 判定背诵测试结果
  function _checkReciteResult() {
    var r = _recite;
    var hiddenSet = {};
    r.hiddenIndices.forEach(function(idx) { hiddenSet[idx] = true; });

    // 统计正确数
    var correctCount = 0;
    r.hiddenIndices.forEach(function(idx) {
      if (r.userAnswers[idx] === r.chars[idx].char) {
        correctCount++;
      }
    });

    var total = r.hiddenIndices.length;
    var allCorrect = (correctCount === total);

    // 重新渲染诗句区域（结果模式）
    var area = document.getElementById('reciteArea');
    if (area) {
      area.innerHTML = _buildReciteCharsHTML(r.chars, hiddenSet, r.userAnswers);
    }

    var feedback = document.getElementById('reciteFeedback');
    if (!feedback) return;

    var poemRealIndex = window.POEMS_DATA.indexOf(r.poem);

    if (allCorrect) {
      // 全部正确
      feedback.innerHTML =
        '<div class="bg-green-50 border border-green-200 rounded-2xl p-6">' +
          '<div class="text-3xl mb-2">\u{1F389}</div>' +
          '<div class="text-xl font-bold" style="color:#4CAF50">背诵成功！</div>' +
          '<div class="text-sm text-gray-500 mt-1">全部填对，积分 +5</div>' +
        '</div>';
      window.Points.addPoints(5);
    } else {
      // 有错误
      feedback.innerHTML =
        '<div class="bg-red-50 border border-red-200 rounded-2xl p-6">' +
          '<div class="text-3xl mb-2">\u{1F4D6}</div>' +
          '<div class="text-xl font-bold" style="color:#F44336">还需努力</div>' +
          '<div class="text-sm text-gray-500 mt-1">答对 ' + correctCount + '/' + total + '，红色标记为错误位置</div>' +
        '</div>';

      // 错误的填空加入错题本
      r.hiddenIndices.forEach(function(idx) {
        if (r.userAnswers[idx] !== r.chars[idx].char) {
          window.WrongBook.add({
            subject: 'chinese',
            grade: r.grade,
            question: '\u300A' + r.poem.title + '\u300B填空：' + _getCharContext(r.chars, idx),
            correctAnswer: r.chars[idx].char,
            userAnswer: r.userAnswers[idx] || '',
            timestamp: Date.now()
          });
        }
      });
    }

    // 操作按钮
    feedback.innerHTML +=
      '<div class="flex gap-3 justify-center mt-4">' +
        '<button onclick="ChineseApp.renderPoemRecite(' + r.grade + ', ' + poemRealIndex + ', document.getElementById(\'app\'))"' +
        '  class="min-h-[56px] px-6 text-lg font-semibold bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition shadow-sm">' +
          '\u{1F504} 再测一次' +
        '</button>' +
        '<button onclick="ChineseApp.renderPoems(' + r.grade + ', document.getElementById(\'app\'))"' +
        '  class="min-h-[56px] px-6 text-lg font-semibold bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition">' +
          '\u{1F4D6} 返回古诗' +
        '</button>' +
      '</div>';
  }

  // 获取字符周围的上下文（用于错题本题目描述）
  function _getCharContext(chars, idx) {
    var start = Math.max(0, idx - 3);
    var end = Math.min(chars.length, idx + 4);
    var ctx = '';
    for (var i = start; i < end; i++) {
      if (chars[i].type === 'newline') {
        ctx += ' ';
      } else if (chars[i].type === 'char' || chars[i].type === 'punct') {
        ctx += chars[i].char;
      }
    }
    return ctx;
  }

  // ========================================
  //  5. 拼音练习（仅1年级）
  // ========================================
  function renderPinyin(container) {
    // 声母（23个）
    var shengmu = ['b','p','m','f','d','t','n','l','g','k','h','j','q','x','zh','ch','sh','r','z','c','s','y','w'];
    // 单韵母（6个）
    var danYunmu = ['a','o','e','i','u','\u00FC'];
    // 复韵母（9个）
    var fuYunmu = ['ai','ei','ui','ao','ou','iu','ie','\u00FCe','er'];
    // 鼻韵母（9个）
    var biYunmu = ['an','en','in','un','\u00FCn','ang','eng','ing','ong'];
    // 整体认读音节（16个）
    var zhengtiren = ['zhi','chi','shi','ri','zi','ci','si','yi','wu','yu','ye','yue','yuan','yin','yun','ying'];

    // 生成卡片HTML的辅助函数
    function makeCards(arr) {
      return arr.map(function(p) {
        return '<button onclick="ChineseApp._speakPinyin(\'' + p + '\')"' +
          '  class="min-w-[48px] text-xl px-3 py-3 rounded-xl bg-orange-50 border-2 border-orange-200 hover:bg-orange-100 hover:border-orange-400 hover:scale-105 active:scale-95 transition-all font-bold" style="color:#FF7043">' +
          p + '</button>';
      }).join('');
    }

    container.innerHTML =
      '<div class="max-w-2xl mx-auto">' +
        '<div class="flex items-center justify-between mb-6">' +
          '<h2 class="text-2xl font-bold" style="color:#2D3436">\u{1F524} 拼音练习</h2>' +
          '<button class="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition"' +
          '  onclick="ChineseApp.render(1, document.getElementById(\'app\'))">' +
            '\u2190 返回' +
          '</button>' +
        '</div>' +
        '<p class="text-gray-400 mb-6">点击拼音卡片可听发音</p>' +

        // 声母
        '<div class="mb-6">' +
          '<h3 class="text-lg font-bold mb-3" style="color:#FF7043">声母（23个）</h3>' +
          '<div class="flex flex-wrap gap-2">' + makeCards(shengmu) + '</div>' +
        '</div>' +

        // 单韵母
        '<div class="mb-6">' +
          '<h3 class="text-lg font-bold mb-3" style="color:#FF7043">单韵母（6个）</h3>' +
          '<div class="flex flex-wrap gap-2">' + makeCards(danYunmu) + '</div>' +
        '</div>' +

        // 复韵母
        '<div class="mb-6">' +
          '<h3 class="text-lg font-bold mb-3" style="color:#FF7043">复韵母（9个）</h3>' +
          '<div class="flex flex-wrap gap-2">' + makeCards(fuYunmu) + '</div>' +
        '</div>' +

        // 鼻韵母
        '<div class="mb-6">' +
          '<h3 class="text-lg font-bold mb-3" style="color:#FF7043">鼻韵母（9个）</h3>' +
          '<div class="flex flex-wrap gap-2">' + makeCards(biYunmu) + '</div>' +
        '</div>' +

        // 整体认读音节
        '<div class="mb-6">' +
          '<h3 class="text-lg font-bold mb-3" style="color:#FF7043">整体认读音节（16个）</h3>' +
          '<div class="flex flex-wrap gap-2">' + makeCards(zhengtiren) + '</div>' +
        '</div>' +

        '<div class="mt-4 text-center">' +
          '<button class="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-semibold hover:bg-gray-200 transition" onclick="App.goHome()">' +
            '\u{1F3E0} 返回首页' +
          '</button>' +
        '</div>' +
      '</div>';
  }

  // 拼音对应汉字映射（让朗读更清晰）
  var pinyinMap = {
    'a':'啊','o':'喔','e':'鹅','i':'衣','u':'乌','ü':'鱼',
    'ai':'爱','ei':'诶','ui':'喂','ao':'奥','ou':'欧','iu':'优',
    'ie':'耶','üe':'约','er':'耳',
    'an':'安','en':'恩','in':'因','un':'温','ün':'晕',
    'ang':'昂','eng':'鞥','ing':'鹰','ong':'翁',
    'zhi':'知','chi':'吃','shi':'诗','ri':'日','zi':'字','ci':'次','si':'丝',
    'yi':'衣','wu':'乌','yu':'鱼','ye':'爷','yue':'月','yuan':'圆',
    'yin':'因','yun':'云','ying':'鹰',
    'b':'玻','p':'坡','m':'摸','f':'佛',
    'd':'得','t':'特','n':'讷','l':'勒',
    'g':'哥','k':'科','h':'喝',
    'j':'基','q':'欺','x':'希',
    'zh':'织','ch':'吃','sh':'狮','r':'日',
    'z':'资','c':'次','s':'思','y':'医','w':'蛙'
  };

  // 朗读拼音（用对应汉字来读，更清晰）
  function _speakPinyin(pinyin) {
    if (window.Speech) {
      var ch = pinyinMap[pinyin] || pinyin;
      Speech.speakChinese(ch + '的读音是' + pinyin, 0.9);
    }
  }

  // 暴露公共API
  return {
    render: render,
    renderDictation: renderDictation,
    renderPoems: renderPoems,
    renderPoemRecite: renderPoemRecite,
    renderPinyin: renderPinyin,
    // 以下为内部方法，挂到 window 上供 onclick 调用
    _speakDictation: _speakDictation,
    _checkDictation: _checkDictation,
    _speakPoem: _speakPoem,
    _togglePoem: _togglePoem,
    _onBlankClick: _onBlankClick,
    _speakPinyin: _speakPinyin
  };
})();