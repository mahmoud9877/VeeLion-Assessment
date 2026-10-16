import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/apiRoute";
import { getTasksSummaryFromBackend } from "@/lib/backendApi";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const summary = await getTasksSummaryFromBackend();
    return NextResponse.json(summary, { status: 200 });
  } catch (error) {
    return handleRouteError(error, "Unable to fetch the tasks summary.");
  }
}
