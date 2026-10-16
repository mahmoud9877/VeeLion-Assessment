import { NextResponse } from "next/server";
import { errorResponse, handleRouteError } from "@/lib/apiRoute";
import { deleteTaskInBackend, updateTaskInBackend } from "@/lib/backendApi";

export const dynamic = "force-dynamic";

type RouteParams = {
  params: {
    id: string;
  };
};

export async function PATCH(request: Request, { params }: RouteParams) {
  let payload: { completed?: unknown };

  try {
    payload = await request.json();
  } catch {
    return errorResponse("Request body must be valid JSON.", 400);
  }

  if (typeof payload?.completed !== "boolean") {
    return errorResponse("completed must be boolean", 400);
  }

  try {
    const task = await updateTaskInBackend(params.id, payload.completed);
    return NextResponse.json({ data: task }, { status: 200 });
  } catch (error) {
    return handleRouteError(error, "Unable to update task.");
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    await deleteTaskInBackend(params.id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleRouteError(error, "Unable to delete task.");
  }
}
