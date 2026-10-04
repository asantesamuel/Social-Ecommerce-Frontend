import { NextRequest } from "next/server";
import { startDashboardHandoff } from "@repo/api/server";

export const runtime = "nodejs";

export function GET(request: NextRequest) {
  return startDashboardHandoff(request, "admin");
}
