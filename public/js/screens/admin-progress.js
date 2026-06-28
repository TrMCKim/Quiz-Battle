// js/screens/admin-progress.js
const AdminProgressScreen = {
  _timerInterval: null,
  _prevRankings: [],

  mount(app) {
    app.innerHTML = `
      <div style="display:flex;flex-direction:column;height:100%;overflow:hidden">
        <!-- 상단 도구 -->
        <div class="progress-toolbar">
          <div class="page-header-title">
            <span class="logo-badge">ADMIN</span> 진행 관리
          </div>
          <div style="display:flex;align-items:center;gap:16px;margin-left:auto">
            <div>
              남은 시간: <span class="progress-timer" id="pg-timer">--:--</span>
            </div>
            <button class="btn btn-danger" id="pg-end-btn">문제 풀이 종료</button>
          </div>
        </div>

        <!-- 학생 그리드 -->
        <div class="progress-grid" id="pg-grid">
          <p style="color:var(--text-muted);padding:16px">학생을 기다리는 중...</p>
        </div>

        <!-- 게임 중 입장 요청 팝업 -->
        <div id="pg-enter-popup" class="enter-request-popup hidden"></div>
      </div>`;

    document.getElementById('pg-end-btn').addEventListener('click', async () => {
      const ok = await showPopup('게임을 즉시 종료하시겠습니까?');
      if (!ok) return;
      clearInterval(this._timerInterval);
      AppState.clearListeners();
      await QuizDB.endGame();
      Router.navigate('/admin/result');
    });

    this._listenSession();
    this._listenPendingEntrants();
  },

  _listenSession() {
    QuizDB.listenSession(session => {
      if (!session) return;

      // 타이머
      if (session.startedAt && !this._timerInterval) {
        this._startTimer(session.startedAt, session.timeLimit || 600);
      }

      // 게임 종료 감지
      if (session.status === 'finished') {
        clearInterval(this._timerInterval);
        AppState.clearListeners();
        Router.navigate('/admin/result', true);
        return;
      }

      // 플레이어 그리드
      const players  = session.players || {};
      AppState.players = players;
      const rankings = calcRankings(players);

      // 순위 역전 이벤트 감지
      if (this._prevRankings.length > 0) {
        this._detectRankChange(rankings);
      }
      this._prevRankings = rankings;

      this._renderGrid(rankings, session.questions || []);
    });
  },

  _startTimer(startedAt, limit) {
    const tick = () => {
      const now    = Date.now();
      const remain = limit - Math.floor((now - startedAt) / 1000);
      const el     = document.getElementById('pg-timer');
      if (!el) { clearInterval(this._timerInterval); return; }
      el.textContent = fmtTime(Math.max(0, remain));
      if (remain < 60) el.classList.add('danger');
      if (remain <= 0) {
        clearInterval(this._timerInterval);
        QuizDB.endGame().then(() => {
          AppState.clearListeners();
          Router.navigate('/admin/result');
        });
      }
    };
    this._timerInterval = setInterval(tick, 1000);
    tick();
  },

  async _detectRankChange(newRankings) {
    const prev = this._prevRankings;
    for (const cur of newRankings) {
      const old = prev.find(p => p.key === cur.key);
      if (!old) continue;
      if (old.rank > cur.rank && cur.rank < old.rank) {
        // 이 플레이어가 누군가를 추월했다
        const bumped = prev.find(p => p.rank === cur.rank);
        if (bumped) {
          await QuizDB.pushEvent(cur.key,    `${cur.nickname}님이 ${bumped.nickname}님을 추월하였습니다`);
          await QuizDB.pushEvent(bumped.key, `${cur.nickname}님이 ${bumped.nickname}님을 추월하였습니다`);
        }
      }
    }
  },

  _renderGrid(rankings, questionIds) {
    const grid = document.getElementById('pg-grid');
    if (!grid) return;
    if (rankings.length === 0) {
      grid.innerHTML = '<p style="color:var(--text-muted);padding:16px">학생을 기다리는 중...</p>';
      return;
    }
    const total = questionIds.length;
    grid.innerHTML = rankings.map(p => {
      const done    = p.done;
      const current = Object.keys(AppState.players[p.key]?.answers || {}).length;
      return `
        <div class="player-card ${done ? 'player-card-done' : ''}">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div class="player-card-name">${p.nickname}</div>
            <div class="player-card-rank">${p.rank}<span>등</span></div>
          </div>
          <div class="player-card-stats">
            <span class="ok">O ${p.correct}</span>
            <span style="color:var(--border)">|</span>
            <span class="fail">X ${Object.values(AppState.players[p.key]?.answers || {}).filter(a => !a.correct && !a.skipped).length}</span>
          </div>
          <div class="player-card-q">${current} / ${total} 문제</div>
        </div>`;
    }).join('');
  },

  _listenPendingEntrants() {
    QuizDB.listenPendingEntrants(pending => {
      const list    = Object.entries(pending).filter(([, v]) => v.status === 'pending');
      const popupEl = document.getElementById('pg-enter-popup');
      if (!popupEl) return;
      if (list.length === 0) {
        popupEl.classList.add('hidden');
        return;
      }
      const [key, { nickname }] = list[0];
      popupEl.classList.remove('hidden');
      popupEl.innerHTML = `
        <h4>입장 요청</h4>
        <p><strong>${nickname}</strong>님이 입장을 요청합니다.</p>
        <div class="enter-actions">
          <button class="btn btn-primary btn-sm" id="pg-allow">허가</button>
          <button class="btn btn-danger btn-sm"  id="pg-reject">거절</button>
        </div>`;
      document.getElementById('pg-allow').addEventListener('click', async () => {
        await QuizDB.resolvePendingEntrant(key, true);
      });
      document.getElementById('pg-reject').addEventListener('click', async () => {
        await QuizDB.resolvePendingEntrant(key, false);
      });
    });
  },

  unmount() {
    clearInterval(this._timerInterval);
  }
};
