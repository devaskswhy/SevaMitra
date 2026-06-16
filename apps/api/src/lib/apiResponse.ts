import { Response } from "express";
import { Prisma } from "@prisma/client";

// ─── Typed API Response Wrapper ─────────────────────────────

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ─── Response Helpers ───────────────────────────────────────

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  const response: ApiSuccessResponse<T> = { success: true, data };
  res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 500,
  details?: string
): void {
  const response: ApiErrorResponse = { success: false, error: message };
  if (details && process.env.NODE_ENV !== "production") {
    response.details = details;
  }
  res.status(statusCode).json(response);
}

// ─── Prisma Error Handling ──────────────────────────────────

interface PrismaErrorResult {
  status: number;
  message: string;
}

export function handlePrismaError(error: unknown): PrismaErrorResult {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002": {
        const target = (error.meta?.target as string[])?.join(", ") ?? "field";
        return { status: 409, message: `Unique constraint violation on: ${target}` };
      }
      case "P2003": {
        const field = (error.meta?.field_name as string) ?? "field";
        return { status: 400, message: `Foreign key constraint failed on: ${field}` };
      }
      case "P2025":
        return { status: 404, message: "Record not found" };
      case "P2014":
        return { status: 400, message: "Required relation violation" };
      case "P2016":
        return { status: 400, message: "Query interpretation error" };
      default:
        return { status: 400, message: `Database error: ${error.code}` };
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return { status: 400, message: "Invalid data provided" };
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return { status: 503, message: "Database connection failed" };
  }

  if (error instanceof Error) {
    return { status: 500, message: error.message };
  }

  return { status: 500, message: "An unexpected error occurred" };
}

/**
 * Convenience: catch any error, determine if it's Prisma-specific, and send
 * the appropriate HTTP response.
 */
export function sendPrismaError(res: Response, error: unknown): void {
  const { status, message } = handlePrismaError(error);
  const details = error instanceof Error ? error.message : undefined;
  sendError(res, message, status, details);
}
