import { z } from "zod";

export const compareResultSchema = z.object({
  total_issues: z.number().int().nonnegative(),
  issues: z.array(
    z.object({
      id: z.string().min(1),
      type: z.string().min(1),
      severity: z.enum(["严重", "中等", "轻微"]),
      element: z.string().min(1),
      design_value: z.string().min(1),
      implementation_value: z.string().min(1),
      bbox: z.object({
        x: z.number().nonnegative(),
        y: z.number().nonnegative(),
        width: z.number().positive(),
        height: z.number().positive()
      }),
      annotation_text: z.string().min(1)
    })
  )
});
