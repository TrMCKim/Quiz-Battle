// js/screens/student-wait.js
const StudentWaitScreen = {
  mount(app) {
    app.innerHTML = `
      <div class="screen-center" id="sw-content">
        ${WAIT_SVG}
        <p class="wait-msg">게임이 시작할 때까지 기다려 주세요</p>
        <div class="wait-nickname-badge" id="sw-nick">${AppState.nickname}</div>
        <p style="color:var(--text-muted);font-size:.85rem">관리자가 게임을 시작하면 자동으로 이동됩니다.</p>
      </div>`;

    // 세션 상태 리스너
    QuizDB.listenSession(session => {
      if (!session) return;

      // 별명 변경 반영
      if (session.players && session.players[AppState.playerKey]) {
        const updated = session.players[AppState.playerKey].nickname;
        if (updated && updated !== AppState.nickname) {
          AppState.nickname = updated;
          const nb = document.getElementById('sw-nick');
          if (nb) nb.textContent = updated;
        }
        // 추방
        if (!session.players[AppState.playerKey]) {
          AppState.clearListeners();
          app.innerHTML = `<div class="screen-center">
            <p class="kick-msg">퇴장 처리되었습니다.</p>
          </div>`;
          return;
        }
      }

      if (session.status === 'countdown') {
        this._startCountdown(app);
      } else if (session.status === 'playing') {
        AppState.clearListeners();
        Router.navigate('/student/quiz', true);
      }
    });

    // 추방 감지
    const playerRef = DB.ref(`/session/players/${AppState.playerKey}`);
    AppState.addListener(playerRef, 'value', snap => {
      if (!snap.val()) {
        AppState.clearListeners();
        app.innerHTML = `<div class="screen-center">
          <p class="kick-msg">퇴장 처리되었습니다.</p>
          <button class="btn btn-ghost" onclick="Router.navigate('/login',true)">돌아가기</button>
        </div>`;
      }
    });
  },

  _startCountdown(app) {
    AppState.clearListeners();
    let count = 5;
    app.innerHTML = `<div class="screen-center">
      <p class="wait-msg">게임 시작!</p>
      <div class="countdown-display" id="cd-num">${count}</div>
    </div>`;
    const numEl = document.getElementById('cd-num');
    const iv = setInterval(() => {
      count--;
      if (numEl) {
        numEl.textContent = count;
        numEl.style.animation = 'none';
        void numEl.offsetWidth;
        numEl.style.animation = '';
      }
      if (count <= 0) {
        clearInterval(iv);
        Router.navigate('/student/quiz', true);
      }
    }, 1000);
  },

  unmount() {}
};
