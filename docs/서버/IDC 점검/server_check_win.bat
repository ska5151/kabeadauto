@echo off
chcp 65001 >nul
:: =========================================================
:: Windows 시스템 리소스(CPU, 메모리) 모니터링 스크립트
:: =========================================================

:: 1. 관리자 권한 확인 및 자동 획득 (UAC 프롬프트 호출)
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [안내] 관리자 권한이 필요하여 권한 상승을 요청합니다...
    powershell -Command "Start-Process '%~dpnx0' -Verb RunAs"
    exit /b
)

:: 2. 저장할 폴더 설정 (원하는 경로로 변경 가능)
set LOG_DIR=D:\servercheck
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

:: 3. PowerShell을 이용하여 통계 추출 및 JSON 형식으로 저장 (작업 관리자 동일 방식 적용)
:: 매분 실행되어 그 날짜(YYYY-MM-DD)에 해당하는 JSONL (Line-delimited JSON) 파일에 계속 추가됩니다.

:: win 8 이상
powershell -NoProfile -ExecutionPolicy Bypass -Command "$null = Get-WmiObject Win32_PerfFormattedData_Counters_ProcessorInformation | Where-Object { $_.Name -eq '_Total' }; Start-Sleep -Seconds 1; $cpu = (Get-WmiObject Win32_PerfFormattedData_Counters_ProcessorInformation | Where-Object { $_.Name -eq '_Total' }).PercentProcessorUtility; if ($null -eq $cpu) { $cpu = (Get-WmiObject Win32_Processor | Measure-Object -Property LoadPercentage -Average).Average }; if ([int]$cpu -gt 100) { $cpu = 100 }; $os = Get-WmiObject Win32_OperatingSystem; $mem = [math]::Round((($os.TotalVisibleMemorySize - $os.FreePhysicalMemory) / $os.TotalVisibleMemorySize) * 100, 2); $date = Get-Date; $timestamp = $date.ToString('yyyy-MM-dd HH:mm:ss'); $fileName = $date.ToString('yyyy-MM-dd') + '_system_log.json'; $logPath = Join-Path '%LOG_DIR%' $fileName; $data = [ordered]@{ memory_usage = $mem; cpu_usage = $cpu; timestamp = $timestamp }; $json = $data | ConvertTo-Json -Compress; Add-Content -Path $logPath -Value $json"
:: win 7
:: powershell -NoProfile -ExecutionPolicy Bypass -Command "$cpu = (Get-WmiObject Win32_Processor | Measure-Object -Property LoadPercentage -Average).Average; if ($null -eq $cpu) { $cpu = 0 } else { if ([int]$cpu -gt 100) { $cpu = 100 } }; $os = Get-WmiObject Win32_OperatingSystem; $mem = [math]::Round((([double]$os.TotalVisibleMemorySize - [double]$os.FreePhysicalMemory) / [double]$os.TotalVisibleMemorySize) * 100, 2); $date = Get-Date; $timestamp = $date.ToString('yyyy-MM-dd HH:mm:ss'); $fileName = $date.ToString('yyyy-MM-dd') + '_system_log.json'; $logPath = Join-Path '%LOG_DIR%' $fileName; $json = '{\"memory_usage\":' + $mem + ',\"cpu_usage\":' + [int]$cpu + ',\"timestamp\":\"' + $timestamp + '\"}'; Add-Content -Path $logPath -Value $json"

exit /b 0