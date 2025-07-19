import { Response } from "express";
import prisma from "../../utility/prisma";
import { ExtendedRequest } from "types/types";

const dailySellingReport = async (req: ExtendedRequest, res: Response) => {
  try {
    const { date } = req.query;
    console.log(date);
    const startDate = new Date(date as string);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date as string);
    endDate.setHours(23, 59, 59, 999);
    const dailySellingReport = await prisma.sellingProduct.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        shopOwnerId: req.shopOwner.id,
      },
    });

    return res.status(200).json({
      success: true,
      data: dailySellingReport,
    });
  } catch (error) {
    console.log({
      error,
    });

    return res.status(500).json({
      success: false,
      errors: [
        {
          type: "server error",
          value: "",
          msg: "Internal server error",
          path: "server",
          location: "dailySellingReport",
        },
      ],
    });
  }
};

export { dailySellingReport };
