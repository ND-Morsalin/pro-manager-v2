import axios from "axios";
import { Response } from "express";
import { ExtendedRequest } from "../../types/types";
import prisma from "../../utility/prisma"; 
import moment from 'moment';

export const sendMessageToAll = async (req: ExtendedRequest, res: Response) => {
  try {
    const { numbers, message } = req.body as {
      message: string;
      numbers: string[];
    };
    const smsPost = await axios.get(
      `http://bulksmsbd.net/api/smsapi?api_key=3CuemU2YW4dCNqDJulbJ&type=text&number=88${numbers.join(
        ","
      )}&senderid=8809617618303&message=Manager.com ${message}`
    );
    console.log({
      smsPost: smsPost.data,
    });

    return res.status(200).json({
      success: true,
      message: `Message send successfully to all of this numbers ${numbers.join(
        ", "
      )}`,

      smsPost: smsPost.data,
    });
  } catch (error) {
    console.log({ error });
    res.status(500).json({
      success: false,
      errors: [
        {
          type: "server error",
          value: "server error",
          msg: "Internal server error",
          path: "server",
          location: "sendMessageToAll  function",
        },
      ],
    });
  }
};
export const createSMSPackage = async (req: ExtendedRequest, res: Response) => {
  try {
    const { expireDays, packageName, smsAmount, smsPrice } = req.body as {
      packageName: string;
      smsAmount: number;
      smsPrice: number;
      expireDays: number;
    };

    if (!expireDays || !packageName || !smsAmount || !smsPrice) {
      return res.status(403).json({
        success: false,
        errors: [
          {
            type: "expireDays, packageName, smsAmount, smsPrice all field is required",
            msg: " expireDays, packageName, smsAmount, smsPrice all field is required ",
            path: "createSMSPackage",
          },
        ],
      });
    }

    const smsPackage = await prisma.sMSPackages.create({
      data: {
        expireDays,
        packageName,
        smsAmount,
        smsPrice,
      },
    });
    return res.status(200).json({
      success: true,
      data: smsPackage,
    });
  } catch (error) {
    console.error("Error in createProductVoicer:", error);
    return res.status(500).json({
      success: false,
      errors: [
        {
          type: "server error",
          msg: "Internal server error",
          path: "createSMSPackage",
        },
      ],
    });
  }
};

export const getAllSmsPackages = async (
  req: ExtendedRequest,
  res: Response
) => {
  try {
    const smsPackages = await prisma.sMSPackages.findMany();
    return res.status(200).json({
      success: true,
      data: smsPackages,
    });
  } catch (error) {
    console.error("Error in createProductVoicer:", error);
    return res.status(500).json({
      success: false,
      errors: [
        {
          type: "server error",
          msg: "Internal server error",
          path: "createSMSPackage",
        },
      ],
    });
  }
};

export const orderSms = async (req: ExtendedRequest, res: Response) => {
  try {
    const { smsPackageId } = req.body as {
      smsPackageId: string;
    };

    const smsOrder = await prisma.sMSOrder.create({
      data: {
        shopOwnerId: req.shopOwner.id,
        smsPackageId,
      },
    });

    return res.status(200).json({
      success: true,
      data: smsOrder,
    });
  } catch (error) {
    console.error("Error in createProductVoicer:", error);
    return res.status(500).json({
      success: false,
      errors: [
        {
          type: "server error",
          msg: "Internal server error",
          path: "createSMSPackage",
        },
      ],
    });
  }
};

export const getAllUnpaidOrdersSms = async (
  req: ExtendedRequest,
  res: Response
) => {
  try {
    const allSmsOrders = await prisma.sMSOrder.findMany({
      where: { isPaid: false },
    });
    return res.status(200).json({
      success: true,
      data: allSmsOrders,
    });
  } catch (error) {
    console.error("Error in createProductVoicer:", error);
    return res.status(500).json({
      success: false,
      errors: [
        {
          type: "server error",
          msg: "Internal server error",
          path: "createSMSPackage",
        },
      ],
    });
  }
};

export const getAllPaidOrdersSms = async (
  req: ExtendedRequest,
  res: Response
) => {
  try {
    const allSmsOrders = await prisma.sMSOrder.findMany({
      where: { isPaid: true },
    });
    return res.status(200).json({
      success: true,
      data: allSmsOrders,
    });
  } catch (error) {
    console.error("Error in createProductVoicer:", error);
    return res.status(500).json({
      success: false,
      errors: [
        {
          type: "server error",
          msg: "Internal server error",
          path: "createSMSPackage",
        },
      ],
    });
  }
};

export const confirmOrder = async (req: ExtendedRequest, res: Response) => {
  try {
    const smsOrderId = req.params.smsOrderId as string;
    console.log({ smsOrderId: req.params });

    const isPaid = await prisma.sMSOrder.findUnique({
      where: { id: smsOrderId, isPaid: true },
    });

    if (isPaid) {
      return res.status(203).json({
        success: true,
        message: "This order is already paid",
        data: isPaid,
      });
    }

    const smsOrder = await prisma.sMSOrder.findUnique({
      where: { id: smsOrderId },
    });

    if (!smsOrder) {
      return res.status(404).json({
        success: false,
        message: "SMS order not found",
        data: null,
      });
    }

    const smsPackage = await prisma.sMSPackages.findUnique({
      where: { id: smsOrder.smsPackageId },
    });

    if (!smsPackage) {
      return res.status(404).json({
        success: false,
        message: "SMS package not found",
        data: null,
      });
    }

    const paidSmsOrder = await prisma.sMSOrder.update({
      where: {
        id: smsOrderId,
      },
      data: {
        isPaid: true,
      },
    });

    // Calculate new expireDate: max of current expireDate or today + smsPackage.expireDays
    const today = new Date();
    const newExpireDate = new Date(today);
    newExpireDate.setDate(today.getDate() + smsPackage.expireDays);

    const shopOwnerSms = await prisma.shopOwnerSMS.findUnique({
      where: { shopOwnerId: paidSmsOrder.shopOwnerId },
    });
// Assuming shopOwnerSms?.expireDate and today are Date objects or strings parseable by moment
const baseDate = moment.max([
  moment(shopOwnerSms?.expireDate ?? today),
  moment(today),
]);
const finalExpireDate = baseDate.clone().add(smsPackage.expireDays, 'days').toDate();
//     const baseDate = max([shopOwnerSms?.expireDate ?? today, today]);
// const finalExpireDate = addDays(baseDate, smsPackage.expireDays);

    const updatedShopOwnerSms = await prisma.shopOwnerSMS.update({
      where: { shopOwnerId: paidSmsOrder.shopOwnerId },
      data: {
        smsAmount: {
          increment: smsPackage.smsAmount,
        },
        expireDate: finalExpireDate,
        smsPrice: smsPackage.smsPrice,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Order confirmed successfully",
      data: {updatedShopOwnerSms},
    });
  } catch (error) {
    console.error("Error in confirmOrder:", error);
    return res.status(500).json({
      success: false,
      errors: [
        {
          type: "server error",
          msg: "Internal server error",
          path: "confirmOrder",
        },
      ],
    });
  }
};