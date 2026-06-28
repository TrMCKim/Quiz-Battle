// js/screens/login.js
const LoginScreen = {
  mount(app) {
    app.innerHTML = `
      <div class="login-wrap">
        <div class="login-card">
          <div class="login-logo">
            <h1>Quiz Battle</h1>
            <p>교실 실시간 문제풀기 배틀</p>
          </div>

          <div id="login-step-nick">
            <div class="form-group">
              <label class="form-label">별명 입력</label>
              <input id="login-nick" class="form-input" type="text"
                placeholder="별명을 입력하세요" maxlength="20" autocomplete="off">
            </div>
            <button id="login-nick-btn" class="btn btn-primary" style="width:100%;margin-top:4px">
              입장
            </button>
            <div id="login-error" class="login-error hidden"></div>
          </div>

          <div id="login-step-pw" class="hidden">
            <div class="form-group">
              <label class="form-label">관리자 비밀번호</label>
              <input id="login-pw" class="form-input" type="password"
                placeholder="비밀번호를 입력하세요" autocomplete="off">
            </div>
            <div style="display:flex;gap:8px;margin-top:4px">
              <button id="login-pw-back" class="btn btn-ghost" style="flex:1">뒤로</button>
              <button id="login-pw-btn"  class="btn btn-primary" style="flex:2">로그인</button>
            </div>
            <div id="login-pw-error" class="login-error hidden"></div>
          </div>
        </div>
      </div>`;

    const nickInput  = document.getElementById('login-nick');
    const nickBtn    = document.getElementById('login-nick-btn');
    const pwStep     = document.getElementById('login-step-pw');
    const nickStep   = document.getElementById('login-step-nick');
    const pwInput    = document.getElementById('login-pw');
    const pwBtn      = document.getElementById('login-pw-btn');
    const pwBack     = document.getElementById('login-pw-back');
    const errEl      = document.getElementById('login-error');
    const pwErrEl    = document.getElementById('login-pw-error');

    nickInput.focus();

    function showError(el, msg) {
      el.textContent = msg;
      el.classList.remove('hidden');
    }
    function hideError(el) { el.classList.add('hidden'); }

    // 별명 입력 → 다음 단계
    async function handleNickSubmit() {
      const nick = nickInput.value.trim();
      if (!nick) { showError(errEl, '별명을 입력해주세요.'); return; }
      if (nick.length > 20) { showError(errEl, '별명은 20자 이내로 입력해주세요.'); return; }
      hideError(errEl);

      if (nick === 'admin') {
        // 관리자 모드: 비밀번호 입력 칸 노출
        nickStep.classList.add('hidden');
        pwStep.classList.remove('hidden');
        pwInput.focus();
      } else {
        // 학생 모드: 세션 상태 확인 후 입장
        nickBtn.disabled = true;
        nickBtn.textContent = '확인 중...';
        try {
          const snap = await DB.ref('/session/status').once('value');
          const status = snap.val();

          AppState.isAdmin  = false;
          AppState.nickname = nick;

          if (!status || status === 'waiting') {
            // 게임 미시작: 바로 입장
            const key = await QuizDB.addPlayer(nick);
            AppState.playerKey = key;
            Router.navigate('/student/wait');
          } else if (status === 'playing' || status === 'countdown') {
            // 게임 중: 관리자 허가 대기
            const pendingKey = await QuizDB.addPendingEntrant(nick);
            showPendingWait(nick, pendingKey);
          } else {
            showError(errEl, '게임이 이미 종료되었습니다. 다음 게임을 기다려 주세요.');
          }
        } catch (e) {
          showError(errEl, '오류가 발생했습니다. 다시 시도해주세요.');
          console.error(e);
        }
        nickBtn.disabled = false;
        nickBtn.textContent = '입장';
      }
    }

    nickBtn.addEventListener('click', handleNickSubmit);
    nickInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleNickSubmit(); });

    // 관리자 비밀번호 확인
    async function handlePwSubmit() {
      const pw = pwInput.value;
      if (!pw) { showError(pwErrEl, '비밀번호를 입력해주세요.'); return; }
      hideError(pwErrEl);
      pwBtn.disabled = true;
      pwBtn.textContent = '확인 중...';
      try {
        const ok = await QuizDB.verifyAdminPassword(pw);
        if (ok) {
          AppState.isAdmin  = true;
          AppState.nickname = 'admin';
          Router.navigate('/admin/wait');
        } else {
          showError(pwErrEl, '비밀번호가 올바르지 않습니다.');
        }
      } catch (e) {
        showError(pwErrEl, '오류가 발생했습니다.');
        console.error(e);
      }
      pwBtn.disabled = false;
      pwBtn.textContent = '로그인';
    }

    pwBtn.addEventListener('click', handlePwSubmit);
    pwInput.addEventListener('keydown', e => { if (e.key === 'Enter') handlePwSubmit(); });
    pwBack.addEventListener('click', () => {
      pwStep.classList.add('hidden');
      nickStep.classList.remove('hidden');
      nickInput.focus();
    });

    // 게임 중 입장 허가 대기
    function showPendingWait(nick, pendingKey) {
      const app = document.getElementById('app');
      app.innerHTML = `
        <div class="screen-center">
          ${WAIT_SVG}
          <p class="wait-msg">입장 허가를 기다리는 중...</p>
          <div class="wait-nickname-badge">${nick}</div>
          <p style="color:var(--text-muted);font-size:.9rem">관리자가 입장을 허가하면 자동으로 입장됩니다.</p>
          <div class="spinner"></div>
        </div>`;
      const ref = DB.ref(`/session/pendingEntrants/${pendingKey}/status`);
      AppState.addListener(ref, 'value', async snap => {
        const status = snap.val();
        if (status === 'allowed') {
          AppState.clearListeners();
          const key = await QuizDB.addPlayer(nick);
          AppState.playerKey = key;
          AppState.nickname  = nick;
          Router.navigate('/student/quiz');
        } else if (status === 'rejected') {
          AppState.clearListeners();
          app.innerHTML = `
            <div class="screen-center">
              <p class="kick-msg">입장이 거절되었습니다.</p>
              <button class="btn btn-ghost" onclick="Router.navigate('/login')">돌아가기</button>
            </div>`;
        }
      });
    }
  },

  unmount() {}
};
