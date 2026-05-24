const IN_APP_UA_PATTERNS = [
  /KAKAOTALK/i,
  /Line\//i,
  /FBAN|FBAV/i,
  /Instagram/i,
  /Twitter/i,
  /NAVER\(inapp/i,
  /; wv\)/,
  /Snapchat/i,
  /LinkedInApp/i,
];

export function isInAppBrowser(userAgent) {
  const ua =
    userAgent ||
    (typeof navigator !== "undefined" ? navigator.userAgent : "");

  if (!ua) return false;

  if (IN_APP_UA_PATTERNS.some((pattern) => pattern.test(ua))) {
    return true;
  }

  return /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(ua);
}

export function getInAppBrowserName(userAgent) {
  const ua =
    userAgent ||
    (typeof navigator !== "undefined" ? navigator.userAgent : "");

  if (/KAKAOTALK/i.test(ua)) return "카카오톡";
  if (/Line\//i.test(ua)) return "LINE";
  if (/FBAN|FBAV/i.test(ua)) return "Facebook";
  if (/Instagram/i.test(ua)) return "Instagram";
  if (/NAVER\(inapp/i.test(ua)) return "네이버";
  return "앱 내 브라우저";
}
