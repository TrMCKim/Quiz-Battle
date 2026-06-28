// server.js
// ============================================================
//  Express 정적 파일 서버 (개발/Vercel 로컬 실행용)
// ============================================================
const express = require('express');
const path    = require('path');
const app     = express();
const PORT    = process.env.PORT || 3000;

// 정적 파일 서빙
app.use(express.static(path.join(__dirname, 'public')));

// SPA: 모든 경로를 index.html로 폴백
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Quiz Battle running on http://localhost:${PORT}`);
});
