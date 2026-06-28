// js/screens/student-result.js
const StudentResultScreen = {
  _questions: [],
  _qIdx: 0,

  mount(app) {
    // 다른 학생이 풀이 중인 경우: 대기 화면 우선 표시
    app.innerHTML = `
      <div class="result-waiting" id="result-waiting">
        ${DONE_SVG}
        <p class="wait-msg">수고하셨습니다!</p>
        <p style="color:var(--text-muted);font-size:.9rem">다른 학생이 문제를 풀고 있는 중입니다. 잠시만 기다려 주세요</p>
        <div class="spinner"></div>
      </div>
      <div id="result-main" class="hidden" style="flex:1;display:flex;flex-direction:column;overflow:hidden"></div>`;

    this._listenSession(app);
  },

  _listenSession(app) {
    QuizDB.listenSession(async session => {
      if (!session) return;
      const allDone = session.players
        ? Object.values(session.players).every(p => p.done)
        : true;

      if (session.status === 'finished' || allDone) {
        AppState.clearListeners();
        await this._loadAndRender(app, session);
      }
    });
  },

  async _loadAndRender(app, session) {
    // 문제 로드
    const qIds = session.questions || [];
    const snap  = await DB.ref('/questions').once('value');
    const qAll  = snap.val() || {};
    this._questions = qIds.map(id => ({ id, ...qAll[id] })).filter(q => q.body);

    // 플레이어 데이터 로드
    const players  = session.players || {};
    const rankings = calcRankings(players);
    const mine     = rankings.find(r => r.key === AppState.playerKey) || { rank: '-', correct: 0, nickname: AppState.nickname };
    const total    = this._questions.length;

    // 내 답변
    const myData    = players[AppState.playerKey] || {};
    const myAnswers = myData.answers || {};
    const myEvents  = Object.values(myData.events || {}).sort((a,b) => (a.ts||0) - (b.ts||0)).reverse();

    const correct = Object.values(myAnswers).filter(a => a.correct).length;
    const wrong   = Object.values(myAnswers).filter(a => !a.correct && !a.skipped).length;

    document.getElementById('result-waiting').classList.add('hidden');
    const mainEl = document.getElementById('result-main');
    mainEl.classList.remove('hidden');
    mainEl.innerHTML = `
      <div class="result-layout" style="flex:1;overflow:hidden;display:flex;flex-direction:column">
        <div class="result-header-bar">
          <h2>수고하셨습니다. ${mine.nickname}님은 정답 ${correct}문제, 오답 ${wrong}문제입니다.</h2>
          <p>${mine.nickname}님은 ${mine.rank}등을 하셨습니다.</p>
        </div>
        <div class="result-body" style="flex:1;overflow:hidden">
          <!-- 이벤트 확인 -->
          <div class="result-events">
            <h3>이벤트 목록</h3>
            ${myEvents.length === 0 ? '<p style="font-size:.8rem;color:var(--text-muted)">이벤트 없음</p>' :
              myEvents.map(ev => `
                <div class="result-event-item">
                  <span class="time">${fmtTs(ev.ts || 0)}</span>
                  ${ev.text}
                </div>`).join('')}
          </div>

          <!-- 문제 확인 -->
          <div class="result-question" id="rq-area">
            <div class="result-q-header">
              <h3 id="rq-num">문제 ${this._qIdx + 1} / ${total}</h3>
              <div class="result-q-nav">
                <button class="btn btn-ghost btn-sm" id="rq-prev">이전 문제</button>
                <button class="btn btn-ghost btn-sm" id="rq-next">다음 문제</button>
              </div>
            </div>
            <div id="rq-content"></div>
          </div>
        </div>
      </div>`;

    this._myAnswers = myAnswers;
    this._qIdx = 0;
    this._renderResultQuestion(total);

    document.getElementById('rq-prev').addEventListener('click', () => {
      if (this._qIdx > 0) { this._qIdx--; this._renderResultQuestion(total); }
    });
    document.getElementById('rq-next').addEventListener('click', () => {
      if (this._qIdx < total - 1) { this._qIdx++; this._renderResultQuestion(total); }
    });
  },

  _renderResultQuestion(total) {
    const q   = this._questions[this._qIdx];
    const ans = this._myAnswers[this._qIdx] || {};
    const numEl  = document.getElementById('rq-num');
    const prevEl = document.getElementById('rq-prev');
    const nextEl = document.getElementById('rq-next');
    const cont   = document.getElementById('rq-content');

    if (numEl)  numEl.textContent = `문제 ${this._qIdx + 1} / ${total}`;
    if (prevEl) prevEl.classList.toggle('hidden', this._qIdx === 0);
    if (nextEl) nextEl.classList.toggle('hidden', this._qIdx === total - 1);

    if (!q || !cont) return;
    const isChoice = q.type === 'choice';
    const opts     = q.options || [];
    const judgeStr = ans.skipped ? '⚡ Skip' : (ans.correct ? '⭕ 정답' : '❌ 오답');
    const judgeCls = ans.skipped ? '' : (ans.correct ? 'correct' : 'wrong');

    cont.innerHTML = `
      <div class="question-body">${q.body}</div>
      ${q.imageUrl ? `<img class="question-img" src="${q.imageUrl}" alt="문제 그림">` : ''}
      ${isChoice ? `<div class="question-options">
        ${opts.map((o,i) => `
          <div class="option-btn" style="cursor:default;${String(i+1) === String(q.answer) || o === q.answer ? 'border-color:var(--success);background:var(--success-bg)' : ''}">
            <span class="option-num">${i+1}</span><span>${o}</span>
          </div>`).join('')}
      </div>` : ''}
      <div class="result-answer-info" style="margin-top:16px;flex-wrap:wrap">
        <div class="result-answer-box answer">정답: ${q.answer}</div>
        ${ans.answer ? `<div class="result-answer-box ${judgeCls}">내 답변: ${ans.skipped ? 'Skip' : ans.answer}</div>` : ''}
        <div class="result-answer-box ${judgeCls}">${judgeStr}</div>
        ${q.source ? `<div class="result-answer-box" style="background:var(--bg);border-color:var(--border);color:var(--text-muted)">출처: ${q.source}</div>` : ''}
      </div>`;
    renderKatex(cont);
  },

  unmount() {}
};
