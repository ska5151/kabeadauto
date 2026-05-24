import { isServerAuthEnabled } from "@/lib/serverAuth";

export async function GET() {
  return Response.json({
    serverAuth: isServerAuthEnabled(),
  });
}
