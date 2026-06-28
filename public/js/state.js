// js/state.js
// ============================================================
//  앱 전역 상태 싱글톤
// ============================================================
const AppState = {
  ethicsAgreed:        false,
  isAdmin:             false,
  nickname:            '',
  playerKey:           '',
  sessionStatus:       'waiting', // waiting|countdown|playing|finished
  gameTimeLimit:       600,       // seconds
  gameStartedAt:       null,
  questions:           [],        // 전체 문제 목록 (admin/db 에서 사용)
  selectedQuestions:   [],        // 이번 게임 출제 문제
  currentQuestionIdx:  0,
  answers:             {},        // { qIdx: { answer, correct, time } }
  events:              [],        // 이벤트 로그
  players:             {},        // Firebase players 실시간 스냅샷
  pendingEntrants:     [],        // 게임 중 입장 요청 대기 목록
  _listeners:          [],        // Firebase 리스너 레퍼런스 (cleanup용)

  /** 플레이어 결과 도우미 */
  getCorrectCount() {
    return Object.values(this.answers).filter(a => a.correct).length;
  },
  getWrongCount() {
    return Object.values(this.answers).filter(a => a.correct === false).length;
  },
  getSkipCount() {
    return Object.values(this.answers).filter(a => a.skipped).length;
  },

  /** 상태 초기화 (새 게임 시) */
  resetGame() {
    this.currentQuestionIdx = 0;
    this.answers            = {};
    this.events             = [];
    this.players            = {};
    this.pendingEntrants    = [];
    this.gameStartedAt      = null;
  },

  /** 리스너 전체 해제 */
  clearListeners() {
    this._listeners.forEach(({ ref, event, fn }) => ref.off(event, fn));
    this._listeners = [];
  },

  addListener(ref, event, fn) {
    ref.on(event, fn);
    this._listeners.push({ ref, event, fn });
  }
};
