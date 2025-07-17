import { NextFunction, Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import jwt from "jsonwebtoken"; // Import JWT for token verification
import ApiError from "./error";
import { RoleTypes } from "../controller/admin/admin.types";
import { DecodedToken } from "../types/types";
import prisma from "../utility/prisma";
import BaseController from "../shared/baseController";

// Define a custom type for extending the Request object
type CustomRequest = Request & {
  admin: {
    id: string;
    name: string;
    mobile: string;
    role: RoleTypes;
  };
};

// Define a custom type for extending the JWT Payload object
type CustomJWTPayload = JwtPayload & {
  id?: string;
  phone_number?: string;
  role?: string;
};

const verifyToken =
  (allowedRoles?: RoleTypes[]) =>
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { token } = req.headers;
    // Verify JWT token using process.env.JWT_SECRET
console.log(token)
    if(!token){
      return new BaseController().sendError(res,'token is messing',401)
      
    }
    
    const decoded = jwt.verify(
      token as string,
      process.env.JWT_SECRET
    ) as DecodedToken;
    // console.log(decoded, "decoded token"); // Log decoded token for debugging

    // find shop owner by id
    const admin = await prisma.admin.findUnique({
      where: {
        id: decoded.id,
      },
    });

    // If user is not found, return 401 Unauthorized
    if (!admin) {
      return res.status(401).json({
        success: false,
        errors: [
          {
            type: "token error",
            value: "",
            msg: "unauthorized, User not found",
            path: "user",
            location: "checkValidUser function",
          },
        ],
      });
    }

    // Attach user to request object
    req.admin = admin;

    // console.log(shopOwner, "shop owner data"); // Log user data for debugging

    // If allowedRoles is provided and non-empty, check if role is permitted
    if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
      if (!allowedRoles.includes(admin.role as RoleTypes)) {
        throw new ApiError(403, "Forbidden: Access denied");
      }
    }

    next();
  };

export default verifyToken;
