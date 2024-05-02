import { Request, Response } from "express";
import prisma from "../../utility/prisma";

const checkOtp = async (req: Request, res: Response) => {
    try {
        const {mobile,otp} = req.body as {mobile: string, otp: string};

        // find shop owner by mobile
        const shopOwner = await prisma.shopOwner.findUnique({
            where: {
                mobile,
            },
        });

        if (!shopOwner) {
            return res.status(404).json({
                success: false,
                errors: [
                    {
                        type: "not found",
                        value: mobile,
                        msg: "User not found",
                        path: "mobile",
                        location: "checkOtp function",
                    },
                ],
            });
        }

        if (shopOwner.otp !== otp) {
            return res.status(400).json({
                success: false,
                errors: [
                    {
                        type: "otp",
                        value: otp,
                        msg: "Invalid OTP",
                        path: "otp",
                        location: "checkOtp function",
                    },
                ],
            });
        }

        return res.json({
            success: true,
            message: "OTP matched",
            
        });

    } catch (error) {
        console.log(error);
    res.status(500).json({
      success: false,
      errors: [
        {
          type: "server error",
          value: "server error",
          msg: "Internal server error",
          path: "server",
          location: "forgetPassword function",
        },
      ],
    });
    }
}


export default checkOtp;