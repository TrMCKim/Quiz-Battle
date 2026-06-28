// js/app.js
// ============================================================
//  앱 진입점 — 윤리 가이드 + 라우터 초기화
// ============================================================
(function () {
  // ── 윤리 가이드 동의 처리 ──
  const overlay  = document.getElementById('ethics-overlay');
  const agreeBtn = document.getElementById('ethics-agree-btn');
  const app      = document.getElementById('app');

  agreeBtn.addEventListener('click', () => {
    AppState.ethicsAgreed = true;
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity .4s';
    setTimeout(() => {
      overlay.style.display = 'none';
      app.classList.remove('hidden');
    }, 400);
    initFooter();
    Router.init();
  });

  // ── 라우트 등록 ──
  Router.register('/login',            LoginScreen);
  Router.register('/student/wait',     StudentWaitScreen);
  Router.register('/student/quiz',     StudentQuizScreen);
  Router.register('/student/result',   StudentResultScreen);
  Router.register('/admin/wait',       AdminWaitScreen);
  Router.register('/admin/db',         AdminDbScreen);
  Router.register('/admin/add',        AdminAddScreen);
  Router.register('/admin/progress',   AdminProgressScreen);
  Router.register('/admin/result',     AdminResultScreen);
})();
