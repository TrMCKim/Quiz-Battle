// js/screens/student-quiz.js
const StudentQuizScreen = {
  _elapsedTimer: null,
  _remainTimer:  null,
  _questionStartTime: null,

  mount(app) {
    app.innerHTML = `
      <div style="display:flex;flex-direction:column;height:100%;overflow:hidden">
        <div class="quiz-layout" style="flex:1;overflow:hidden">
          <!-- 대시보드 -->
          <div class="quiz-dashboard">
            <div class="dash-section">
              <div class="dash-label">정답 / 오답 / 남은 문제</div>
              <div class="dash-stats">
                <div class="dash-stat-box correct">
                  <div class="dash-stat-val" id="d-correct">0</div>
                  <div class="dash-stat-key">정답</div>
                </div>
                <div class="dash-stat-box wrong">
                  <div class="dash-stat-val" id="d-wrong">0</div>
                  <div class="dash-stat-key">오답</div>
                </div>
                <div class="dash-stat-box remain">
                  <div class="dash-stat-val" id="d-remain">-</div>
                  <div class="dash-stat-key">남은 문제</div>
                </div>
              </div>
            </div>

            <div class="dash-section">
              <div class="dash-label">풀이 현황</div>
              <div class="progress-dots" id="d-dots"></div>
            </div>

            <div class="dash-section">
              <div class="dash-label">시간</div>
              <div class="timer-box">
                <div class="timer-elapsed">
                  <span>경과</span><span class="val" id="d-elapsed">00:00</span>
                </div>
                <div class="timer-remain">
                  <span>남은 시간</span><span class="val" id="d-remain-time">--:--</span>
                </div>
              </div>
            </div>

            <div class="dash-section">
              <div class="dash-label">등수</div>
              <div class="rank-msg" id="d-rank">집계 중...</div>
            </div>

            <hr class="section-divider">
            <div class="dash-section">
              <div class="dash-label">이벤트</div>
              <div class="event-log" id="d-events"></div>
            </div>
          </div>

          <!-- 문제 영역 -->
          <div class="quiz-question-area" id="question-area">
            <div class="screen-center">
              <div class="spinner"></div>
              <p>문제를 불러오는 중...</p>
            </div>
          </div>
        </div>
      </div>`;

    this._init();
  },

  async _init() {
    // 세션에서 문제 목록 로드
    const snap = await DB.ref('/session').once('value');
    const session = snap.val();
    if (!session) { Router.navigate('/login', true); return; }

    AppState.gameTimeLimit  = session.timeLimit || 600;
    AppState.gameStartedAt  = session.startedAt;
    AppState.selectedQuestions = session.questions || [];

    // 문제 데이터 로드
    const qSnap = await DB.ref('/questions').once('value');
    const qAll  = qSnap.val() || {};
    AppState.questions = AppState.selectedQuestions
      .map(id => ({ id, ...qAll[id] }))
      .filter(q => q.body);

    this._startTimers();
    this._renderQuestion();
    this._listenPlayers();
    this._listenMyEvents();
  },

  _startTimers() {
    const startedAt = AppState.gameStartedAt;
    const limit     = AppState.gameTimeLimit;

    const tick = () => {
      const now     = Date.now();
      const elapsed = Math.floor((now - startedAt) / 1000);
      const remain  = limit - elapsed;

      const eEl = document.getElementById('d-elapsed');
      const rEl = document.getElementById('d-remain-time');
      if (eEl) eEl.textContent = fmtTime(elapsed);
      if (rEl) {
        rEl.textContent = fmtTime(Math.max(0, remain));
        if (remain < 60) rEl.style.color = 'var(--error)';
      }

      if (remain <= 0) {
        clearInterval(this._elapsedTimer);
        QuizDB.setPlayerDone(AppState.playerKey);
        AppState.clearListeners();
        Router.navigate('/student/result', true);
      }
    };
    this._elapsedTimer = setInterval(tick, 1000);
    tick();
  },

  _listenPlayers() {
    QuizDB.listenPlayers(players => {
      AppState.players = players;
      this._updateRank(players);

      // 추방 감지
      if (!players[AppState.playerKey]) {
        AppState.clearListeners();
        clearInterval(this._elapsedTimer);
        const app = document.getElementById('app');
        if (app) app.innerHTML = `<div class="screen-center">
          <p class="kick-msg">퇴장 처리되었습니다.</p>
        </div>`;
      }
    });

    // 세션 종료 감지
    QuizDB.listenSession(session => {
      if (session && session.status === 'finished') {
        AppState.clearListeners();
        clearInterval(this._elapsedTimer);
        Router.navigate('/student/result', true);
      }
    });
  },

  _listenMyEvents() {
    const ref = DB.ref(`/session/players/${AppState.playerKey}/events`);
    AppState.addListener(ref, 'child_added', snap => {
      const ev = snap.val();
      if (!ev) return;
      AppState.events.unshift(ev);
      this._updateEventLog();
    });
  },

  _updateEventLog() {
    const el = document.getElementById('d-events');
    if (!el) return;
    el.innerHTML = AppState.events.slice(0, 10).map(ev => `
      <div class="event-item">
        <span class="time">${fmtTs(ev.ts || Date.now())}</span>${ev.text}
      </div>`).join('');
  },

  _updateRank(players) {
    const rankings = calcRankings(players);
    const mine     = rankings.find(r => r.key === AppState.playerKey);
    if (!mine) return;

    const total = rankings.length;
    const rank  = mine.rank;
    const rankEl = document.getElementById('d-rank');
    if (!rankEl) return;

    let msg = '', cls = '';
    if (rank === 1 && total > 1) {
      const next = rankings[1];
      msg = `훌륭합니다. 현재 ${mine.nickname}님은 1등이고 바로 뒤는 ${next.nickname}님입니다.`;
      cls = 'first';
    } else if (rank === total && total > 1) {
      const prev = rankings[rank - 2];
      msg = `힘내세요. 현재 ${mine.nickname}님은 꼴등이고 바로 앞은 ${prev.nickname}님입니다.`;
      cls = 'last';
    } else if (total > 1) {
      const prev = rankings[rank - 2];
      const next = rankings[rank];
      msg = `현재 ${mine.nickname}님은 ${rank}등이고 바로 앞은 ${prev ? prev.nickname : '-'}님, 바로 뒤는 ${next ? next.nickname : '-'}님입니다.`;
    } else {
      msg = `현재 ${mine.nickname}님은 1등입니다.`;
      cls = 'first';
    }
    rankEl.textContent = msg;
    rankEl.className   = `rank-msg ${cls}`;
  },

  _renderQuestion() {
    const questions = AppState.questions;
    const idx       = AppState.currentQuestionIdx;

    // 통계 업데이트
    const correct = AppState.getCorrectCount();
    const wrong   = AppState.getWrongCount();
    const remain  = questions.length - Object.keys(AppState.answers).length;
    const dCorr   = document.getElementById('d-correct');
    const dWrong  = document.getElementById('d-wrong');
    const dRem    = document.getElementById('d-remain');
    const dDots   = document.getElementById('d-dots');

    if (dCorr)  dCorr.textContent  = correct;
    if (dWrong) dWrong.textContent = wrong;
    if (dRem)   dRem.textContent   = remain;

    if (dDots) {
      dDots.innerHTML = questions.map((_, i) => {
        const a = AppState.answers[i];
        let cls = '', sym = '_';
        if (a) {
          if (a.skipped) { cls = 'skip'; sym = '-'; }
          else if (a.correct) { cls = 'ok'; sym = 'O'; }
          else { cls = 'fail'; sym = 'X'; }
        }
        return `<div class="progress-dot ${cls}" title="${i+1}번">${sym}</div>`;
      }).join('');
    }

    // 모든 문제 완료
    if (idx >= questions.length) {
      QuizDB.setPlayerDone(AppState.playerKey);
      AppState.clearListeners();
      clearInterval(this._elapsedTimer);
      Router.navigate('/student/result', true);
      return;
    }

    const q = questions[idx];
    this._questionStartTime = Date.now();
    const area = document.getElementById('question-area');
    if (!area) return;

    const isChoice = q.type === 'choice';
    const opts = q.options || [];

    area.innerHTML = `
      <div class="question-number">문제 ${idx + 1} / ${questions.length}</div>
      <div class="question-body" id="q-body">${q.body}</div>
      ${q.imageUrl ? `<img class="question-img" src="${q.imageUrl}" alt="문제 그림">` : ''}
      ${isChoice
        ? `<div class="question-options" id="q-opts">
            ${opts.map((o, i) => `
              <button class="option-btn" data-idx="${i}" type="button">
                <span class="option-num">${i+1}</span>
                <span>${o}</span>
              </button>`).join('')}
           </div>`
        : `<input class="form-input short-answer-input" id="q-short" type="text"
              placeholder="답을 입력하세요" autocomplete="off" autofocus>`
      }
      <div class="quiz-actions">
        <button class="btn btn-ghost" id="q-skip">Skip</button>
        <button class="btn btn-primary" id="q-submit" ${isChoice ? 'disabled' : ''}>제출</button>
      </div>
      <div class="feedback-overlay hidden" id="q-feedback"></div>`;

    renderKatex(area);

    // 폰트 크기 자동 조절
    this._autoFontSize(document.getElementById('q-body'), q.body);

    if (isChoice) {
      let selected = null;
      area.querySelectorAll('.option-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          area.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          selected = btn.dataset.idx;
          document.getElementById('q-submit').disabled = false;
        });
      });
      document.getElementById('q-submit').addEventListener('click', () => {
        if (selected === null) return;
        const correct = String(parseInt(selected) + 1) === String(q.answer) ||
                        opts[parseInt(selected)] === q.answer;
        this._submitAnswer(String(selected), correct, q);
      });
    } else {
      const inp = document.getElementById('q-short');
      inp.focus();
      inp.addEventListener('input', () => {
        document.getElementById('q-submit').disabled = !inp.value.trim();
      });
      document.getElementById('q-submit').addEventListener('click', () => {
        const ans     = inp.value.trim();
        const correct = ans.toLowerCase() === String(q.answer).toLowerCase();
        this._submitAnswer(ans, correct, q);
      });
    }

    document.getElementById('q-skip').addEventListener('click', () => {
      this._skipQuestion();
    });
  },

  _autoFontSize(el, text) {
    if (!el) return;
    const len = text.length;
    let fs = '1rem';
    if      (len > 400) fs = '0.78rem';
    else if (len > 200) fs = '0.88rem';
    else if (len > 100) fs = '0.95rem';
    el.style.fontSize = fs;
  },

  async _submitAnswer(answer, correct, q) {
    const elapsed = Math.floor((Date.now() - this._questionStartTime) / 1000);
    const idx     = AppState.currentQuestionIdx;

    AppState.answers[idx] = { answer, correct, elapsed, skipped: false };
    await QuizDB.submitAnswer(AppState.playerKey, idx, answer, correct, elapsed);

    // 이벤트 체크
    await this._checkEvents(correct, idx, q);

    this._showFeedback(correct);
    setTimeout(() => {
      AppState.currentQuestionIdx++;
      this._renderQuestion();
    }, 1200);
  },

  async _skipQuestion() {
    const idx = AppState.currentQuestionIdx;
    AppState.answers[idx] = { skipped: true, correct: false };
    await QuizDB.skipQuestion(AppState.playerKey, idx);
    AppState.currentQuestionIdx++;
    this._renderQuestion();
  },

  async _checkEvents(correct, qIdx, q) {
    const pKey = AppState.playerKey;
    // 연속 정답
    if (correct) {
      const streak = this._getStreak();
      if (streak >= 3) {
        await QuizDB.pushEvent(pKey, `연속하여 ${streak}번 정답입니다`);
      }
      // 최초 정답
      const players = AppState.players;
      const firstCorrect = Object.values(players).every(p => {
        const a = (p.answers || {})[qIdx];
        return !a || !a.correct;
      });
      if (firstCorrect) {
        await QuizDB.pushEvent(pKey, `${AppState.nickname}님이 ${qIdx+1}번 문제를 최초로 해결하였습니다`);
      }
    }
    // 순위 역전은 listenPlayers 에서 처리 (별도 이벤트 발생)
  },

  _getStreak() {
    let streak = 0;
    const idx = AppState.currentQuestionIdx;
    for (let i = idx; i >= 0; i--) {
      const a = AppState.answers[i];
      if (a && a.correct) streak++;
      else break;
    }
    return streak;
  },

  _showFeedback(correct) {
    const fb = document.getElementById('q-feedback');
    if (!fb) return;
    fb.textContent = correct ? '축하합니다. 정답입니다!' : '아쉽습니다. 오답입니다.';
    fb.className   = `feedback-overlay ${correct ? 'correct' : 'wrong'}`;
  },

  unmount() {
    clearInterval(this._elapsedTimer);
  }
};
