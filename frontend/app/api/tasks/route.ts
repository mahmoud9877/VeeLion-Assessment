import { NextResponse } from "next/server";
import { errorResponse, handleRouteError } from "@/lib/apiRoute";
import { createTaskInBackend, getTasksFromBackend } from "@/lib/backendApi";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tasks = await getTasksFromBackend();
    return NextResponse.json({ data: tasks }, { status: 200 });
  } catch (error) {
    return handleRouteError(error, "Unable to fetch tasks.");
  }
}

export async function POST(request: Request) {
  let payload: { title?: unknown };

  try {
    payload = await request.json();
  } catch {
    return errorResponse("Request body must be valid JSON.", 400);
  }

  if (typeof payload?.title !== "string" || !payload.title.trim()) {
    return errorResponse("title is required", 400);
  }

  try {
    const task = await createTaskInBackend(payload.title.trim());
    return NextResponse.json({ data: task }, { status: 201 });
  } catch (error) {
    return handleRouteError(error, "Unable to create task.");
  }
}
