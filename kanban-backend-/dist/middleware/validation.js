"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateParams = exports.validateBody = void 0;
const zod_1 = require("zod");
const validateBody = (schema) => {
    return (req, res, next) => {
        try {
            schema.parse(req.body);
            return next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: error.issues
                });
            }
            return next(error);
        }
    };
};
exports.validateBody = validateBody;
const validateParams = (schema) => {
    return (req, res, next) => {
        try {
            schema.parse(req.params);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    error: 'Invalid parameters',
                    details: error.issues
                });
            }
            return next(error);
        }
    };
};
exports.validateParams = validateParams;
//# sourceMappingURL=validation.js.map