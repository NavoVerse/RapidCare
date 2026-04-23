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
            if (error && error.errors) {
                // Return 400 Bad Request with formatted error messages
                const errors = error.errors.map(err => ({
                    field: err.path ? err.path.join('.') : 'unknown',
                    message: err.message
                }));
                
                // Concatenate messages so the frontend can display them directly
                const errorMsg = errors.map(e => e.message).join(', ');
                
                return res.status(400).json({ 
                    error: errorMsg, 
                    details: errors 
                });
            }
            next(error);
        }
    };
};

module.exports = { validate };
