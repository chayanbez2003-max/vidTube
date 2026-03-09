import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Role-based access control middleware.
 * Usage: authorizeRoles("admin", "creator")
 * Must be used AFTER verifyJWT middleware.
 */
const authorizeRoles = (...roles) => {
    return asyncHandler(async (req, _, next) => {
        if (!req.user) {
            throw new ApiError(401, "Authentication required");
        }

        if (!roles.includes(req.user.role || 'user')) {
            throw new ApiError(
                403, 
                `Role '${req.user.role || 'user'}' is not authorized to access this resource`
            );
        }

        next();
    });
};

export { authorizeRoles };
