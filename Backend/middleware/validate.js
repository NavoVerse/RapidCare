const { z } = require('zod');

/**
 * Middleware to validate request body against a Zod schema
 * @param {z.ZodSchema} schema 
 */
const validate = (schema) => {
    return (req, res, next) => {
        try {
            // Parse and replace req.body with the validated (and potentially casted/stripped) data
            req.body = schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                // Return 400 Bad Request with formatted error messages
                const errors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }));
                return res.status(400).json({ 
                    error: 'Validation failed', 
                    details: errors 
                });
            }
            next(error);
        }
    };
};

module.exports = { validate };
