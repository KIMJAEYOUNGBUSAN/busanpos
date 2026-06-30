# smsAPI Agent 배포 체크리스트

## 1. GitHub Pages 활성화

GitHub Pages는 백엔드를 실행하지 않고 정적 페이지를 배포합니다. 이 프로젝트에서는 `smsAPI/pages/index.html`을 API 사용 및 테스트 화면으로 배포합니다.

설정 순서:

1. GitHub 저장소로 이동
2. `Settings` 선택
3. 왼쪽 메뉴에서 `Pages` 선택
4. `Build and deployment`의 `Source`를 `GitHub Actions`로 선택
5. `Actions` 탭에서 `Deploy smsAPI Pages` 워크플로우를 다시 실행

Pages가 활성화되지 않은 상태에서는 `Deploy smsAPI Pages` 워크플로우가 실패할 수 있습니다.

## 2. 백엔드 배포 위치

Node.js 백엔드는 GitHub Pages에서 실행할 수 없습니다. 다음 중 하나에 배포합니다.

- Render
- Railway
- Fly.io
- 개인 VPS
- Docker를 지원하는 클라우드 서버

Render 기준 설정:

- Root Directory: `smsAPI`
- Start Command: `node server.js`
- Health Check Path: `/health`

## 3. 운영 환경변수

백엔드 호스팅 서비스에 다음 환경변수를 등록합니다.

```text
ADMIN_EMAIL=owner@example.com
ADMIN_PASSWORD=강력한_관리자_비밀번호
MASTER_KEY=32자_이상의_긴_랜덤_문자열
ALLOWED_ORIGINS=https://YOUR_GITHUB_USERNAME.github.io
```

`ALLOWED_ORIGINS`에는 실제 GitHub Pages 주소를 입력합니다. 예시는 다음과 같습니다.

```text
ALLOWED_ORIGINS=https://kimjaeyoungbusan.github.io
```

## 4. 발송사 설정

백엔드 배포 후 관리자 화면에 접속합니다.

```text
https://백엔드주소/
```

관리자 화면에서 설정할 항목:

- 솔라피 API Key
- 솔라피 API Secret
- 솔라피 기본 발신번호
- Resend API Key
- Resend 기본 발신 이메일
- 자체 API 클라이언트

## 5. Pages 테스트 화면 연결

GitHub Pages 화면에 접속한 뒤 다음 값을 입력합니다.

- 백엔드 URL: Render/Railway 등에 배포한 백엔드 주소
- 자체 API Key: 관리자 화면에서 생성한 클라이언트 API Key

이후 문자 테스트, 이메일 테스트, 발송 상태 조회를 사용할 수 있습니다.

## 6. 운영 전 확인사항

- 솔라피 발신번호가 콘솔에서 등록되어 있어야 합니다.
- Resend 발신 도메인이 인증되어 있어야 합니다.
- 테스트 모드를 끄기 전에 실제 발송 비용과 수신 동의 정책을 확인해야 합니다.
- 마케팅 문자/이메일 발송 전 수신 동의 및 수신 거부 정책을 별도로 준비해야 합니다.
