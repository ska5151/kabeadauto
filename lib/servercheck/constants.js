/** 그리드 행 순서 (폴더 키) */
export const FOLDER_ROWS = [
  "img",
  "dt05",
  "dt55",
  "dt01",
  "dt11",
  "dt02",
  "dt22",
  "dt04",
  "dt44",
  "dt06",
  "dt66",
  "dt07",
  "dt77",
  "dt08",
  "dt88",
];

/** 그리드 열 순서 (통계 키) */
export const STAT_COLUMNS = [
  { key: "memAllMin", label: "전체 Memory Usage 통계 최소값" },
  { key: "memAllMax", label: "전체 Memory Usage 통계 최대값" },
  { key: "memAllAvg", label: "전체 Memory Usage 통계 평균값" },
  { key: "memBizMin", label: "업무 Memory Usage 통계 최소값" },
  { key: "memBizMax", label: "업무 Memory Usage 통계 최대값" },
  { key: "memBizAvg", label: "업무 Memory Usage 통계 평균값" },
  { key: "cpuAllMin", label: "전체 CPU Usage 통계 최소값" },
  { key: "cpuAllMax", label: "전체 CPU Usage 통계 최대값" },
  { key: "cpuAllAvg", label: "전체 CPU Usage 통계 평균값" },
  { key: "cpuBizMin", label: "업무 CPU Usage 통계 최소값" },
  { key: "cpuBizMax", label: "업무 CPU Usage 통계 최대값" },
  { key: "cpuBizAvg", label: "업무 CPU Usage 통계 평균값" },
];

export const DEFAULT_BASE_PATH = "D:\\project\\servercheck";

export const STORAGE_KEY = "servercheck-folder-paths";
export const STORAGE_KEY_BASE_PATH = "servercheck-base-path";
