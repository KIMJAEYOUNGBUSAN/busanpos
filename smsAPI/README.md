# smsAPI Agent

솔라피 문자 발송과 Resend 이메일 발송을 하나의 자체 API로 묶어 다른 홈페이지나 플랫폼에서 공통 발송 서버처럼 사용할 수 있는 MVP입니다.

## 실행

```bash
node server.js
```

브라우저에서 접속:

```text
http://localhost:3100
```

기본 관리자:

- 이메일: `admin@smsapi.local`
- 비밀번호: `1234`

운영 환경에서는 반드시 환경변수로 관리자 계정과 암호화 키를 바꾸세요.

```bash
set ADMIN_EMAIL=owner@example.com
set ADMIN_PASSWORD=strong-password
set MASTER_KEY=change-this-long-random-secret
node server.js
```

## 현재 구현 범위

- 관리자 로그인
- 솔라피 API Key, Secret, 기본 발신번호 저장
- Resend API Key, 기본 발신 이메일 저장
- API 키 암호화 저장
- 자체 API 클라이언트 생성
- 자체 API Key 발급
- 문자 발송 API
- 이메일 발송 API
- 발송 상태 조회 API
- 발송 이력 저장
- 일일 발송 한도
- 테스트 모드 발송
- 솔라피/Resend 실제 호출 어댑터

## 자체 API 예시

문자 발송:

```bash
curl -X POST http://localhost:3100/v1/messages/sms ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer 자체_API_KEY" ^
  -d "{\"to\":\"01012345678\",\"text\":\"[서비스명] 인증번호는 123456입니다.\",\"clientRequestId\":\"signup-1\"}"
```

이메일 발송:

```bash
curl -X POST http://localhost:3100/v1/messages/email ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer 자체_API_KEY" ^
  -d "{\"to\":\"customer@example.com\",\"subject\":\"가입 안내\",\"html\":\"<p>가입을 완료해 주세요.</p>\",\"clientRequestId\":\"signup-email-1\"}"
```

## 주의

- 실제 문자 발송은 솔라피 콘솔에 등록된 발신번호만 사용할 수 있습니다.
- 실제 이메일 발송은 Resend에서 인증된 발신 도메인을 사용해야 합니다.
- 관리자 설정에서 테스트 모드가 켜져 있으면 외부 발송사를 호출하지 않고 발송 성공처럼 기록합니다.

## GitHub Pages 구성

GitHub Pages는 정적 HTML, CSS, JavaScript만 호스팅합니다. Node.js 백엔드는 GitHub Pages에서 실행되지 않으므로 다음 구조로 배포합니다.

- GitHub Pages: `smsAPI/pages/index.html` API 안내 및 테스트 페이지
- Node 백엔드: Render, Railway, Fly.io, VPS 같은 Node 호스팅

이 저장소에는 GitHub Pages 자동 배포 워크플로우가 포함되어 있습니다.

```text
.github/workflows/deploy-smsapi-pages.yml
```

GitHub 저장소에 push한 뒤 저장소의 Pages 설정에서 GitHub Actions 배포를 사용하면 `smsAPI/pages`가 Pages로 배포됩니다.

## 백엔드 배포

운영용 백엔드는 `smsAPI` 폴더를 기준으로 배포합니다.

필수 환경변수:

```text
ADMIN_EMAIL=owner@example.com
ADMIN_PASSWORD=강력한_관리자_비밀번호
MASTER_KEY=32자_이상의_긴_랜덤_문자열
ALLOWED_ORIGINS=https://YOUR_GITHUB_USERNAME.github.io
```

`ALLOWED_ORIGINS`에는 GitHub Pages 주소를 넣습니다. 여러 주소는 쉼표로 구분합니다.

Render를 사용할 경우 `render.yaml`을 참고해 Web Service로 배포할 수 있습니다. Docker 기반 배포가 필요한 환경에서는 `Dockerfile`을 사용합니다.

백엔드 배포가 끝나면 GitHub Pages 화면에서 백엔드 URL과 자체 API Key를 입력해 문자/이메일 발송을 테스트합니다.
