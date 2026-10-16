import { NextResponse } from "next/server";
import { BackendError } from "@/lib/backendApi";
import type { ErrorResponse } from "@/types/api";

export function errorResponse(message: string, status: number) {
  return NextResponse.json<ErrorResponse>({ error: { message } }, { status });
}

/** Converts any error thrown in a route handler into the shared error shape, keeping backend statuses. */
export function handleRouteError(error: unknown, fallbackMessage: string) {
  if (error instanceof BackendError) {
    return errorResponse(error.message, error.status);
  }

  return errorResponse(fallbackMessage, 500);
}
