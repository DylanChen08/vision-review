import { NextResponse } from "next/server";
import { z } from "zod";
import { compareUIDesign } from "@/lib/ai";
import { getImageDimensionsFromDataUrl } from "@/lib/image";

export const runtime = "nodejs";
export const maxDuration = 60;

const requestSchema = z.object({
  designImage: z.string().startsWith("data:image/"),
  implementationImage: z.string().startsWith("data:image/")
});

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const implementationSize = getImageDimensionsFromDataUrl(body.implementationImage);
    const result = await compareUIDesign({
      ...body,
      imageMeta: {
        originalWidth: implementationSize.width,
        originalHeight: implementationSize.height,
        modelInputWidth: implementationSize.width,
        modelInputHeight: implementationSize.height,
        coordinateType: "normalized"
      }
    });

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
