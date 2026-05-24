import { auth } from "@/lib/auth";
import { getServerAccessToken, isServerAuthEnabled } from "@/lib/serverAuth";

export async function resolveAccessToken() {
  if (isServerAuthEnabled()) {
    return getServerAccessToken();
  }

  const session = await auth();
  return session?.accessToken || null;
}
