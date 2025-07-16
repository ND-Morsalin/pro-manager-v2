import { Response } from "express";
import { ExtendedRequest } from "../../types/types";
import prisma from "../../utility/prisma";
import { getOrCreateDashboard } from "../../utility/getOrCreateDashboard";

export async function getDashboardData(req: ExtendedRequest, res: Response) {
  try {
    const { year, month, date } = req.query;
    const shopOwnerId = req.shopOwner.id;

    const where: any = { shopOwnerId };

    if (year) where.year = year;
    if (month) where.month = month;
    if (date) where.date = date;

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

    return res.status(200).json({
      success: true,
      data: dashboardData,
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
