export const GOOGLE_DRIVE_SCOPE =
  "https://www.googleapis.com/auth/drive.readonly";

export const GOOGLE_OAUTH_SCOPES = [
  "openid",
  "email",
  "profile",
  GOOGLE_DRIVE_SCOPE,
].join(" ");

export function hasDriveScope(scope) {
  if (!scope) return false;
  return (
    scope.includes("drive.readonly") ||
    scope.includes("drive ") ||
    scope.endsWith("/drive")
  );
}
