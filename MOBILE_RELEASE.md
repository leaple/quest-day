# QUEST DAY — Android / iOS 출시 준비 (2026-11)

> 상태: **네이티브 프로젝트 구성과 Android 디버그 빌드 자동화 준비**. 아직 Google Play / App Store 등록·심사·실제 출시 완료 상태가 아닙니다.

## 1. 출발점

- 기존 웹앱: https://leaple.github.io/quest-day/
- 앱 이름: QUEST DAY
- 임시 앱 ID: `io.github.leaple.questday` (첫 스토어 등록 전 소유권/고유성 확인 후 최종 확정)
- 기술: Capacitor 8 + 기존 웹 리소스를 `www/`에 동봉
- 핵심 게임/도감/캐릭터 자산은 오프라인에도 로드되지만, 로그인·친구·클라우드 동기화는 인터넷 및 Supabase가 필요합니다.
- PWA와 네이티브 앱은 처음 설치 시 브라우저 저장소를 자동 공유하지 않습니다. 동일한 인증 계정으로 로그인한 후 **클라우드 동기화 결과를 확인**해야 합니다. 미동기화 익명 기록의 자동 이전을 보장하지 않습니다.
- 계정 인증 메일은 네이티브 전용 URL 대신 기존 공개 HTTPS 사이트에서 열리도록 구성했습니다. 메일 확인 후 앱으로 돌아가 로그인하세요.

## 2. 무료로 시작하는 기기 테스트

**Android** — GitHub 저장소의 Actions → `QUEST DAY - Android test APK` → `Run workflow`를 실행하거나 관련 빌드 파일 변경 후 생성된 실행 결과에서 **quest-day-debug-apk** 파일을 받을 수 있습니다. 작업 성공을 확인하기 전에는 APK가 생성됐다고 가정하지 마세요. 디버그 APK는 **기기 테스트용이며 Play 스토어 등록용 서명 AAB가 아닙니다.**

로컬 개발 환경:
```bash
git clone https://github.com/leaple/quest-day.git
cd quest-day
npm install
npm run build:web
npx cap add android
npx cap sync android
npx cap open android
```

Android Studio에서 앱을 실행해 **퀘스트 생성·완료 / 캐릭터 원화 / 도감 / 게스트 이용 / 로그인 / 친구 / 앱 재시작 후 저장 / 오프라인 화면**을 점검하세요. 테스트 APK를 기기에 설치할 때는 본인의 소스와 빌드 결과를 확인해야 합니다.

**iOS** — macOS + Xcode가 있는 컴퓨터에서:
```bash
npm install
npm run build:web
npx cap add ios
npx cap sync ios
npx cap open ios
```
Xcode에서 본인/테스트 기기를 선택해 실행합니다. iPhone에서 웹사이트를 홈 화면에 추가하는 PWA 테스트와 **App Store용 iOS 앱 빌드**는 서로 다른 작업입니다.

## 3. 출시 심사 전 남은 필수 작업

- [ ] **개인정보처리방침**: 운영자 식별 및 실제 데이터 수집·보관·공유·삭제 설명과 연락 채널을 확정하고 앱 내/스토어 페이지에 링크 연결
- [ ] **계정 및 데이터 삭제**: 계정을 만드는 앱이므로 **실제 인증 계정과 Supabase의 연동 데이터를 삭제하는 기능**을 안전하게 구현. '게임 기록 초기화' 또는 '서버 공유 정보 삭제'만으로 충족한다고 간주하지 않음
- [ ] **앱 외부 계정 삭제 안내 URL**: Google Play 계정 삭제 요건에 맞춰 공개 웹페이지 제공
- [ ] **친구/사용자 생성 콘텐츠**: 신고·차단·관리 기능과 필요시 안전 대응 절차 검증
- [ ] **모바일 UX**: Android 뒤로가기, 키보드 가림, 안전 영역, 로그인 후 돌아오기, 화면 전환 및 에러 처리 테스트
- [ ] **앱 아이콘/시작 화면**: 현재 모바일 스토어용 아이콘·스플래시는 별도로 생성/검증 필요
- [ ] **스토어 메타데이터**: 앱 설명·스크린샷·개인정보/data safety·연령등급·지원 연락처·심사용 계정 또는 데모 모드
- [ ] **실제 릴리스 빌드/서명**: Android AAB 및 Play App Signing, iOS Archive/TestFlight 수행. 서명 키와 비밀번호를 GitHub 저장소에 업로드하지 말 것
- [ ] **앱 고유 기능과 심사 적합성**: iOS 앱은 단순 웹사이트 포장 이상이어야 함. QUEST DAY의 퀘스트·진화·수집 기능을 앱에서 유용하고 안정적으로 사용할 수 있는지 실기기 검증
- [ ] **Supabase 보안**: RLS 설정, 권한, 사용자 데이터 접근/삭제, 로그인 이메일 도메인/Redirect URLs, 익명 계정 처리 점검

## 4. 개발자 등록 및 심사 유의사항

- Google Play Console 개인 개발자: 공식 기준 **만 18세 이상**, 등록비 **US$25 일회성**. 특정 신규 개인 개발자 계정의 첫 프로덕션 출시는 **최소 12명, 연속 14일의 비공개 테스트** 요건이 적용될 수 있음.
- Apple Developer Program: 해당 지역의 **법정 성년 연령**을 충족해야 개인 명의 가입 가능. 기본 멤버십 비용 **US$99/년**, 지역에 따라 변동.
- 미성년 개발자는 나이를 허위로 입력하거나 타인의 계정을 무단 사용하는 대신 **법적 자격을 갖춘 보호자/조직이 정식 계정 주체로 참여**하는 방식 등 플랫폼 규정을 따라야 합니다.

공식 기준:
- https://capacitorjs.com/docs/getting-started
- https://support.google.com/googleplay/android-developer/answer/6112435
- https://support.google.com/googleplay/android-developer/answer/14151465
- https://support.google.com/googleplay/android-developer/answer/13327111
- https://developer.apple.com/help/account/membership/program-enrollment
- https://developer.apple.com/app-store/review/guidelines/
- https://developer.apple.com/help/app-review/guideline-reference/5-1-1-account-deletion/

## 5. 다음 작업 순서

1. GitHub Actions에서 디버그 APK 생성 성공 및 기기 실행 확인
2. Supabase 실제 **계정 삭제/데이터 삭제** 기능 + 정식 개인정보처리방침
3. 네이티브 앱 전용 안전 영역/앱 아이콘/권한 점검
4. TestFlight/Play 내부 테스트 → 테스트 기록 수집 → 정식 릴리스 AAB/IPA → 스토어 심사

**주의:** 이 문서와 설정 파일은 앱 패키징 시작점입니다. 자동으로 계정이 생성되거나 앱이 스토어에 등록되지는 않습니다.
