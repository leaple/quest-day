# QUEST DAY — 캐릭터 24종 일괄 적용

실제 도감 캐릭터 24종 × 진화 3단계 × 대기 애니메이션 6프레임 = 투명 PNG **432장**을 앱에 적용하는 방식입니다.

1. ChatGPT에서 제공된 **quest-day-all-24-sprites.zip** (약 20.6MB)을 내려받습니다.
2. GitHub에서 **leaple/quest-day** 저장소 → **main** 브랜치 → **Add file → Upload files**를 누릅니다.
3. 압축을 풀지 말고 ZIP **1개만 루트에 업로드**하고 커밋합니다. 파일명은 반드시 **quest-day-all-24-sprites.zip**이어야 합니다.
4. **Actions → Import QUEST DAY character sprites** 작업이 자동 실행됩니다. 완료되면 \`art/pixel/<character-id>/stage1~3/idle-0~5.png\`에 총 432장이 커밋되고, 가져오기 ZIP은 저장소에서 자동 제거됩니다.
5. **Actions → QUEST DAY - TestFlight upload → Run workflow → main**을 실행합니다. 기존 iOS 빌드 과정이 새 아트 파일을 자동으로 포함합니다.
6. TestFlight 새 빌드로 업데이트해서 도감과 진화, 캐릭터 상세 화면의 애니메이션을 점검합니다.

GitHub Pages의 웹앱도 메인 브랜치에서 제공하는 이미지로 자동 전환됩니다. 다만 배포와 브라우저 캐시 반영에는 차이가 있을 수 있어 앱을 다시 열어 확인하세요.

기존 캐릭터 데이터, 계정 및 진화 조건은 변경하지 않습니다. 이미지가 없거나 요청에 실패하면 기존 일러스트 기반 대체 렌더링을 유지합니다.

**주의:** 이 묶음은 원본 PNG 색상을 256색 인덱스 PNG로 최적화한 배포용 파일입니다. 각 캐릭터의 원화 세부 품질 및 수동 테두리 보정까지 모두 검수 완료되었다는 뜻은 아닙니다. 현재 ZIP 파일은 GitHub에 자동으로 보내지지 않으므로 위 1회 업로드가 필요합니다.
