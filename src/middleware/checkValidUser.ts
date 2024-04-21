import { Request, Response, NextFunction } from "express"; // Import Express types
import jwt from "jsonwebtoken"; // Import JWT for token verification
import prisma from "../utility/prisma";
import { DecodedToken, ExtendedRequest } from "../types/types";
const checkValidUser = async (
  req: ExtendedRequest,
  res: Response,
  next: NextFunction
) => {
  // Extract token from Authorization header, handling potential errors
  const { token } = req.headers;

  if (!token) {
    return res.status(401).json({
      success: false,
      errors: [
        {
          type: "token error",
          value: "",
          msg: "unauthorized, Token is not found on header",
          path: "header => token: token value ",
          location: "checkValidUser function",
        },
      ],
    });
  }

  
  
  try {
    // Verify JWT token using process.env.JWT_SECRET
    const decoded = jwt.verify(token as string, process.env.JWT_SECRET) as DecodedToken;
    console.log(decoded, "decoded token"); // Log decoded token for debugging

    // find shop owner by id
    const shopOwner = await prisma.shopOwner.findUnique({
        where:{
            id: decoded.id
        },
       
    })

    // If user is not found, return 401 Unauthorized
    if (!shopOwner) {
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
    req.shopOwner = shopOwner;
   
    // console.log(shopOwner, "shop owner data"); // Log user data for debugging


    next();
  } catch (error) {
    console.error(error, "Error validating user"); // Log error for debugging
    return res
      .status(401)
      .json({ errors: [{ message: "Unauthorized, error validating user" }] });
  }
};

export default checkValidUser;
