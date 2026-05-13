import { NextResponse } from "next/server";
import { z } from "zod";
import { compareUIDesign } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

const requestSchema = z.object({
  designImage: z.string().startsWith("data:image/"),
  implementationImage: z.string().startsWith("data:image/")
});

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const result = await compareUIDesign(body);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown comparison error";
    const status = message.includes("API key") ? 401 : 500;

    return NextResponse.json(
      {
        error: message
      },
      { status }
    );
  }
}
