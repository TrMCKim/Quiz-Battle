// js/screens/admin-wait.js
const AdminWaitScreen = {
  mount(app) {
    app.innerHTML = `
      <div style="display:flex;flex-direction:column;height:100%;overflow:hidden">
        <!-- 상단 헤더 -->
        <div class="page-header">
          <div class="page-header-title">
            <span class="logo-badge">ADMIN</span> 관리자 대기실
          </div>
          <div class="page-header-actions">
            <button class="btn btn-outline-primary" id="aw-db-btn">문제 관리</button>
          </div>
        </div>

        <!-- 본문 -->
        <div class="admin-wait-layout" style="flex:1;overflow:hidden">
          <!-- 왼쪽: 학생 목록 -->
          <div class="admin-wait-left">
            <div class="player-list-header">
              <h3>접속 학생</h3>
              <span class="player-count-badge" id="aw-count">0</span>
            </div>
            <div class="player-list" id="aw-player-list">
              <p style="color:var(--text-muted);font-size:.85rem">아직 접속한 학생이 없습니다.</p>
            </div>
          </div>

          <!-- 오른쪽: 게임 설정 + 시작 -->
          <div class="admin-wait-right">
            <div class="time-setting">
              <label>게임 시간 설정</label>
              <div style="display:flex;align-items:center;gap:12px">
                <input type="range" id="aw-time-range" min="1" max="30" value="10"
                  style="width:180px;accent-color:var(--primary)">
                <span id="aw-time-label" style="font-size:1.1rem;font-weight:700;color:var(--primary);min-width:60px">10분</span>
              </div>
            </div>
            <button id="aw-start-btn" class="btn btn-primary btn-start-game">게임 시작</button>
            <p id="aw-start-msg" style="color:var(--text-muted);font-size:.85rem;text-align:center"></p>
          </div>
        </div>
      </div>`;

    document.getElementById('aw-db-btn').addEventListener('click', () => {
      Router.navigate('/admin/db');
    });

    // 게임 시간 슬라이더
    const range = document.getElementById('aw-time-range');
    const label = document.getElementById('aw-time-label');
    range.addEventListener('input', () => {
      label.textContent = `${range.value}분`;
    });

    // 게임 시작
    document.getElementById('aw-start-btn').addEventListener('click', async () => {
      const questions = AppState.selectedQuestions;
      if (!questions || questions.length === 0) {
        document.getElementById('aw-start-msg').textContent = '먼저 문제를 선택해주세요.';
        Router.navigate('/admin/db');
        return;
      }
      const timeLimit = parseInt(range.value) * 60;
      AppState.gameTimeLimit = timeLimit;

      await QuizDB.initSession(questions, timeLimit);
      await QuizDB.startGame();
      Router.navigate('/admin/progress');
    });

    // 학생 목록 실시간 표시
    QuizDB.listenSession(session => {
      if (!session) return;
      const players = session.players || {};
      AppState.players = players;
      this._renderPlayers(players);
    });
  },

  _renderPlayers(players) {
    const listEl = document.getElementById('aw-player-list');
    const countEl = document.getElementById('aw-count');
    const entries = Object.entries(players);
    if (countEl) countEl.textContent = entries.length;
    if (!listEl) return;
    if (entries.length === 0) {
      listEl.innerHTML = '<p style="color:var(--text-muted);font-size:.85rem">아직 접속한 학생이 없습니다.</p>';
      return;
    }
    listEl.innerHTML = entries.map(([key, p]) => `
      <div class="player-row" id="pr-${key}">
        <span class="nickname" id="pn-${key}">${p.nickname}</span>
        <button class="btn btn-ghost btn-sm" onclick="AdminWaitScreen._editNickname('${key}','${p.nickname}')">수정</button>
        <button class="btn btn-danger btn-sm" onclick="AdminWaitScreen._kickPlayer('${key}','${p.nickname}')">추방</button>
      </div>`).join('');
  },

  async _editNickname(key, current) {
    const newNick = prompt(`새 별명 입력 (현재: ${current}):`);
    if (!newNick || !newNick.trim()) return;
    await QuizDB.updateNickname(key, newNick.trim());
    showToast('별명이 변경되었습니다.', 'success');
  },

  async _kickPlayer(key, nick) {
    const ok = await showPopup(`${nick}님을 추방하시겠습니까?`);
    if (!ok) return;
    await QuizDB.removePlayer(key);
    showToast(`${nick}님이 추방되었습니다.`, '');
  },

  unmount() {}
};
