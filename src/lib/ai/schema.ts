import { z } from "zod";

export const compareResultSchema = z.object({
  imageMeta: z.object({
    originalWidth: z.number().positive(),
    originalHeight: z.number().positive(),
    modelInputWidth: z.number().positive(),
    modelInputHeight: z.number().positive(),
    coordinateType: z.enum(["pixel", "normalized"])
  }),
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
        width: z.number().nonnegative(),
        height: z.number().nonnegative()
      }),
      raw_bbox: z.object({
        x: z.number().nonnegative(),
        y: z.number().nonnegative(),
        width: z.number().positive(),
        height: z.number().positive()
      }).optional(),
      annotation_text: z.string().min(1)
    })
  )
});

export const modelCompareResultSchema = z.object({
  total_issues: z.number().int().nonnegative(),
  issues: z.array(
    z.object({
      id: z.string().min(1),
      type: z.string().min(1),
      severity: z.string().min(1),
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
