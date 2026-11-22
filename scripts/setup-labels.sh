#!/usr/bin/env bash
# Dodam 이슈 라벨 생성 (gh 로그인 필요). 저장소 루트에서: bash scripts/setup-labels.sh
set -e
mk() { gh label create "$1" --color "$2" --description "$3" --force; }

mk "type: feature"     "1d76db" "새 기능 요청"
mk "type: bug"         "d73a4a" "의도하지 않은 동작 또는 오류"
mk "type: refactor"    "a2eeef" "동작 변경 없는 구조 개선"
mk "type: docs"        "0075ca" "문서 작업"
mk "type: chore"       "cfd3d7" "빌드, 설정, 패키지 관리"
mk "type: enhancement" "84b6eb" "기존 기능 개선"
mk "type: test"        "bfd4f2" "테스트 추가 및 수정"
mk "type: hotfix"      "b60205" "긴급 수정"

mk "priority: critical" "b60205" "즉시 대응"
mk "priority: high"     "d93f0b" "중요한 기능 또는 주요 버그"
mk "priority: medium"   "fbca04" "일반 일정"
mk "priority: low"      "0e8a16" "여유 있을 때"

mk "size: XS" "ededed" "4시간 미만"
mk "size: S"  "c5def5" "1~2일"
mk "size: M"  "bfdadc" "3~5일"
mk "size: L"  "fef2c0" "1~2주"
mk "size: XL" "f9d0c4" "2주 초과, 분리 검토"

mk "init: project"   "5319e7" "초기 프로젝트 세팅"
mk "init: structure" "5319e7" "초기 구조 세팅"
mk "init: docs"      "5319e7" "초기 문서 세팅"
echo "라벨 생성 완료"
