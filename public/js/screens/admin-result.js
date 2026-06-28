// js/screens/admin-result.js
const AdminResultScreen = {
  mount(app) {
    app.innerHTML = `
      <div style="display:flex;flex-direction:column;height:100%;overflow:hidden">
        <div class="page-header">
          <div class="page-header-title">
            <span class="logo-badge">ADMIN</span> 게임 결과
          </div>
          <div class="page-header-actions">
            <button class="btn btn-primary" id="ar-new-btn">새 게임 시작</button>
          </div>
        </div>
        <div class="admin-result-layout" id="ar-body">
          <div class="screen-center"><div class="spinner"></div><p>결과 집계 중...</p></div>
        </div>
      </div>`;

    document.getElementById('ar-new-btn').addEventListener('click', async () => {
      const ok = await showPopup('새 게임을 시작하시겠습니까? 현재 세션이 초기화됩니다.');
      if (!ok) return;
      await QuizDB.clearSession();
      AppState.resetGame();
      Router.navigate('/admin/wait');
    });

    this._loadResult();
  },

  async _loadResult() {
    const snap    = await DB.ref('/session').once('value');
    const session = snap.val();
    if (!session) { Router.navigate('/admin/wait'); return; }

    const players   = session.players   || {};
    const questionIds = session.questions || [];

    const qSnap = await DB.ref('/questions').once('value');
    const qAll  = qSnap.val() || {};
    const questions = questionIds.map(id => ({ id, ...qAll[id] })).filter(q => q.body);

    const rankings = calcRankings(players);
    const body     = document.getElementById('ar-body');
    if (!body) return;

    // 순위 카드
    const rankHtml = rankings.map((p, i) => {
      const data   = players[p.key] || {};
      const ans    = data.answers   || {};
      const correct = Object.values(ans).filter(a => a.correct).length;
      const wrong   = Object.values(ans).filter(a => !a.correct && !a.skipped).length;
      const skip    = Object.values(ans).filter(a => a.skipped).length;
      const avgTime = Object.values(ans).length > 0
        ? (Object.values(ans).reduce((s, a) => s + (a.elapsed || 0), 0) / Object.values(ans).length).toFixed(1)
        : '-';
      const rankCls = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
      return `
        <div class="result-player-card">
          <div class="result-player-rank ${rankCls}">${p.rank}위</div>
          <div class="result-player-name">${p.nickname}</div>
          <div class="result-player-stats">정답 ${correct} · 오답 ${wrong} · Skip ${skip}</div>
          <div class="result-player-stats">평균 풀이 ${avgTime}초</div>
        </div>`;
    }).join('');

    // 문항별 정오표
    const tableRows = rankings.map(p => {
      const ans = (players[p.key] || {}).answers || {};
      const cells = questions.map((_, qi) => {
        const a = ans[qi];
        if (!a) return `<td>-</td>`;
        if (a.skipped) return `<td style="color:var(--text-muted)">Skip</td>`;
        return a.correct
          ? `<td class="ok">O</td>`
          : `<td class="fail">X<br><small style="font-size:.7rem">${a.answer || ''}</small></td>`;
      }).join('');
      return `<tr><td style="font-weight:700">${p.rank}위</td><td>${p.nickname}</td>${cells}</tr>`;
    }).join('');

    const qHeaders = questions.map((q, i) => `<th title="${q.body?.substring(0,30)}">${i+1}번</th>`).join('');

    body.innerHTML = `
      <div>
        <div style="font-size:.85rem;font-weight:700;color:var(--text-muted);margin-bottom:10px">최종 순위</div>
        <div class="result-summary-grid">${rankHtml}</div>
      </div>
      <div>
        <div style="font-size:.85rem;font-weight:700;color:var(--text-muted);margin-bottom:10px">문항별 정오 현황</div>
        <div style="overflow-x:auto">
          <table class="result-detail-table">
            <thead><tr><th>순위</th><th>별명</th>${qHeaders}</tr></thead>
            <tbody>${tableRows}</tbody>
          </table>
        </div>
      </div>`;
  },

  unmount() {}
};
