# QUEST DAY 캐릭터 진화 일러스트 · v34

**12명 × 3단계 = 총 36개 SVG 렌더링 경로**를 유지합니다. 캐릭터 ID와 진화 조건, 기존 구매 및 저장 데이터는 변경하지 않았습니다.

## 현재 신규 원화 적용: 19/36

- `sprout`: 진화 1·2·3
- `paper_messenger`: 진화 1·2·3
- `dawn_runner`: 진화 1·2·3
- `knight`: 진화 1·2·3 (동일 캐릭터로 단계별 개별 원화)
- `mage`: 진화 1·2·3
- `dream_whale`: 진화 1·2·3
- `time_guardian`: 진화 1

**나머지 17개**는 아직 v33의 기존 그림과 SVG 효과 합성 버전입니다. 새로운 의상/실루엣으로 다시 그린 최종 원화로 표시하지 않습니다.

## 파일·호환성

- 파일 경로: `art/evolution/{character_id}-stage{1|2|3}.svg`
- 신규 원화 파일은 각 단계별로 독립 제작한 비트맵을 SVG에 내장해, 외부 이미지 파일 없이도 브라우저에서 렌더링합니다.
- 전체 진화 36개를 동시에 비교하려면 `art/evolution/preview.html`을 엽니다.
- 잘림 방지: 기존 SVG 일부의 캔버스보다 좁은 `clipPath`를 전체 캔버스로 확장했습니다. 신규 원화에는 별도의 투명 여백이 있습니다.
- 전환 규칙은 기존 `upgrade-1.3.js`의 `evolutionStage(character)`를 그대로 사용합니다.
- 기존 전용 `astronaut`는 12종 진화 카탈로그에 포함되지 않습니다.

## 원화 완성 상태

| 캐릭터 | 1단계 | 2단계 | 3단계 |
| --- | --- | --- | --- |
| sprout | 신규 | 신규 | 신규 |
| paper_messenger | 신규 | 신규 | 신규 |
| dawn_runner | 신규 | 신규 | 신규 |
| sunset_scribe | 기존 | 기존 | 기존 |
| forest | 기존 | 기존 | 기존 |
| clockkeeper | 기존 | 기존 | 기존 |
| star_scribe | 기존 | 기존 | 기존 |
| ninja | 기존 | 기존 | 기존 |
| mage | 신규 | 신규 | 신규 |
| knight | 신규 | 신규 | 신규 |
| dream_whale | 신규 | 신규 | 신규 |
| time_guardian | 신규 | 기존 | 기존 |
