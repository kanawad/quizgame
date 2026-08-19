// ── Questions Bank ──────────────────────────────────────────────────────────
const QUESTIONS = [
  {
    type: "single",
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    answer: 1,
    explanation: "Mars appears red due to iron oxide (rust) on its surface."
  },
  {
    type: "multi",
    question: "Which of the following are JavaScript data types? (Select all that apply)",
    options: ["String", "Boolean", "Float", "Symbol", "Character"],
    answers: [0, 1, 3],
    explanation: "JavaScript has String, Boolean, and Symbol as primitive types. Float and Character are not JS types."
  },
  {
    type: "fill",
    question: "The ______ protocol is used to securely transfer data over the web.",
    answer: "https",
    acceptedAnswers: ["https", "http secure", "hypertext transfer protocol secure"],
    explanation: "HTTPS (HyperText Transfer Protocol Secure) encrypts data in transit."
  },
  {
    type: "single",
    question: "What does CSS stand for?",
    options: ["Computer Style Sheets", "Cascading Style Sheets", "Creative Style System", "Coded Style Structure"],
    answer: 1,
    explanation: "CSS stands for Cascading Style Sheets."
  },
  {
    type: "order",
    question: "Arrange the steps of the HTTP request-response cycle in the correct order:",
    items: ["Client sends request", "DNS resolves domain", "Server processes request", "Server sends response", "Browser renders page"],
    correctOrder: [1, 0, 2, 3, 4],
    explanation: "DNS resolves first, then the client sends the request, server processes it, sends back a response, and the browser renders."
  },
  {
    type: "multi",
    question: "Which HTML elements are semantic? (Select all that apply)",
    options: ["<div>", "<article>", "<span>", "<nav>", "<section>"],
    answers: [1, 3, 4],
    explanation: "<article>, <nav>, and <section> carry meaning. <div> and <span> are generic containers."
  },
  {
    type: "fill",
    question: "In Big O notation, a binary search runs in O(______) time.",
    answer: "log n",
    acceptedAnswers: ["log n", "o(log n)", "logarithmic", "log(n)"],
    explanation: "Binary search halves the search space each step — that's O(log n)."
  },
  {
    type: "single",
    question: "Which data structure operates on a LIFO (Last In, First Out) basis?",
    options: ["Queue", "Stack", "Linked List", "Tree"],
    answer: 1,
    explanation: "A Stack is LIFO — the last element pushed is the first to be popped."
  },
  {
    type: "multi",
    question: "Which of these are valid CSS position values? (Select all that apply)",
    options: ["static", "absolute", "floating", "sticky", "overlap"],
    answers: [0, 1, 3],
    explanation: "static, absolute, and sticky are valid. 'floating' and 'overlap' are not CSS position values."
  },
  {
    type: "order",
    question: "Put the OSI model layers in order from lowest (1) to highest (7):",
    items: ["Network", "Application", "Physical", "Transport", "Data Link"],
    correctOrder: [2, 4, 0, 3, 1],
    explanation: "Physical (1) → Data Link (2) → Network (3) → Transport (4) → Application (7, simplified here)."
  }
];

const TIME_PER_QUESTION = 60;

// ── State ────────────────────────────────────────────────────────────────────
let state = {};

function initState() {
  state = {
    questions: shuffle([...QUESTIONS]),
    current: 0,
    score: 0,
    results: [],
    timer: null,
    timeLeft: TIME_PER_QUESTION,
    answered: false,
    dragSrc: null
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function $(id) { return document.getElementById(id); }

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
}

// ── Timer ─────────────────────────────────────────────────────────────────────
function startTimer() {
  state.timeLeft = TIME_PER_QUESTION;
  updateTimerDisplay();
  state.timer = setInterval(() => {
    state.timeLeft--;
    updateTimerDisplay();
    if (state.timeLeft <= 0) timeOut();
  }, 1000);
}

function stopTimer() {
  clearInterval(state.timer);
  state.timer = null;
}

function updateTimerDisplay() {
  const el = $('timer');
  el.textContent = state.timeLeft;
  el.classList.toggle('urgent', state.timeLeft <= 8);
}

function timeOut() {
  stopTimer();
  state.answered = true;
  const q = state.questions[state.current];
  state.results.push({ question: q, userAnswer: null, correct: false, timedOut: true });
  showFeedback('timeout-fb', `⏰ Time's up! ${q.explanation}`);
  revealCorrectAnswers(q);
  $('next-btn').disabled = false;
}

// ── Rendering ─────────────────────────────────────────────────────────────────
function renderQuestion() {
  const q = state.questions[state.current];
  const total = state.questions.length;

  // header
  $('question-counter').textContent = `Question ${state.current + 1} / ${total}`;
  $('progress-bar').style.width = `${(state.current / total) * 100}%`;

  const typeBadge = $('question-type-badge');
  const typeMap = { single: ['single', 'Single Choice'], multi: ['multi', 'Multi Select'], fill: ['fill', 'Fill in Blank'], order: ['order', 'Ordering'] };
  typeBadge.className = `badge ${typeMap[q.type][0]}`;
  typeBadge.textContent = typeMap[q.type][1];

  // hint
  const hints = {
    single: 'Choose one answer',
    multi: 'Select all correct answers',
    fill: 'Type your answer below',
    order: 'Drag items into the correct order'
  };
  $('question-hint').textContent = hints[q.type];
  $('question-text').textContent = q.question;

  // hide all input areas
  $('options-container').innerHTML = '';
  $('fill-container').classList.add('hidden');
  $('order-container').classList.add('hidden');
  $('feedback').className = 'feedback hidden';
  $('feedback').textContent = '';
  $('next-btn').disabled = true;

  if (q.type === 'single') renderSingle(q);
  else if (q.type === 'multi') renderMulti(q);
  else if (q.type === 'fill') renderFill(q);
  else if (q.type === 'order') renderOrder(q);

  startTimer();
}

function renderSingle(q) {
  const container = $('options-container');
  q.options.forEach((opt, i) => {
    const el = document.createElement('div');
    el.className = 'option';
    el.dataset.index = i;
    el.innerHTML = `<span class="opt-marker">${String.fromCharCode(65 + i)}</span><span>${opt}</span>`;
    el.addEventListener('click', () => selectSingle(el, i, q));
    container.appendChild(el);
  });
}

function selectSingle(el, idx, q) {
  if (state.answered) return;
  stopTimer();
  state.answered = true;
  document.querySelectorAll('.option').forEach(o => { o.classList.remove('selected'); o.classList.add('locked'); });
  el.classList.add('selected');
  const correct = idx === q.answer;
  state.score += correct ? 1 : 0;
  state.results.push({ question: q, userAnswer: idx, correct, timedOut: false });
  revealCorrectAnswers(q);
  showFeedback(correct ? 'correct-fb' : 'wrong-fb', (correct ? '✅ Correct! ' : '❌ Wrong. ') + q.explanation);
  $('next-btn').disabled = false;
}

function renderMulti(q) {
  const container = $('options-container');
  q.options.forEach((opt, i) => {
    const el = document.createElement('div');
    el.className = 'option multi-type';
    el.dataset.index = i;
    el.dataset.selected = 'false';
    el.innerHTML = `<span class="opt-marker">✓</span><span>${opt}</span>`;
    el.addEventListener('click', () => toggleMulti(el));
    container.appendChild(el);
  });

  // confirm button
  const btn = document.createElement('button');
  btn.id = 'confirm-multi';
  btn.className = 'btn secondary';
  btn.style.marginTop = '14px';
  btn.textContent = 'Confirm Selection';
  btn.addEventListener('click', () => submitMulti(q));
  container.appendChild(btn);
}

function toggleMulti(el) {
  if (state.answered) return;
  const selected = el.dataset.selected === 'true';
  el.dataset.selected = String(!selected);
  el.classList.toggle('selected', !selected);
  el.querySelector('.opt-marker').textContent = !selected ? '✓' : '';
}

function submitMulti(q) {
  if (state.answered) return;
  stopTimer();
  state.answered = true;
  const selected = Array.from(document.querySelectorAll('.option[data-selected="true"]')).map(o => parseInt(o.dataset.index));
  selected.sort();
  const correct = JSON.stringify(selected) === JSON.stringify([...q.answers].sort());
  state.score += correct ? 1 : 0;
  state.results.push({ question: q, userAnswer: selected, correct, timedOut: false });
  document.querySelectorAll('.option').forEach(o => o.classList.add('locked'));
  $('confirm-multi').disabled = true;
  revealCorrectAnswers(q);
  showFeedback(correct ? 'correct-fb' : 'wrong-fb', (correct ? '✅ All correct! ' : '❌ Not quite. ') + q.explanation);
  $('next-btn').disabled = false;
}

function renderFill(q) {
  $('fill-container').classList.remove('hidden');
  const input = $('fill-input');
  input.value = '';
  input.className = '';
  input.disabled = false;
  input.focus();
  input.addEventListener('keydown', function handler(e) {
    if (e.key === 'Enter') { input.removeEventListener('keydown', handler); submitFill(q); }
  });

  // show submit button
  const btn = document.createElement('button');
  btn.id = 'confirm-fill';
  btn.className = 'btn secondary';
  btn.style.marginTop = '14px';
  btn.textContent = 'Submit Answer';
  btn.addEventListener('click', () => submitFill(q));
  $('fill-container').appendChild(btn);
}

function submitFill(q) {
  if (state.answered) return;
  const input = $('fill-input');
  const val = input.value.trim().toLowerCase();
  if (!val) return;
  stopTimer();
  state.answered = true;
  input.disabled = true;
  const btn = $('confirm-fill');
  if (btn) btn.disabled = true;
  const correct = q.acceptedAnswers.some(a => val === a.toLowerCase() || val.includes(a.toLowerCase()) || a.toLowerCase().includes(val));
  state.score += correct ? 1 : 0;
  state.results.push({ question: q, userAnswer: val, correct, timedOut: false });
  input.classList.add(correct ? 'correct' : 'wrong');
  showFeedback(correct ? 'correct-fb' : 'wrong-fb', (correct ? `✅ Correct! ` : `❌ The answer is "${q.answer}". `) + q.explanation);
  $('next-btn').disabled = false;
}

function renderOrder(q) {
  const container = $('order-container');
  container.classList.remove('hidden');
  container.innerHTML = '';

  // shuffle displayed items
  const indices = q.correctOrder.map((_, i) => i);
  const shuffled = shuffle([...indices]);

  shuffled.forEach((origIdx, pos) => {
    const el = document.createElement('div');
    el.className = 'order-item';
    el.draggable = true;
    el.dataset.origIdx = origIdx;
    el.innerHTML = `<span class="order-num">${pos + 1}</span><span>${q.items[origIdx]}</span><span class="order-handle">⠿</span>`;
    el.addEventListener('dragstart', onDragStart);
    el.addEventListener('dragover', onDragOver);
    el.addEventListener('drop', onDrop);
    el.addEventListener('dragend', onDragEnd);
    container.appendChild(el);
  });

  // confirm button
  const btn = document.createElement('button');
  btn.id = 'confirm-order';
  btn.className = 'btn secondary';
  btn.style.marginTop = '14px';
  btn.textContent = 'Confirm Order';
  btn.addEventListener('click', () => submitOrder(q));
  container.appendChild(btn);
}

// drag-and-drop for ordering
function onDragStart(e) {
  state.dragSrc = this;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}
function onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  document.querySelectorAll('.order-item').forEach(i => i.classList.remove('drag-over'));
  this.classList.add('drag-over');
}
function onDrop(e) {
  e.stopPropagation();
  if (state.dragSrc !== this) {
    const container = $('order-container');
    const items = [...container.querySelectorAll('.order-item')];
    const srcIdx = items.indexOf(state.dragSrc);
    const tgtIdx = items.indexOf(this);
    if (srcIdx < tgtIdx) container.insertBefore(state.dragSrc, this.nextSibling);
    else container.insertBefore(state.dragSrc, this);
    updateOrderNumbers();
  }
}
function onDragEnd() {
  this.classList.remove('dragging');
  document.querySelectorAll('.order-item').forEach(i => i.classList.remove('drag-over'));
}

function updateOrderNumbers() {
  document.querySelectorAll('.order-item').forEach((el, i) => {
    el.querySelector('.order-num').textContent = i + 1;
  });
}

function submitOrder(q) {
  if (state.answered) return;
  stopTimer();
  state.answered = true;
  const items = [...$('order-container').querySelectorAll('.order-item')];
  const userOrder = items.map(el => parseInt(el.dataset.origIdx));
  const correct = JSON.stringify(userOrder) === JSON.stringify(q.correctOrder);
  state.score += correct ? 1 : 0;
  state.results.push({ question: q, userAnswer: userOrder, correct, timedOut: false });

  // mark each item
  items.forEach((el, i) => {
    el.draggable = false;
    el.classList.add(userOrder[i] === q.correctOrder[i] ? 'correct' : 'wrong');
  });
  $('confirm-order').disabled = true;
  showFeedback(correct ? 'correct-fb' : 'wrong-fb', (correct ? '✅ Perfect order! ' : '❌ Not quite. ') + q.explanation);
  $('next-btn').disabled = false;
}

// ── Feedback & Reveal ─────────────────────────────────────────────────────────
function showFeedback(cls, msg) {
  const el = $('feedback');
  el.className = `feedback ${cls}`;
  el.textContent = msg;
}

function revealCorrectAnswers(q) {
  if (q.type === 'single') {
    document.querySelectorAll('.option').forEach(o => {
      const idx = parseInt(o.dataset.index);
      if (idx === q.answer) o.classList.add('correct');
      else if (o.classList.contains('selected')) o.classList.add('wrong');
    });
  } else if (q.type === 'multi') {
    document.querySelectorAll('.option').forEach(o => {
      const idx = parseInt(o.dataset.index);
      if (q.answers.includes(idx)) o.classList.add('correct');
      else if (o.dataset.selected === 'true') o.classList.add('wrong');
    });
  }
}

// ── Navigation ────────────────────────────────────────────────────────────────
function nextQuestion() {
  state.current++;
  state.answered = false;
  if (state.current < state.questions.length) {
    renderQuestion();
  } else {
    showResults();
  }
}

// ── Results ───────────────────────────────────────────────────────────────────
function showResults() {
  showScreen('result-screen');
  $('progress-bar').style.width = '100%';

  const total = state.questions.length;
  const pct = Math.round((state.score / total) * 100);

  // emoji & title
  let emoji, title, subtitle;
  if (pct === 100) { emoji = '🏆'; title = 'Perfect Score!'; subtitle = 'Absolutely flawless. You nailed every question!'; }
  else if (pct >= 80) { emoji = '🎉'; title = 'Great Job!'; subtitle = 'Really solid performance. Almost perfect!'; }
  else if (pct >= 60) { emoji = '👍'; title = 'Not Bad!'; subtitle = 'You\'re getting there. Review the misses and try again!'; }
  else if (pct >= 40) { emoji = '🤔'; title = 'Keep Practicing'; subtitle = 'Some good answers, but there\'s room to improve.'; }
  else { emoji = '📚'; title = 'Need More Study'; subtitle = 'Don\'t worry — review the answers and try again!'; }

  $('result-emoji').textContent = emoji;
  $('result-title').textContent = title;
  $('result-subtitle').textContent = subtitle;
  $('score-display').textContent = state.score;
  $('score-total').textContent = `/ ${total}`;

  // ring animation
  const circumference = 326.7;
  const offset = circumference - (pct / 100) * circumference;
  setTimeout(() => { $('ring-fill').style.strokeDashoffset = offset; }, 100);

  // breakdown
  const correct = state.results.filter(r => r.correct).length;
  const wrong = state.results.filter(r => !r.correct && !r.timedOut).length;
  const timedOut = state.results.filter(r => r.timedOut).length;
  $('breakdown').innerHTML = `
    <div class="breakdown-item"><div class="bi-val" style="color:#10b981">${correct}</div><div class="bi-label">Correct</div></div>
    <div class="breakdown-item"><div class="bi-val" style="color:#ef4444">${wrong}</div><div class="bi-label">Wrong</div></div>
    <div class="breakdown-item"><div class="bi-val" style="color:#f59e0b">${timedOut}</div><div class="bi-label">Timed Out</div></div>
    <div class="breakdown-item"><div class="bi-val">${pct}%</div><div class="bi-label">Accuracy</div></div>
  `;
}

// ── Review ────────────────────────────────────────────────────────────────────
function showReview() {
  showScreen('review-screen');
  const list = $('review-list');
  list.innerHTML = '';

  state.results.forEach((r, i) => {
    const q = r.question;
    const statusCls = r.timedOut ? 'timeout' : r.correct ? 'correct' : 'wrong';
    const statusLabel = r.timedOut ? '⏰ Timed Out' : r.correct ? '✅ Correct' : '❌ Wrong';

    let answerHtml = '';
    if (q.type === 'single') {
      const ua = r.userAnswer !== null ? q.options[r.userAnswer] : '—';
      const ca = q.options[q.answer];
      answerHtml = `Your answer: <span class="user-ans">${ua}</span><br>Correct: <span class="correct-ans">${ca}</span>`;
    } else if (q.type === 'multi') {
      const ua = r.userAnswer ? r.userAnswer.map(i => q.options[i]).join(', ') : '—';
      const ca = q.answers.map(i => q.options[i]).join(', ');
      answerHtml = `Your answer: <span class="user-ans">${ua}</span><br>Correct: <span class="correct-ans">${ca}</span>`;
    } else if (q.type === 'fill') {
      const ua = r.userAnswer || '—';
      answerHtml = `Your answer: <span class="user-ans">${ua}</span><br>Correct: <span class="correct-ans">${q.answer}</span>`;
    } else if (q.type === 'order') {
      const ua = r.userAnswer ? r.userAnswer.map(i => q.items[i]).join(' → ') : '—';
      const ca = q.correctOrder.map(i => q.items[i]).join(' → ');
      answerHtml = `Your order: <span class="user-ans">${ua}</span><br>Correct: <span class="correct-ans">${ca}</span>`;
    }

    list.innerHTML += `
      <div class="review-item">
        <div class="ri-header">
          <div class="ri-q">Q${i + 1}. ${q.question}</div>
          <span class="ri-result ${statusCls}">${statusLabel}</span>
        </div>
        <div class="ri-answers">${answerHtml}<br><em style="color:#64748b">${q.explanation}</em></div>
      </div>`;
  });
}

// ── Event Listeners ───────────────────────────────────────────────────────────
$('start-btn').addEventListener('click', () => {
  initState();
  showScreen('quiz-screen');
  renderQuestion();
});

$('next-btn').addEventListener('click', nextQuestion);

$('restart-btn').addEventListener('click', () => {
  initState();
  showScreen('quiz-screen');
  renderQuestion();
});

$('review-btn').addEventListener('click', showReview);
$('back-btn').addEventListener('click', () => showScreen('result-screen'));

// ── SVG gradient ──────────────────────────────────────────────────────────────
document.querySelector('.score-ring').insertAdjacentHTML('afterbegin', `
  <defs>
    <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#7c3aed"/>
      <stop offset="100%" stop-color="#06b6d4"/>
    </linearGradient>
  </defs>
`);