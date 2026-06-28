// js/db.js
// ============================================================
//  Firebase Realtime DB 연산 헬퍼
// ============================================================
const QuizDB = {

  /* ── 관리자 인증 ── */
  async verifyAdminPassword(plainPw) {
    const snap = await DB.ref('/admin/password/hash').once('value');
    const hash = snap.val();
    if (!hash) return false;
    // bcryptjs 사용
    return dcodeIO.bcrypt.compareSync(plainPw, hash);
  },

  async setAdminPassword(plainPw) {
    const hash = dcodeIO.bcrypt.hashSync(plainPw, 10);
    await DB.ref('/admin/password/hash').set(hash);
  },

  /* ── 문제 DB ── */
  async getQuestions() {
    const snap = await DB.ref('/questions').once('value');
    const data = snap.val() || {};
    return Object.entries(data).map(([id, q]) => ({ id, ...q }));
  },

  async saveQuestion(qData) {
    const newRef = DB.ref('/questions').push();
    await newRef.set(qData);
    return newRef.key;
  },

  async deleteQuestion(id) {
    await DB.ref(`/questions/${id}`).remove();
  },

  /* ── 게임 세션 (인메모리, 게임 종료 후 파기) ── */
  async initSession(questions, timeLimit) {
    const sessionData = {
      status:    'waiting',
      timeLimit: timeLimit,
      startedAt: null,
      questions: questions.map(q => q.id),
      players:   {}
    };
    await DB.ref('/session').set(sessionData);
  },

  async setSessionStatus(status) {
    await DB.ref('/session/status').set(status);
  },

  async startGame() {
    await DB.ref('/session').update({
      status:    'countdown',
      startedAt: firebase.database.ServerValue.TIMESTAMP
    });
  },

  async endGame() {
    await DB.ref('/session/status').set('finished');
  },

  async addPlayer(nickname) {
    const ref  = DB.ref('/session/players').push();
    const key  = ref.key;
    await ref.set({ nickname, answers: {}, events: [], done: false });
    return key;
  },

  async removePlayer(playerKey) {
    await DB.ref(`/session/players/${playerKey}`).remove();
  },

  async updateNickname(playerKey, nickname) {
    await DB.ref(`/session/players/${playerKey}/nickname`).set(nickname);
  },

  async submitAnswer(playerKey, qIdx, answer, correct, elapsed) {
    await DB.ref(`/session/players/${playerKey}/answers/${qIdx}`).set({
      answer, correct, elapsed, skipped: false, ts: firebase.database.ServerValue.TIMESTAMP
    });
  },

  async skipQuestion(playerKey, qIdx) {
    await DB.ref(`/session/players/${playerKey}/answers/${qIdx}`).set({
      skipped: true, correct: false, ts: firebase.database.ServerValue.TIMESTAMP
    });
  },

  async setPlayerDone(playerKey) {
    await DB.ref(`/session/players/${playerKey}/done`).set(true);
  },

  async pushEvent(playerKey, eventText) {
    await DB.ref(`/session/players/${playerKey}/events`).push({
      text: eventText,
      ts:   firebase.database.ServerValue.TIMESTAMP
    });
  },

  async addPendingEntrant(nickname) {
    const ref = DB.ref('/session/pendingEntrants').push();
    await ref.set({ nickname, status: 'pending' });
    return ref.key;
  },

  async resolvePendingEntrant(key, allow) {
    await DB.ref(`/session/pendingEntrants/${key}/status`).set(allow ? 'allowed' : 'rejected');
  },

  /* ── 리스너 헬퍼 ── */
  listenSession(cb) {
    const ref = DB.ref('/session');
    AppState.addListener(ref, 'value', snap => cb(snap.val()));
  },

  listenPlayers(cb) {
    const ref = DB.ref('/session/players');
    AppState.addListener(ref, 'value', snap => cb(snap.val() || {}));
  },

  listenMyPlayer(playerKey, cb) {
    const ref = DB.ref(`/session/players/${playerKey}`);
    AppState.addListener(ref, 'value', snap => cb(snap.val()));
  },

  listenPendingEntrants(cb) {
    const ref = DB.ref('/session/pendingEntrants');
    AppState.addListener(ref, 'value', snap => cb(snap.val() || {}));
  },

  async clearSession() {
    await DB.ref('/session').remove();
  },

  /* ── 이미지 업로드 ── */
  async uploadImage(file) {
    const ext  = file.name.split('.').pop();
    const path = `questions/${Date.now()}.${ext}`;
    const ref  = STORAGE.ref(path);
    await ref.put(file);
    return await ref.getDownloadURL();
  }
};
