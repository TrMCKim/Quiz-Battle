// js/router.js
// ============================================================
//  History API 기반 SPA 라우터
// ============================================================
const Router = {
  routes: {},
  currentScreen: null,

  register(path, screen) {
    this.routes[path] = screen;
  },

  navigate(path, replace = false) {
    if (replace) {
      history.replaceState({}, '', path);
    } else {
      history.pushState({}, '', path);
    }
    this._resolve(path);
  },

  _resolve(path) {
    // 가드: 윤리 동의 확인
    if (!AppState.ethicsAgreed && path !== '/login') {
      this.navigate('/login', true);
      return;
    }
    // 가드: 학생/관리자 경로 보호
    if (path.startsWith('/admin') && !AppState.isAdmin) {
      this.navigate('/login', true);
      return;
    }

    const screen = this.routes[path] || this.routes['/login'];
    if (this.currentScreen && this.currentScreen.unmount) {
      this.currentScreen.unmount();
    }
    AppState.clearListeners();
    this.currentScreen = screen;
    const app = document.getElementById('app');
    app.innerHTML = '';
    screen.mount(app);
  },

  init() {
    window.addEventListener('popstate', () => this._resolve(location.pathname));
    this._resolve(location.pathname || '/login');
  }
};
