import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/apiRoute";
import { getActivityFromBackend } from "@/lib/backendApi";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const logs = await getActivityFromBackend();
    return NextResponse.json(logs, { status: 200 });
  } catch (error) {
    return handleRouteError(error, "Unable to fetch activity logs.");
  }
}
