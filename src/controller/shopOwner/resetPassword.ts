import bcryptjs from "bcryptjs";
import { Request, Response } from "express";
import prisma from "../../utility/prisma";

const resetPassword = async (req: Request, res: Response) => {
  try {
    const { mobile, pincode, otp } = req.body as {
      mobile: string;
      pincode: string;
      otp: string;
    };

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
            location: "resetPassword function",
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
            location: "resetPassword function",
          },
        ],
      });
    }

    // hash pin
    const salt = await bcryptjs.genSalt(10);

    const hashPin = await bcryptjs.hash(pincode, salt);

    const updatedShopOwner = await prisma.shopOwner.update({
      where: {
        id: shopOwner.id,
      },
      data: {
        pincode: hashPin,
        otp: null,
      },
    });

    return res.json({
      success: true,
      message: "Password reset successfully",
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
};

export default resetPassword;
