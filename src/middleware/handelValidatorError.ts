import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";

// Error handling middleware for express-validator errors
const handleValidationErrors = (req:Request, res:Response, next:NextFunction) => {
    // console.log(req);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors)
        const formattedErrors = errors.array();
        return res.status(400).json({ errors: formattedErrors });
    }
    next();
};

export default handleValidationErrors;