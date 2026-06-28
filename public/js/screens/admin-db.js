// js/screens/admin-db.js
const AdminDbScreen = {
  _allQuestions: [],
  _filterSource: '', _filterGrade: '', _filterUnit: '',

  mount(app) {
    app.innerHTML = `
      <div style="display:flex;flex-direction:column;height:100%;overflow:hidden">
        <!-- 헤더 -->
        <div class="page-header">
          <div class="page-header-title">
            <span class="logo-badge">ADMIN</span> 문제 데이터베이스 관리
          </div>
          <div class="page-header-actions">
            <button class="btn btn-ghost" id="db-back-btn">← 대기실</button>
          </div>
        </div>

        <!-- 툴바 -->
        <div class="db-toolbar">
          <button class="btn btn-primary" id="db-add-btn">+ 문제 추가</button>
          <div class="filter-row">
            <select class="filter-select" id="db-filter-source"><option value="">출처 전체</option></select>
            <select class="filter-select" id="db-filter-grade"><option value="">학년 전체</option></select>
            <select class="filter-select" id="db-filter-unit"><option value="">단원 전체</option></select>
          </div>
          <div class="db-question-count">
            <label>출제 문항 수</label>
            <select class="form-select" id="db-count-sel" style="width:80px"></select>
            <label style="display:flex;align-items:center;gap:4px">
              <input type="checkbox" id="db-auto-sel" style="accent-color:var(--primary)"> 자동선택
            </label>
          </div>
        </div>

        <!-- 문제 목록 -->
        <div class="db-list" id="db-list"></div>

        <!-- 하단 버튼 -->
        <div class="db-footer-bar">
          <span id="db-checked-info" style="color:var(--text-muted);font-size:.85rem;margin-right:auto"></span>
          <button class="btn btn-primary" id="db-confirm-btn">문제 선택 완료</button>
        </div>
      </div>`;

    document.getElementById('db-back-btn').addEventListener('click', () => Router.navigate('/admin/wait'));
    document.getElementById('db-add-btn').addEventListener('click', () => Router.navigate('/admin/add'));
    document.getElementById('db-confirm-btn').addEventListener('click', () => this._confirmSelection());

    // 필터
    ['db-filter-source','db-filter-grade','db-filter-unit'].forEach(id => {
      document.getElementById(id).addEventListener('change', () => this._applyFilter());
    });
    document.getElementById('db-auto-sel').addEventListener('change', () => this._applyAutoSelect());

    this._loadQuestions();
  },

  async _loadQuestions() {
    const qs = await QuizDB.getQuestions();
    this._allQuestions = qs;
    this._populateFilters(qs);
    this._populateCountSelect(qs.length);
    this._renderList(qs);
  },

  _populateFilters(qs) {
    const srcEl   = document.getElementById('db-filter-source');
    const gradeEl = document.getElementById('db-filter-grade');
    const unitEl  = document.getElementById('db-filter-unit');
    const uniq = key => [...new Set(qs.map(q => q[key]).filter(Boolean))];
    const fillSel = (el, vals) => {
      const first = el.options[0].outerHTML;
      el.innerHTML = first + vals.map(v => `<option value="${v}">${v}</option>`).join('');
    };
    fillSel(srcEl,   uniq('source'));
    fillSel(gradeEl, uniq('grade'));
    fillSel(unitEl,  uniq('unit'));
  },

  _populateCountSelect(total) {
    const sel = document.getElementById('db-count-sel');
    if (!sel) return;
    const max  = Math.min(total, 100);
    const def  = Math.min(10, max);
    sel.innerHTML = '';
    for (let i = 5; i <= max; i++) {
      sel.innerHTML += `<option value="${i}" ${i === def ? 'selected' : ''}>${i}문제</option>`;
    }
    if (max < 5) {
      for (let i = 1; i < 5 && i <= max; i++) {
        sel.innerHTML = `<option value="${i}">${i}문제</option>` + sel.innerHTML;
      }
    }
  },

  _applyFilter() {
    const src   = document.getElementById('db-filter-source').value;
    const grade = document.getElementById('db-filter-grade').value;
    const unit  = document.getElementById('db-filter-unit').value;
    const filtered = this._allQuestions.filter(q =>
      (!src   || q.source === src) &&
      (!grade || q.grade  === grade) &&
      (!unit  || q.unit   === unit)
    );
    this._renderList(filtered);
  },

  _applyAutoSelect() {
    const auto = document.getElementById('db-auto-sel').checked;
    if (!auto) return;
    const count = parseInt(document.getElementById('db-count-sel').value || 10);
    const qs    = this._getFiltered();
    const shuffled = [...qs].sort(() => Math.random() - .5).slice(0, count);
    const selIds   = new Set(shuffled.map(q => q.id));
    document.querySelectorAll('.q-checkbox').forEach(cb => {
      cb.checked = selIds.has(cb.dataset.id);
      cb.closest('.question-card').classList.toggle('checked', cb.checked);
    });
    this._updateCheckedInfo();
  },

  _getFiltered() {
    const src   = document.getElementById('db-filter-source')?.value || '';
    const grade = document.getElementById('db-filter-grade')?.value  || '';
    const unit  = document.getElementById('db-filter-unit')?.value   || '';
    return this._allQuestions.filter(q =>
      (!src   || q.source === src) &&
      (!grade || q.grade  === grade) &&
      (!unit  || q.unit   === unit)
    );
  },

  _renderList(qs) {
    const listEl = document.getElementById('db-list');
    if (!listEl) return;
    if (qs.length === 0) {
      listEl.innerHTML = `<div class="empty-state"><p>문제가 없습니다. 문제를 추가해주세요.</p></div>`;
      return;
    }
    listEl.innerHTML = qs.map(q => `
      <div class="question-card" id="qc-${q.id}">
        <input type="checkbox" class="q-checkbox" data-id="${q.id}">
        <div class="q-card-body">
          <span class="q-card-type">${q.type === 'choice' ? '선택형' : '단답형'}</span>
          <div class="q-card-body-text">${q.body?.substring(0,120) || ''}${(q.body?.length||0) > 120 ? '…' : ''}</div>
          ${q.options?.length ? `<div class="q-card-options">${q.options.map((o,i) => `${i+1}. ${o}`).join(' / ')}</div>` : ''}
          <div class="q-card-answer">정답: ${q.answer}</div>
          <div class="q-card-meta">
            ${[q.source && `출처: ${q.source}`, q.grade && `${q.grade}학년`, q.unit && `단원: ${q.unit}`].filter(Boolean).join(' · ')}
          </div>
          <div style="margin-top:6px">
            <button class="btn btn-danger btn-sm" onclick="AdminDbScreen._deleteQuestion('${q.id}')">삭제</button>
          </div>
        </div>
      </div>`).join('');

    listEl.querySelectorAll('.q-checkbox').forEach(cb => {
      cb.addEventListener('change', () => {
        cb.closest('.question-card').classList.toggle('checked', cb.checked);
        this._updateCheckedInfo();
      });
    });
  },

  _updateCheckedInfo() {
    const count = document.querySelectorAll('.q-checkbox:checked').length;
    const el = document.getElementById('db-checked-info');
    if (el) el.textContent = `${count}문제 선택됨`;
  },

  async _deleteQuestion(id) {
    const ok = await showPopup('이 문제를 삭제하시겠습니까?');
    if (!ok) return;
    await QuizDB.deleteQuestion(id);
    this._allQuestions = this._allQuestions.filter(q => q.id !== id);
    this._applyFilter();
    showToast('삭제되었습니다.', '');
  },

  _confirmSelection() {
    const checked = [...document.querySelectorAll('.q-checkbox:checked')];
    if (checked.length === 0) {
      showToast('출제할 문제를 선택해주세요.', 'error');
      return;
    }
    const selectedIds = checked.map(cb => cb.dataset.id);
    AppState.selectedQuestions = this._allQuestions.filter(q => selectedIds.includes(q.id));
    showToast(`${selectedIds.length}문제가 선택되었습니다.`, 'success');
    Router.navigate('/admin/wait');
  },

  unmount() {}
};
