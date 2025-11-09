import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
export declare const validateBody: (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const validateParams: (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
//# sourceMappingURL=validation.d.ts.map