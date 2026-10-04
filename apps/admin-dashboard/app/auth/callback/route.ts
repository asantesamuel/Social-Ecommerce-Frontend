import { NextRequest } from "next/server";
import { completeDashboardHandoff } from "@repo/api/server";

export const runtime = "nodejs";

export function GET(request: NextRequest) {
  return completeDashboardHandoff(request, "admin");
}
