# QUEST DAY — Android / iOS 출시 준비 (2026-11)

> 상태: **Android 테스트 APK 재빌드 성공 및 빌드 내 삭제 페이지 포함 확인**, **iOS 시뮬레이터 Xcode 빌드 성공**. 삭제 기능 UI/서버 코드는 준비했지만 **실제 Supabase Edge Function 미배포·실계정 삭제 미검증**이며, Google Play / App Store 등록·심사·실제 출시는 아직 진행하지 않았습니다.

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
- [ ] **계정 및 데이터 삭제**: `account-deletion.js` 화면과 `supabase/functions/qd-delete-account/index.ts` 서버 코드를 작성함. **실제 프로젝트에 Edge Function을 배포하고 테스트 계정으로 삭제 범위 검증이 필수**. '게임 기록 초기화'만으로 충족하지 않음.
- [x] **앱 외부 삭제 요청 경로 마련**: https://leaple.github.io/quest-day/account-deletion.html → 브라우저에서 계정 로그인·삭제 화면 접근. 다만 서버 배포 전 삭제 실행은 불가
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
2. Supabase Edge Function **배포·테스트 계정으로 계정 및 관련 데이터 삭제 확인** + 운영자 정보가 검증된 정식 개인정보처리방침
3. 네이티브 앱 전용 안전 영역/앱 아이콘/권한 점검
4. TestFlight/Play 내부 테스트 → 테스트 기록 수집 → 정식 릴리스 AAB/IPA → 스토어 심사

**주의:** 이 문서와 설정 파일은 앱 패키징 시작점입니다. 자동으로 계정이 생성되거나 앱이 스토어에 등록되지는 않습니다.

## 6. 현재 삭제 기능의 배포 절차 (안전 검증 필수)

**코드만 GitHub에 있는 상태는 삭제 기능이 작동하는 상태가 아닙니다.** Edge Function 서버 실행 권한은 Supabase 프로젝트 소유자가 직접 관리해야 합니다.

1. Supabase의 테스트/스테이징 프로젝트를 별도로 만들거나 테스트 계정을 준비합니다. 본인/다른 사용자의 실제 계정으로 먼저 테스트하지 마세요.
2. `supabase/functions/qd-delete-account/index.ts`를 검토합니다. `withSupabase({ auth: "user" })`와 인증된 사용자 ID 재확인으로 본인 계정만 삭제하도록 설계했습니다.
3. Supabase CLI에서 연결한 **올바른 프로젝트를 확인**하고 `supabase functions deploy qd-delete-account`로 함수 배포를 진행합니다. JWT 검증을 임의로 해제하거나 **service_role/sb_secret 키를 브라우저/GitHub에 넣지 마세요**.
4. 테스트 계정으로 로그인해서 설정 → 계정 영구 삭제 → 확인 문구 입력 후 삭제를 진행합니다. 테스트 계정의 `auth.users`, `qd_cloud_saves`, `qd_profiles`, `qd_friendships`, `qd_messages`, `qd_reports` 등 **관련 테이블이 실제로 정리되는지 확인**해야 합니다. 다른 사용자의 데이터는 남아 있어야 합니다.
5. 게스트 계정도 삭제 시험을 진행하고, 삭제 실패·네트워크 단절·중복 요청 시 안전한지 검증합니다. 앱과 외부 페이지에서 모두 동작해야 합니다.

실제 DB 스키마와 외래 키가 저장소 SQL과 다르면 삭제 동작이 다를 수 있습니다. 서버 배포 권한과 검증 없이 완료로 표시하지 않습니다.

공개 삭제 요청 페이지: https://leaple.github.io/quest-day/account-deletion.html
개인정보처리방침 작성 초안: [STORE_PRIVACY_DRAFT.md](./STORE_PRIVACY_DRAFT.md) — **아직 공식 방침이 아니며 스토어 제출 불가**

## 7. iOS 컴파일 검증

GitHub Actions의 `QUEST DAY - iOS simulator build` 워크플로는 `macos-26` / Xcode 26 이상에서 `npx cap add ios`, `npx cap sync ios`와 iOS Simulator용 **서명 없는** 빌드를 검사합니다. **성공해도 아이폰 설치용 IPA·TestFlight·App Store 배포가 완료된 것은 아닙니다.** Apple Developer 등록 및 서명 환경, 실기기 테스트, 스토어 심사는 별도 단계입니다.

## 8. 최신 CI 검증 기록

- Android: [테스트 APK 빌드 성공](https://github.com/leaple/quest-day/actions/runs/43695433801). APK 안에 `index.html`, `account-deletion.js`, `account-deletion.html`, `characters-1.3.json` 포함 여부 검사 완료. **디버그 서명 테스트 APK이며 Play 제출용 AAB 아님**.
- iOS: [시뮬레이터 컴파일 성공](https://github.com/leaple/quest-day/actions/runs/43695465830). **서명된 iOS 앱/IPA/TestFlight 배포 아님**.
- 실제 Android/iPhone 기기에서 기능 및 데이터 동기화 테스트는 아직 진행하지 않았습니다.
