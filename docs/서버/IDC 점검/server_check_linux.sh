#!/bin/bash

# =========================================================
# Linux 시스템 리소스(CPU, 메모리) 모니터링 스크립트
# =========================================================

# 1. 관리자(root) 권한 확인 및 자동 획득 (sudo 프롬프트 호출)
if [ "$EUID" -ne 0 ]; then
    echo "[안내] 관리자 권한이 필요하여 sudo를 통해 권한 상승을 요청합니다..."
    exec sudo "$0" "$@"
    exit $?
fi

# 2. 저장할 폴더 설정 (원하는 경로로 변경 가능)
LOG_DIR="/root/servercheck"
mkdir -p "$LOG_DIR"

DATE=$(date +'%Y-%m-%d')
LOG_FILE="$LOG_DIR/${DATE}_system_log.json"
TIMESTAMP=$(date +'%Y-%m-%d %H:%M:%S')

# 3. CPU 사용량 계산 (1초 대기하며 /proc/stat의 변화량 측정으로 정확도 향상)
read cpu user nice system idle iowait irq softirq steal guest guest_nice < /proc/stat
PREV_TOTAL=$((user+nice+system+idle+iowait+irq+softirq+steal))
PREV_IDLE=$((idle+iowait))

sleep 1

read cpu user nice system idle iowait irq softirq steal guest guest_nice < /proc/stat
TOTAL=$((user+nice+system+idle+iowait+irq+softirq+steal))
IDLE=$((idle+iowait))

CPU_USAGE=$(awk "BEGIN {printf \"%.2f\", 100 * (($TOTAL-$PREV_TOTAL) - ($IDLE-$PREV_IDLE)) / ($TOTAL-$PREV_TOTAL)}")

# 4. 메모리 사용량 계산 (환경/언어 설정 무관하게 /proc/meminfo 직접 파싱)
MEM_TOTAL=$(awk '/^MemTotal:/ {print $2}' /proc/meminfo)
MEM_AVAILABLE=$(awk '/^MemAvailable:/ {print $2}' /proc/meminfo)

# MemAvailable 필드가 없는 구형 시스템 대응 (MemFree + Buffers + Cached)
if [ -z "$MEM_AVAILABLE" ]; then
    MEM_FREE=$(awk '/^MemFree:/ {print $2}' /proc/meminfo)
    MEM_BUFFERS=$(awk '/^Buffers:/ {print $2}' /proc/meminfo)
    MEM_CACHED=$(awk '/^Cached:/ {print $2}' /proc/meminfo)
    MEM_AVAILABLE=$((MEM_FREE + MEM_BUFFERS + MEM_CACHED))
fi

# (전체 메모리 - 사용 가능한 메모리) / 전체 메모리 * 100
MEM_USAGE=$(awk "BEGIN {printf \"%.2f\", (($MEM_TOTAL - $MEM_AVAILABLE) / $MEM_TOTAL) * 100.0}")

# 5. JSON 형태 구성
JSON_DATA="{\"memory_usage\": $MEM_USAGE, \"cpu_usage\": $CPU_USAGE, \"timestamp\": \"$TIMESTAMP\"}"

# 6. 파일에 추가 (일 단위 파일에 한 줄씩 기록)
echo "$JSON_DATA" >> "$LOG_FILE"