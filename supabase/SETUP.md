# QUEST DAY 실시간 친구 설정 (1.6)

QUEST DAY는 GitHub Pages에 올라간 웹앱이라 실시간 친구 기능을 사용하려면 Supabase 프로젝트가 별도로 필요합니다. **기존 로컬 퀘스트·골드·캐릭터 데이터는 변하지 않습니다.** 설정 전에는 1.5의 코드 교환형 친구 기능이 유지됩니다.

## 순서

1. 이용 자격과 약관을 확인한 뒤 [Supabase](https://supabase.com/)에서 프로젝트를 준비합니다. 새 프로젝트 생성 시 데이터베이스 비밀번호는 안전하게 따로 보관하세요. 앱이나 GitHub에 넣지 않습니다.
2. Supabase Dashboard의 **Authentication → Providers → Anonymous Sign-Ins**를 활성화합니다. (대시보드 메뉴명은 변경될 수 있습니다.)
3. Dashboard의 **SQL Editor**를 열고 [quest-day-realtime.sql](./quest-day-realtime.sql) 파일 전체를 복사하여 실행합니다. 다른 프로젝트에서 실행하지 않도록 주의하세요. SQL은 QUEST DAY용 `qd_` 테이블과 함수만 생성합니다.
4. Supabase Dashboard에서 **Project URL**과 **publishable key**(기존 프로젝트라면 **anon/public key**)를 확인합니다. `service_role`, `sb_secret_`, 데이터베이스 비밀번호, 개인 계정 비밀번호는 GitHub에 절대 업로드하지 마세요.
5. GitHub [realtime-config.js](../realtime-config.js) 파일을 편집합니다. 예시:
   ```js
   window.QUEST_DAY_REALTIME_CONFIG = {
     url: "https://PROJECT-REF.supabase.co",
     publishableKey: "sb_publishable_..."
   };
   ```
   위 값은 예시입니다. 실제 프로젝트의 공개 연결 정보를 사용하고 Commit changes를 누르세요. GitHub Pages 코드에는 **공개 가능한 URL/publishable 키만** 둡니다.
6. iPhone 또는 Android의 QUEST DAY를 완전히 종료한 다음 다시 엽니다. **친구 → 실시간 친구 시작하기 → 동의**를 선택합니다. 최초 실행 시 프로젝트에 익명 로그인 계정이 생성됩니다.
7. 다른 기기에서도 QUEST DAY 친구 탭의 실시간 모드를 켜고 **초대 코드**를 교환합니다. 친구 요청을 받은 사용자가 **수락**해야 서로의 프로필을 볼 수 있습니다.
8. 한쪽에서 퀘스트를 완료하면 레벨·XP·완료 개수 요약이 서버로 전송되어 상대방 화면에 반영됩니다. WebSocket 연결이 일시적으로 끊기면 앱은 주기적으로 기록을 다시 확인합니다.

## 공유하는 정보

- 닉네임(실명 대신 별명 권장), 장착 캐릭터, 레벨, 누적 XP, 누적 완료 퀘스트 수, 연속 달성일.
- 사용자를 구분하기 위한 익명 Supabase 인증 식별자, 친구 신청 및 수락 관계.
- **공유하지 않는 정보:** 퀘스트 이름, 퀘스트별 완료 날짜/시간, 개인 메모, 골드, 구매 이력, 사진, 연락처.

## 데이터·인증 주의사항

- 익명 로그인은 현재 기기에 연결됩니다. 앱을 삭제하거나 브라우저 데이터를 지우거나 다른 기기로 바꾸면 **기존 익명 계정에 다시 접근하지 못할 수 있습니다**. 이용자가 늘어나면 계정 연결 기능을 별도로 개발하는 것이 좋습니다.
- **실시간 연결 끄기**는 기기에서 동기화를 중단할 뿐 서버 기록을 지우지는 않습니다. **내 서버 공유 정보 삭제** 버튼은 서버에 올린 내 친구 프로필·초대 코드·친구 관계·신청 기록을 지웁니다. 익명 Auth 계정 자체는 별도로 남을 수 있습니다.
- 기존 1.5의 수동 교환 친구 기록은 실시간 친구 관계로 자동 전환되지 않습니다. 실시간 기능에서는 서로 신청을 수락해야 합니다.
- 공개 전에도 권한 정책(RLS)을 유지해야 합니다. 이 SQL은 사용자가 직접 올린 통계를 친구에게만 보여주는 방식이므로, 공식/검증된 순위 기록은 아닙니다.
- Supabase 사용량과 요금제의 무료 한도를 확인하세요. 무료로 시작할 수 있어도 규모에 따라 제약이나 과금 조건이 달라질 수 있습니다.
- Supabase API 키는 공개형(publishable/anon)만 허용됩니다. 공개 키의 안전성은 SQL의 RLS에 의존하므로, 정책을 임의로 제거하면 안 됩니다.

## 문제 해결

- 친구 탭에 **서버를 아직 연결하지 않았어요**: GitHub `realtime-config.js`에 URL과 publishable key를 입력했는지 확인합니다.
- **Anonymous sign-ins are disabled**: Authentication에서 익명 로그인 기능을 활성화합니다.
- **Could not find the function / relation**: SQL 전체가 올바른 프로젝트에서 성공적으로 실행됐는지 확인합니다.
- **Realtime 연결 끊김**: 인터넷 연결을 확인하고 새로고침합니다. 앱은 45초마다 서버를 다시 조회합니다.
- iPhone에서 이전 버전이 나타남: 홈 화면에서 앱 종료 후 재실행하고, GitHub Pages 배포 완료 여부를 확인합니다.

**참고:** Supabase 공식 [Anonymous sign-ins](https://supabase.com/docs/guides/auth/auth-anonymous), [Realtime Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes), [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security), [JavaScript CDN](https://supabase.com/docs/reference/javascript/installing).
