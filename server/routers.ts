import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { nanoid } from "nanoid";
import { storagePut } from "./storage";
import { evaluateCompliance } from "./services/ruleEngine";
import { extractPackageLabel } from "./services/ocrService";
import { inspectionRepository } from "./services/inspectionRepository";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  inspection: router({
    list: publicProcedure.input(z.object({
      query: z.string().optional(),
      status: z.enum(["ALL", "COMPLIANT", "PARTIAL_VIOLATION", "NON_COMPLIANT"]).optional(),
      from: z.string().optional(),
      to: z.string().optional(),
    }).optional()).query(({ input }) => inspectionRepository.list(input)),
    get: publicProcedure.input(z.object({ id: z.string().min(1) })).query(({ input }) => inspectionRepository.get(input.id)),
    metrics: publicProcedure.query(() => inspectionRepository.metrics()),
    analyze: publicProcedure.input(z.object({
      images: z.array(z.object({
        name: z.string().min(1).max(180),
        contentType: z.enum(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]),
        data: z.string().min(10),
      })).min(1).max(6),
      inspectorNotes: z.string().max(4000).optional(),
    })).mutation(async ({ input }) => {
      const extractedData = await extractPackageLabel(input.images);
      const evaluation = evaluateCompliance(extractedData);
      const id = `scan-${nanoid(10)}`;
      const evidence = await Promise.all(input.images.map(async (image, index) => {
        const extension = image.contentType.split("/")[1]?.replace("jpeg", "jpg") ?? "img";
        const { key, url } = await storagePut(`inspections/${id}/evidence-${index + 1}.${extension}`, Buffer.from(image.data, "base64"), image.contentType);
        return { id: `evidence-${index + 1}`, name: image.name, key, url, contentType: image.contentType };
      }));
      const record = {
        id,
        brand: extractedData.manufacturer_name ?? extractedData.generic_name ?? "Unidentified package",
        status: evaluation.status,
        complianceScore: evaluation.complianceScore,
        inspectorNotes: input.inspectorNotes ?? "",
        extractedData,
        evaluation,
        evidence,
        regionFlags: [],
        createdAt: new Date().toISOString(),
      };
      return inspectionRepository.save(record);
    }),
    updateNotes: publicProcedure.input(z.object({
      id: z.string().min(1),
      inspectorNotes: z.string().max(4000),
      regionFlags: z.array(z.object({ id: z.string(), label: z.string(), note: z.string(), x: z.number(), y: z.number(), width: z.number(), height: z.number() })),
    })).mutation(({ input }) => inspectionRepository.updateNotesAndFlags(input.id, input.inspectorNotes, input.regionFlags)),
    saveReport: publicProcedure.input(z.object({
      id: z.string().min(1),
      filename: z.string().min(1).max(200),
      data: z.string().min(10),
    })).mutation(async ({ input }) => {
      const { key, url } = await storagePut(`inspections/${input.id}/reports/${input.filename}`, Buffer.from(input.data, "base64"), "application/pdf");
      return inspectionRepository.attachReport(input.id, key, url);
    }),
  }),
});

export type AppRouter = typeof appRouter;
