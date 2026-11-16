# QUEST DAY 2.4 — 소셜 로그인 연결 체크리스트

이 변경은 **웹/PWA OAuth 진입 UI**를 추가한 개발 브랜치 코드입니다. 제공자별 자격 증명이 없으므로 **로그인 성공을 검증하지 않았습니다.** 기존 이메일·게스트 인증은 그대로 유지합니다.

## Supabase 대시보드 설정
1. Authentication → Providers에서 Google, Apple, Kakao를 각각 활성화합니다. 각 공급자의 Client ID/Secret 등 공식 안내에 따른 설정이 필요합니다.
2. Authentication → URL Configuration에서 Site URL과 Redirect URLs에 **실제 사용하는 HTTPS 웹앱 주소**를 등록합니다. 정식 사이트와 테스트 사이트를 혼동하지 마세요.
3. Google Cloud Console OAuth 클라이언트, Apple Developer의 App ID / Services ID / Key, Kakao Developers 앱의 OAuth 설정을 각각 생성하고 **Supabase에서 안내하는 콜백 URL**을 공급자 쪽에 등록합니다.
4. 공급자 비밀 키는 GitHub 소스/정적 웹사이트에 넣지 말고 해당 공급자 콘솔 및 Supabase 설정에만 보관합니다.

## iOS/Android 네이티브 주의
현재 Capacitor 빌드에서는 안전한 외부 브라우저 로그인 후 앱 복귀(Universal Link / App Link / 커스텀 URL 스킴)를 구현하지 않았습니다. 따라서 네이티브 소셜 버튼은 설명 메시지를 표시하며 로그인을 시작하지 않습니다. 배포 전 앱 링크 설정, 외부 브라우저 사용, PKCE 세션 복원, iOS/Android 실기기 테스트가 필수입니다.

## 계정 데이터 보호
- 다른 소셜 계정으로 로그인하면 기존 게스트 친구 관계가 자동 이전되지 않을 수 있습니다.
- 계정 전환 시 게임 클라우드 데이터는 자동 덮어쓰기하지 않고 기존 충돌 확인 절차를 이용해야 합니다.
- 기존 로그인 사용자의 공급자 연결은 별도 계정 연결(Link Identity) 흐름으로 구현해야 합니다. 단순 소셜 로그인 버튼은 계정 병합을 보장하지 않습니다.
- 익명 계정에서 소셜 계정으로 전환하는 동작도 기록 보존 검증 전에는 정식 서비스에 노출하지 마세요.

## QA
- [ ] Google / Apple / Kakao 각각 웹 OAuth 로그인 및 취소
- [ ] 이메일 로그인, 회원가입, 게스트 시작 회귀 테스트
- [ ] 기존 계정으로 재로그인 후 퀘스트·XP·캐릭터·친구 유지
- [ ] 서로 다른 계정 간 클라우드 기록 자동 병합/덮어쓰기 방지
- [ ] iOS Safari PWA, Android Chrome, Capacitor 네이티브 복귀 경로
- [ ] 오류, 거절, 만료된 콜백 처리 및 로그인 상태 유지
- [ ] App Store 로그인 심사 가이드라인 4.8 및 계정 삭제 기능 확인

문서: https://supabase.com/docs/guides/auth/social-sign-in
