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
            // Check for Zod error structure safely
            if (error instanceof z.ZodError) {
                // Return 400 Bad Request with formatted error messages
                const issues = error.issues || error.errors || [];
                const formattedErrors = issues.map(err => ({
                    field: err.path ? err.path.join('.') : 'unknown',
                    message: err.message
                }));
                
                // Concatenate messages so the frontend can display them directly
                const errorMsg = formattedErrors.map(e => e.message).join(', ');
                
                return res.status(400).json({ 
                    error: errorMsg, 
                    details: formattedErrors 
                });
            }
            next(error);
        }
    };
};

module.exports = { validate };
