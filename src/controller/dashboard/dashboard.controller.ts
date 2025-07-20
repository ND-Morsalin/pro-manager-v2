import { Response } from "express";
import { ExtendedRequest } from "../../types/types";
import prisma from "../../utility/prisma";
import { getOrCreateDashboard } from "../../utility/getOrCreateDashboard";

export async function getDashboardData(req: ExtendedRequest, res: Response) {
  try {
    const { year, month, date } = req.query;
    const shopOwnerId = req.shopOwner.id;

    const where: any = { shopOwnerId };

    if (date) {
      const parsedDate = new Date(date as string);
      if (!isNaN(parsedDate.getTime())) {
        const startOfDay = new Date(parsedDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(parsedDate);
        endOfDay.setHours(23, 59, 59, 999);

        where.date = {
          gte: startOfDay,
          lte: endOfDay,
        };
      } else {
        return res.status(400).json({
          success: false,
          errors: [
            {
              type: "validation error",
              msg: "Invalid date format",
              path: "date",
            },
          ],
        });
      }
    } else {
      if (year) where.year = year.toString();
      if (month) where.month = month.toString();
    }

    const dashboardData = await prisma.dashboard.findMany({
      where,
      orderBy: { date: "desc" },
    });

    // If no data found for the specific date, create one with carried-forward values
    if (dashboardData.length === 0 && date) {
      const requestedDate = new Date(date as string);
      if (isNaN(requestedDate.getTime())) {
        return res.status(400).json({
          success: false,
          errors: [
            {
              type: "validation error",
              msg: "Invalid date format",
              path: "date",
            },
          ],
        });
      }
      const newDashboard = await getOrCreateDashboard(
        shopOwnerId,
        requestedDate
      );
      return res.status(200).json({
        success: true,
        data: [newDashboard],
      });
    }
    const suppliers = await prisma.supplier.aggregate({
      where: { shopOwnerId },
      _sum: {
        totalDue: true,
      },
    });
    const customers = await prisma.customer.aggregate({
      where: { shopOwnerId },
      _sum: {
        deuAmount: true,
      },
    });
    console.log(customers);
    const data = dashboardData.map((dashboard) => ({
      ...dashboard,
      totalDueFromCustomers: customers._sum.deuAmount,
      totalDueToSuppliers: suppliers._sum.totalDue,
    }));
    return res.status(200).json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error("Error in getDashboardData:", error);
    return res.status(500).json({
      success: false,
      errors: [
        { type: "server error", msg: "Internal server error", path: "server" },
      ],
    });
  }
}
