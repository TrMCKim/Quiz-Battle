// js/screens/admin-add.js
const AdminAddScreen = {
  _dirty: false,
  _uploadedImageUrl: null,

  mount(app) {
    app.innerHTML = `
      <div style="display:flex;flex-direction:column;height:100%;overflow:hidden">
        <!-- 헤더 -->
        <div class="page-header">
          <div class="page-header-title">
            <button class="btn btn-ghost btn-sm" id="add-back-btn">← 문제 데이터베이스 관리</button>
          </div>
        </div>

        <!-- 폼 -->
        <div class="add-layout">
          <form class="add-form" id="add-form" onsubmit="return false">

            <!-- 문제 유형 -->
            <div class="form-group">
              <label class="form-label">문제 유형 <span class="req">*</span></label>
              <select class="form-select" id="add-type">
                <option value="choice">선택형</option>
                <option value="short">단답형</option>
              </select>
            </div>

            <!-- 본문 -->
            <div class="form-group">
              <label class="form-label">문제 본문 <span class="req">*</span></label>
              <textarea class="form-textarea" id="add-body" rows="4" placeholder="문제 본문을 입력하세요. $수식$, $$수식$$ 지원"></textarea>
              <div class="form-hint">미리보기</div>
              <div class="latex-preview" id="add-body-preview"></div>
            </div>

            <!-- 보기 (선택형) -->
            <div id="add-options-wrap">
              <div class="add-section-title">보기</div>
              <div class="options-list" id="add-options-list">
                ${[1,2,3,4,5].map(i => `
                  <div class="option-row">
                    <span class="option-label">①②③④⑤`[i-1]??i</span>
                    <input class="form-input" type="text" id="add-opt-${i}"
                      placeholder="보기 ${i}${i<=2?' (필수)':' (선택)'}" ${i>4?'style="display:none"':''}>
                  </div>`).join('')}
              </div>
              <div id="add-opt-error" class="form-error hidden"></div>
            </div>

            <!-- 그림 업로드 -->
            <div class="form-group">
              <label class="form-label">그림 (선택)</label>
              <div class="upload-area" id="add-upload-area">
                <p style="color:var(--text-muted);font-size:.85rem">jpg / png / gif, 1MB 이하</p>
                <p style="font-size:.8rem;color:var(--text-muted)">클릭하여 파일 선택</p>
                <input type="file" id="add-img-input" accept=".jpg,.jpeg,.png,.gif" style="display:none">
              </div>
              <img id="add-img-preview" class="upload-preview hidden">
              <div id="add-img-error" class="form-error hidden"></div>
            </div>

            <!-- 정답 -->
            <div class="form-group">
              <label class="form-label">정답 <span class="req">*</span></label>
              <select class="form-select hidden" id="add-answer-sel"></select>
              <input class="form-input hidden" type="text" id="add-answer-txt" placeholder="정답을 입력하세요">
              <div id="add-answer-error" class="form-error hidden"></div>
            </div>

            <!-- 출처 -->
            <div class="form-group">
              <label class="form-label">출처 (선택)</label>
              <input class="form-input" type="text" id="add-source" placeholder="예: 2024학년도 수능, 교과서 p.42">
            </div>

            <!-- 학년 -->
            <div class="form-group">
              <label class="form-label">학년 (선택)</label>
              <input class="form-input" type="text" id="add-grade" placeholder="예: 1, 2, 3">
            </div>

            <!-- 단원 -->
            <div class="form-group">
              <label class="form-label">단원 (선택)</label>
              <input class="form-input" type="text" id="add-unit" placeholder="예: 2단원, 함수와 극한">
              <div class="form-hint">미리보기</div>
              <div class="latex-preview" id="add-unit-preview"></div>
            </div>

            <!-- 저장 -->
            <div class="add-form-actions">
              <div id="add-save-error" class="form-error" style="margin-right:auto"></div>
              <button type="button" class="btn btn-ghost" id="add-reset-btn">초기화</button>
              <button type="button" class="btn btn-primary" id="add-save-btn">저장</button>
            </div>
          </form>
        </div>
      </div>`;

    this._dirty = false;
    this._uploadedImageUrl = null;
    this._initTypeSwitch();
    this._initPreviewFields();
    this._initImageUpload();
    this._initActions();
  },

  _initTypeSwitch() {
    const typeEl     = document.getElementById('add-type');
    const optsWrap   = document.getElementById('add-options-wrap');
    const answerSel  = document.getElementById('add-answer-sel');
    const answerTxt  = document.getElementById('add-answer-txt');

    const update = () => {
      const isChoice = typeEl.value === 'choice';
      optsWrap.style.display  = isChoice ? '' : 'none';
      answerSel.classList.toggle('hidden', !isChoice);
      answerTxt.classList.toggle('hidden',  isChoice);
      if (isChoice) this._updateAnswerOptions();
    };
    typeEl.addEventListener('change', update);

    // 보기 입력 → 정답 드롭다운 업데이트
    [1,2,3,4,5].forEach(i => {
      const el = document.getElementById(`add-opt-${i}`);
      if (el) el.addEventListener('input', () => { this._dirty = true; this._updateAnswerOptions(); });
    });

    update();
  },

  _updateAnswerOptions() {
    const sel = document.getElementById('add-answer-sel');
    if (!sel) return;
    const opts = [1,2,3,4,5].map(i => {
      const val = document.getElementById(`add-opt-${i}`)?.value?.trim();
      return val ? { i, val } : null;
    }).filter(Boolean);
    const prev = sel.value;
    sel.innerHTML = '<option value="">-- 정답 선택 --</option>' +
      opts.map(o => `<option value="${o.i}" ${prev == o.i ? 'selected' : ''}>${o.i}. ${o.val.substring(0,30)}</option>`).join('');
  },

  _initPreviewFields() {
    const mkPreview = (inputId, previewId) => {
      const input   = document.getElementById(inputId);
      const preview = document.getElementById(previewId);
      if (!input || !preview) return;
      input.addEventListener('input', () => {
        this._dirty = true;
        preview.innerHTML = input.value;
        renderKatex(preview);
      });
    };
    mkPreview('add-body', 'add-body-preview');
    mkPreview('add-unit', 'add-unit-preview');
  },

  _initImageUpload() {
    const area     = document.getElementById('add-upload-area');
    const input    = document.getElementById('add-img-input');
    const preview  = document.getElementById('add-img-preview');
    const errEl    = document.getElementById('add-img-error');

    area.addEventListener('click', () => input.click());
    area.addEventListener('dragover', e => { e.preventDefault(); area.style.borderColor = 'var(--primary)'; });
    area.addEventListener('dragleave', ()  => { area.style.borderColor = ''; });
    area.addEventListener('drop', e => {
      e.preventDefault();
      area.style.borderColor = '';
      if (e.dataTransfer.files[0]) this._handleImageFile(e.dataTransfer.files[0], preview, errEl);
    });
    input.addEventListener('change', () => {
      if (input.files[0]) this._handleImageFile(input.files[0], preview, errEl);
    });
  },

  async _handleImageFile(file, preview, errEl) {
    errEl.classList.add('hidden');
    const allowed = ['image/jpeg','image/png','image/gif'];
    if (!allowed.includes(file.type)) {
      errEl.textContent = 'jpg, png, gif 파일만 업로드 가능합니다.';
      errEl.classList.remove('hidden'); return;
    }
    if (file.size > 1024 * 1024) {
      errEl.textContent = '파일 크기는 1MB 이하여야 합니다.';
      errEl.classList.remove('hidden'); return;
    }
    try {
      const url = await QuizDB.uploadImage(file);
      this._uploadedImageUrl = url;
      preview.src = url;
      preview.classList.remove('hidden');
      this._dirty = true;
    } catch (e) {
      errEl.textContent = '이미지 업로드에 실패했습니다. Firebase Storage를 확인해주세요.';
      errEl.classList.remove('hidden');
    }
  },

  _initActions() {
    document.getElementById('add-back-btn').addEventListener('click', async () => {
      if (this._dirty) {
        const ok = await showPopup('작성 중인 내용이 있습니다. 저장하지 않고 나가시겠습니까?');
        if (!ok) return;
      }
      Router.navigate('/admin/db');
    });

    document.getElementById('add-reset-btn').addEventListener('click', async () => {
      const ok = await showPopup('입력 내용을 초기화하시겠습니까?');
      if (!ok) return;
      document.getElementById('add-form').reset();
      document.getElementById('add-body-preview').innerHTML = '';
      document.getElementById('add-unit-preview').innerHTML = '';
      document.getElementById('add-img-preview').classList.add('hidden');
      this._dirty = false; this._uploadedImageUrl = null;
    });

    document.getElementById('add-save-btn').addEventListener('click', () => this._save());

    // dirty tracking
    document.getElementById('add-form').addEventListener('input', () => { this._dirty = true; });
  },

  async _save() {
    const errEl   = document.getElementById('add-save-error');
    errEl.textContent = '';
    const type    = document.getElementById('add-type').value;
    const body    = document.getElementById('add-body').value.trim();
    const source  = document.getElementById('add-source').value.trim();
    const grade   = document.getElementById('add-grade').value.trim();
    const unit    = document.getElementById('add-unit').value.trim();

    // 유효성 검사
    if (!body) { errEl.textContent = '문제 본문을 입력해주세요.'; return; }

    let answer = '';
    let options = [];

    if (type === 'choice') {
      options = [1,2,3,4,5].map(i => document.getElementById(`add-opt-${i}`)?.value?.trim()).filter(Boolean);
      if (options.length < 2) { errEl.textContent = '보기를 최소 2개 입력해주세요.'; return; }
      const sel = document.getElementById('add-answer-sel').value;
      if (!sel) { errEl.textContent = '정답을 선택해주세요.'; return; }
      answer = sel;
    } else {
      answer = document.getElementById('add-answer-txt').value.trim();
      if (!answer) { errEl.textContent = '정답을 입력해주세요.'; return; }
    }

    const btn = document.getElementById('add-save-btn');
    btn.disabled = true; btn.textContent = '저장 중...';

    try {
      await QuizDB.saveQuestion({
        type, body, options, answer,
        imageUrl: this._uploadedImageUrl || null,
        source: source || null,
        grade:  grade  || null,
        unit:   unit   || null
      });
      this._dirty = false;
      showToast('문제가 저장되었습니다.', 'success');
      Router.navigate('/admin/db');
    } catch (e) {
      errEl.textContent = '저장에 실패했습니다. Firebase 설정을 확인해주세요.';
      console.error(e);
    }
    btn.disabled = false; btn.textContent = '저장';
  },

  unmount() {}
};
