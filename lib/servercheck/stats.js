const BUSINESS_START = 8 * 60;
const BUSINESS_END = 19 * 60;

function parseTimeOfDayMinutes(timestamp) {
  const match = timestamp.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

function isBusinessHours(timestamp) {
  if (!timestamp) return false;
  const minutes = parseTimeOfDayMinutes(timestamp);
  if (minutes === null) return false;
  return minutes >= BUSINESS_START && minutes <= BUSINESS_END;
}

function minMaxAvg(values) {
  if (values.length === 0) return { min: null, max: null, avg: null };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg =
    Math.round(
      (values.reduce((sum, v) => sum + v, 0) / values.length) * 100,
    ) / 100;
  return { min, max, avg };
}

export function parseJsonLine(line) {
  const trimmed = line.trim();
  if (!trimmed.includes("{")) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

export function computeStatsFromContent(content) {
  const memAll = [];
  const memBiz = [];
  const cpuAll = [];
  const cpuBiz = [];

  for (const line of content.split(/\r?\n/)) {
    const obj = parseJsonLine(line);
    if (!obj) continue;

    const biz = isBusinessHours(obj.timestamp);

    if (obj.memory_usage != null && !Number.isNaN(Number(obj.memory_usage))) {
      const v = Number(obj.memory_usage);
      memAll.push(v);
      if (biz) memBiz.push(v);
    }
    if (obj.cpu_usage != null && !Number.isNaN(Number(obj.cpu_usage))) {
      const v = Number(obj.cpu_usage);
      cpuAll.push(v);
      if (biz) cpuBiz.push(v);
    }
  }

  const memAllStats = minMaxAvg(memAll);
  const memBizStats = minMaxAvg(memBiz);
  const cpuAllStats = minMaxAvg(cpuAll);
  const cpuBizStats = minMaxAvg(cpuBiz);

  return {
    memAllMin: memAllStats.min,
    memAllMax: memAllStats.max,
    memAllAvg: memAllStats.avg,
    memBizMin: memBizStats.min,
    memBizMax: memBizStats.max,
    memBizAvg: memBizStats.avg,
    cpuAllMin: cpuAllStats.min,
    cpuAllMax: cpuAllStats.max,
    cpuAllAvg: cpuAllStats.avg,
    cpuBizMin: cpuBizStats.min,
    cpuBizMax: cpuBizStats.max,
    cpuBizAvg: cpuBizStats.avg,
  };
}

export function emptyRowStats() {
  return {
    memAllMin: null,
    memAllMax: null,
    memAllAvg: null,
    memBizMin: null,
    memBizMax: null,
    memBizAvg: null,
    cpuAllMin: null,
    cpuAllMax: null,
    cpuAllAvg: null,
    cpuBizMin: null,
    cpuBizMax: null,
    cpuBizAvg: null,
  };
}

export function formatStatValue(value) {
  if (value === null || value === undefined) return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return "-";
  return `${num.toFixed(2)}%`;
}
