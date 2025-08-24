import { Response } from "express";
import prisma from "../../utility/prisma";
import { ExtendedRequest } from "types/types";
import { parseDateRange } from "../../utility/parseDateRange";

const dailySellingReport = async (req: ExtendedRequest, res: Response) => {
  try {
    const { date } = req.query;
    console.log(date);
    const { start, end } = parseDateRange(date as string || (new Date().toISOString().split('T')[0]));
    const dailySellingReport = await prisma.sellingProduct.findMany({
      where: {
        createdAt: {
          gte:  start,
          lte:  end,
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
