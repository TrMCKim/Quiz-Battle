# Quiz Battle

> 교실 실시간 문제풀기 배틀 웹 애플리케이션

## 빠른 시작

### 1. Firebase 프로젝트 설정

1. [Firebase Console](https://console.firebase.google.com)에서 새 프로젝트 생성
2. **Realtime Database** 활성화 (지역: asia-northeast3)
3. **Storage** 활성화
4. **보안 규칙** 설정 (아래 참고)

### 2. Firebase 설정값 입력

`public/js/config.js`를 열고 Firebase 콘솔의 프로젝트 설정값으로 교체:

```js
const firebaseConfig = {
  apiKey:            "실제_API_KEY",
  authDomain:        "프로젝트_ID.firebaseapp.com",
  databaseURL:       "https://프로젝트_ID-default-rtdb.firebaseio.com",
  // ...
};
```

### 3. 관리자 비밀번호 설정

Firebase 콘솔에서 Realtime DB에 직접 입력:
```
/admin/password/hash = bcrypt 해시값
```

또는 브라우저 콘솔에서:
```js
const hash = dcodeIO.bcrypt.hashSync('2026', 10);
firebase.database().ref('/admin/password/hash').set(hash);
```

### 4. 윤리 가이드 이미지 배치

`public/assets/` 폴더에 `윤리가이드.png` 파일을 넣어주세요.

### 5. 로컬 실행

```bash
npm install
npm start
# http://localhost:3000
```

### 6. Vercel 배포

```bash
npm i -g vercel
vercel
```

## Firebase 보안 규칙

```json
{
  "rules": {
    "admin": {
      "password": {
        ".read":  false,
        ".write": false
      }
    },
    "questions": {
      ".read":  true,
      ".write": "auth != null"
    },
    "session": {
      ".read":  true,
      ".write": true
    }
  }
}
```

## 라우팅 구조

| 경로 | 화면 |
|------|------|
| `/login` | 로그인 (윤리 가이드 동의) |
| `/student/wait` | 학생 대기 |
| `/student/quiz` | 학생 문제 풀이 |
| `/student/result` | 학생 결과 |
| `/admin/wait` | 관리자 대기 |
| `/admin/db` | 문제 데이터베이스 관리 |
| `/admin/add` | 문제 추가 |
| `/admin/progress` | 진행 관리 |
| `/admin/result` | 최종 결과 |

## 기술 스택

- **Frontend**: Vanilla JS (SPA), KaTeX (수식), Firebase SDK
- **Backend**: Firebase Realtime DB, Firebase Storage
- **Hosting**: Vercel
- **보안**: bcryptjs (관리자 PW)

---

PRD v1.2 기반 | © 2026 Quiz Battle
