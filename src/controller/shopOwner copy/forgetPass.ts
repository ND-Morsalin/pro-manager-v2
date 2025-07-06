import axios from "axios";
import { Request, Response } from "express";
import generateRandomCode from "../../utility/generateRandomCode";
import prisma from "../../utility/prisma";

const forgetPassword = async (req: Request, res: Response) => {
  try {
    const { mobile } = req.body as { mobile: string };
    console.log("forgetPassword", req.body);
    // at first check if the user exists in the database
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
            location: "forgetPassword function",
          },
        ],
      });
    }

    const otp = generateRandomCode();

    // at first check if the user exists

    const smsPost = await axios.get(
      `http://bulksmsbd.net/api/smsapi?api_key=3CuemU2YW4dCNqDJulbJ&type=text&number=88${mobile}&senderid=8809617618303&message=Your Manager.com OTP is ${otp} for password reset. Do not share this with anyone. Thank you.`
    );

    

    const updateShopOwner = await prisma.shopOwner.update({
      where: {
        mobile,
      },
      data: {
        otp,
      },
    });

    console.log({ smsPost, updateShopOwner });

    res.status(200).json({
      success: true,
      message: "SMS sent successfully",
      smsPost: smsPost.data,
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

export default forgetPassword;
