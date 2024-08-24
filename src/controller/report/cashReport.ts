import prisma from "../../utility/prisma";
import { ExtendedRequest } from "../../types/types";
import { Response } from "express";

const yearlyCashReport = async (req: ExtendedRequest, res: Response) => {
  const { year } = req.params;
  try {
    const yearlyReport = await prisma.cash.aggregateRaw({
      options: {
        toJSON: true,
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: [{ $year: "$createdAt" }, year] },
                { $eq: ["$shopOwnerId", req.shopOwner.id] },
              ],
            },
          },
        },

        {
          $group: {
            _id: {
              month: { $month: "$createdAt" },
              year: { $year: "$createdAt" },
            },
            totalCashBalance: { $sum: "$cashBalance" },
          },
        },
        {
          $project: {
            _id: 0,
            month: "$_id.month",
            year: "$_id.year",
            cashBalance: "$totalCashBalance",
          },
        },
        {
          $sort: { month: 1, year: 1 },
        },
      ],
    });

    return res.status(200).json({
      yearlyReport,
      success: true,
      message: "Yearly report generated successfully",
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const monthlyCashReport = async (req: ExtendedRequest, res: Response) => {
  const { year, month } = req.params as { year: string; month: string };
  try {
    const monthlyReport = await prisma.cash.aggregateRaw({
      options: {
        toJSON: true,
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: [{ $year: "$createdAt" }, parseInt(year)] },
                { $eq: [{ $month: "$createdAt" }, parseInt(month)] },
                { $eq: ["$shopOwnerId", req.shopOwner.id] },
              ],
            },
          },
        },
        {
          $group: {
            _id: {
              day: { $dayOfMonth: "$createdAt" },
              month: { $month: "$createdAt" },
              year: { $year: "$createdAt" },
            },
            totalCashBalance: { $sum: "$cashBalance" },
          },
        },
        {
          $project: {
            _id: 0,
            day: "$_id.day",
            month: "$_id.month",
            year: "$_id.year",
            cashBalance: "$totalCashBalance",
          },
        },
        {
          $sort: { day: 1 },
        },
      ],
    });

    return res.status(200).json({
      monthlyReport,
      success: true,
      message: "Monthly report generated successfully",
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export { yearlyCashReport, monthlyCashReport };
