import { logoutSession } from "@repo/api/server";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const POST = (request: NextRequest) => logoutSession(request);
