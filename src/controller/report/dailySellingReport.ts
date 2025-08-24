import { Response } from "express";
import prisma from "../../utility/prisma";
import { ExtendedRequest } from "types/types";
import { parseDateRange } from "../../utility/parseDateRange";
import { getPagination } from "../../utility/getPaginatin";

const dailySellingReport = async (req: ExtendedRequest, res: Response) => {
  try {
      const {page, limit, skip} = getPagination(req);
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
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    const count = await prisma.sellingProduct.count({
      where: {
        createdAt: {
          gte:  start,
          lte:  end,
        },
        shopOwnerId: req.shopOwner.id,
      },
    });

    return res.status(200).json({
      meta: {
        page,
        limit,
        count,
      },
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
