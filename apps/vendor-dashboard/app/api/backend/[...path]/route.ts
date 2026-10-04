import { proxyBackendRequest } from "@repo/api/server";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

type Context = { params: Promise<{ path: string[] }> };
const handle = async (request: NextRequest, context: Context) =>
  proxyBackendRequest(request, (await context.params).path, "vendor");

export { handle as GET, handle as POST, handle as PUT, handle as PATCH, handle as DELETE };
