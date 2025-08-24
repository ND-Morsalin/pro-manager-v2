import { Response } from "express";
import { ExtendedRequest } from "../../types/types";
import prisma from "../../utility/prisma";
import { getPagination } from "../../utility/getPaginatin";

// Helper function to format date for daily report
const getDateRange = (date: Date) => {
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);
  return { startDate, endDate };
};

// Generate or Update Daily Purchase Report
const generateDailyPurchaseReport = async (
  req: ExtendedRequest,
  res: Response
) => {
  try {
    const { date } = req.query as { date: string };
    const {page, limit, skip} = getPagination(req);
    const reportDate = new Date(date || new Date()); ;
    if (isNaN(reportDate.getTime())) {
      return res.status(400).json({
        success: false,
        errors: [{ type: "validation", msg: "Invalid date", path: "date" }],
      });
    }

    const { startDate, endDate } = getDateRange(reportDate);
    const month = reportDate.toLocaleString("default", { month: "long" });
    const year = reportDate.getFullYear().toString();

    // Fetch PurchasedHistory records for the given day
    const purchases = await prisma.purchasedHistory.findMany({
      where: {
        shopOwnerId: req.shopOwner.id,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        createdAt: true,
        products: {
          select: {
            product: true,
            productId: true,
            purchasedHistory: true,
            purchasedHistoryId: true,
            inventory: true,
          },
        },
        supplier: { select: { name: true } },
        paymentType: true,
        due: true,
        discountAmount: true,
        discountType: true,
        cost: true,
        paid: true,
        totalPrice: true,
      },
      skip,
      take: limit,
    });

    // Extract PurchasedHistory IDs
    const purchaseHistoryIds = purchases.map((purchase) => purchase.id);

    // Find existing report by shopOwnerId and date
    let report = await prisma.purchaseReport.findFirst({
      where: {
        shopOwnerId: req.shopOwner.id,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        date: true,
        month: true,
        year: true,
        purchaseHistoryIds: true,
      },
    });

    if (report) {
      // Update existing report
      report = await prisma.purchaseReport.update({
        where: { id: report.id },
        data: {
          purchaseHistoryIds,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          date: true,
          month: true,
          year: true,
          purchaseHistoryIds: true,
        },
      });
    } else {
      // Create new report
      report = await prisma.purchaseReport.create({
        data: {
          shopOwnerId: req.shopOwner.id,
          date: startDate,
          month,
          year,
          purchaseHistoryIds,
        },
        select: {
          id: true,
          date: true,
          month: true,
          year: true,
          purchaseHistoryIds: true,
        },
      });
    }

    // Format report data
    const reportData = purchases.map((purchase) => ({
      date: purchase.createdAt,
      products: purchase.products,

      supplierName: purchase.supplier?.name || "Unknown",
      paymentType: purchase.paymentType,
    }));

    return res.status(200).json({
      success: true,
      message: "Daily purchase report generated successfully",
      report: {
        id: report.id,
        date: report.date,
        month: report.month,
        year: report.year,
        data: reportData,
      },
    });
  } catch (error) {
    console.error("Error in generateDailyPurchaseReport:", error);
    return res.status(500).json({
      success: false,
      errors: [
        { type: "server error", msg: "Internal server error", path: "server" },
      ],
    });
  }
};

// Generate Monthly Purchase Report
const generateMonthlyPurchaseReport = async (
  req: ExtendedRequest,
  res: Response
) => {
  try {
    let { month, year } = req.query as { month: string; year: string };
      const {page, limit, skip} = getPagination(req);
    // if month and year not provided, return current month and year
    if (!month ) {
      const now = new Date();
      month = now.toLocaleString("default", { month: "long" });
     
    }
    if (!year) {
      year = new Date().getFullYear().toString();
    }


    // Fetch all daily reports for the given month and year
    const reports = await prisma.purchaseReport.findMany({
      where: {
        shopOwnerId: req.shopOwner.id,
        month,
        year,
      },
      select: { purchaseHistoryIds: true },
      skip,
      take: limit,
    });

    // Aggregate PurchasedHistory IDs
    const purchaseHistoryIds = reports.flatMap(
      (report) => report.purchaseHistoryIds
    );

    // Fetch PurchasedHistory details
    const purchases = await prisma.purchasedHistory.findMany({
      where: {
        id: { in: purchaseHistoryIds },
      },
      select: {
        id: true,
        createdAt: true,
        products: {
          select: {
            product: true,
            productId: true,
            purchasedHistory: true,
            purchasedHistoryId: true,
            inventory: true,
          },
        },

        supplier: { select: { name: true } },
        paymentType: true,
        due: true,
        discountAmount: true,
        discountType: true,
        cost: true,
        paid: true,
        totalPrice: true,
      },
    });

    // Format report data
    const reportData = purchases.map((purchase) => ({
      date: purchase.createdAt,
      paymentType: purchase.paymentType,
      products: purchase.products,
      quantity: purchase.products.reduce(
        (sum, product) => sum + (product.inventory?.stokeAmount || 0),
        0
      ),
      buyingPrice: purchase.products.reduce(
        (sum, product) => sum + (product.inventory?.buyingPrice || 0),
        0
      ),
      supplierName: purchase.supplier?.name || "Unknown",
      due: purchase.due,
      discountAmount: purchase.discountAmount,
      discountType: purchase.discountType,
      cost: purchase.cost,
      paid: purchase.paid,
      totalPrice: purchase.totalPrice,
    }));

    const reportCount = await prisma.purchaseReport.count({
      where: {
        shopOwnerId: req.shopOwner.id,
        month,
        year,
      },
    });

    return res.status(200).json({
      meta: {
        page,
        limit,
        count: reportCount,
      },
      success: true,
      message: "Monthly purchase report generated successfully",
      report: {
        month,
        year,
        data: reportData,
      },
    });
  } catch (error) {
    console.error("Error in generateMonthlyPurchaseReport:", error);
    return res.status(500).json({
      success: false,
      errors: [
        { type: "server error", msg: "Internal server error", path: "server" },
      ],
    });
  }
};

// Generate Yearly Purchase Report
const generateYearlyPurchaseReport = async (
  req: ExtendedRequest,
  res: Response
) => {
  try {
     const {page, limit, skip} = getPagination(req);
    let { year } = req.query as { year: string };
    if (!year) {
      year = new Date().getFullYear().toString();
    }

    // Fetch all daily reports for the given year
    const reports = await prisma.purchaseReport.findMany({
      where: {
        shopOwnerId: req.shopOwner.id,
        year,
      },
      select: { purchaseHistoryIds: true },
      skip,
      take: limit,
    });

    // Aggregate PurchasedHistory IDs
    const purchaseHistoryIds = reports.flatMap(
      (report) => report.purchaseHistoryIds
    );

    // Fetch PurchasedHistory details
    const purchases = await prisma.purchasedHistory.findMany({
      where: {
        id: { in: purchaseHistoryIds },
      },
      select: {
        id: true,
        createdAt: true,
        products: {
          select: {
            product: true,
            productId: true,
            purchasedHistory: true,
            purchasedHistoryId: true,
            inventory: true,
          },
        },
        supplier: { select: { name: true } },
        paymentType: true,
        due: true,
        discountAmount: true,
        discountType: true,
        cost: true,
        paid: true,
        totalPrice: true,
      },
    });

    // Format report data
    const reportData = purchases.map((purchase) => ({
      date: purchase.createdAt,
      products: purchase.products,
      quantity: purchase.products.reduce(
        (sum, product) => sum + (product.inventory?.stokeAmount || 0),
        0
      ),
      buyingPrice: purchase.products.reduce(
        (sum, product) => sum + (product.inventory?.buyingPrice || 0),
        0
      ),
      due: purchase.due,
      discountAmount: purchase.discountAmount,
      discountType: purchase.discountType,
      cost: purchase.cost,
      paid: purchase.paid,
      totalPrice: purchase.totalPrice,
      createdAt: purchase.createdAt,
      supplierName: purchase.supplier?.name || "Unknown",
      paymentType: purchase.paymentType,
    }));
    const reportCount = await prisma.purchaseReport.count({
      where: {
        shopOwnerId: req.shopOwner.id,
        year,
      },
    });

    return res.status(200).json({
      meta: {
        page,
        limit,
        count: reportCount,
      },
      success: true,
      message: "Yearly purchase report generated successfully",
      report: {
        year,
        data: reportData,
      },
    });
  } catch (error) {
    console.error("Error in generateYearlyPurchaseReport:", error);
    return res.status(500).json({
      success: false,
      errors: [
        { type: "server error", msg: "Internal server error", path: "server" },
      ],
    });
  }
};

// Get all purchase reports for a shop owner
const getPurchaseReports = async (req: ExtendedRequest, res: Response) => {
  try {
    const { date, month, year } = req.query as {
      date?: string;
      month?: string;
      year?: string;
    };
     const {page, limit, skip} = getPagination(req);

    const where: any = { shopOwnerId: req.shopOwner.id };
    if (date) {
      const reportDate = new Date(date);
      if (!isNaN(reportDate.getTime())) {
        const { startDate } = getDateRange(reportDate);
        where.date = startDate;
      }
    }
    if (month && year) {
      where.month = month;
      where.year = year;
    } else if (year) {
      where.year = year;
    }

    const reports = await prisma.purchaseReport.findMany({
      where,
      orderBy: { date: "desc" },
      select: {
        id: true,
        date: true,
        month: true,
        year: true,
        purchaseHistoryIds: true,
      },
      skip,
      take: limit,
    });

    // Fetch details for all reports
    const detailedReports = await Promise.all(
      reports.map(async (report) => {
        const purchases = await prisma.purchasedHistory.findMany({
          where: { id: { in: report.purchaseHistoryIds } },
          select: {
            id: true,
            createdAt: true,
            products: {
              select: {
                product: true,
                productId: true,
                purchasedHistory: true,
                purchasedHistoryId: true,
                inventory: true,

              },
            },
            
            supplier: { select: { name: true } },
            paymentType: true,
            due: true,
            discountAmount: true,
            discountType: true,
            cost: true,
            paid: true,
            totalPrice: true,

          },
        });

        const reportData = purchases.map((purchase) => ({
          date: purchase.createdAt,
          products: purchase.products,
          supplierName: purchase.supplier?.name || "Unknown",
          paymentType: purchase.paymentType,
          quantity: purchase.products.reduce(
            (sum, product) => sum + (product.inventory?.stokeAmount || 0),
            0
          ),
          buyingPrice: purchase.products.reduce(
            (sum, product) => sum + (product.inventory?.buyingPrice || 0),
            0
          ),
          due: purchase.due,
          discountAmount: purchase.discountAmount,
          discountType: purchase.discountType,
          cost: purchase.cost,
          paid: purchase.paid,
          totalPrice: purchase.totalPrice,

        }));

        return {
          id: report.id,
          date: report.date,
          month: report.month,
          year: report.year,
          data: reportData,
        };
      })
    );

    const count = await prisma.purchaseReport.count({
      where,
    });

    return res.status(200).json({
      meta: {
        page,
        limit,
        count,
      },
      success: true,
      message: "Purchase reports fetched successfully",
      reports: detailedReports,
    });
  } catch (error) {
    console.error("Error in getPurchaseReports:", error);
    return res.status(500).json({
      success: false,
      errors: [
        { type: "server error", msg: "Internal server error", path: "server" },
      ],
    });
  }
};

const getSellingReport = async (req: ExtendedRequest, res: Response) => {
  try {
    const { viewBy = "daily", date } = req.query as {
      viewBy: string;
      date?: string;
    };
    const shopOwnerId = req.shopOwner.id;
    const {page, limit, skip} = getPagination(req);

    // Set date filter depending on viewBy (daily, monthly, yearly)
    const filterDate = new Date(date || new Date());
    let start, end;

    if (viewBy === "daily") {
      start = new Date(filterDate.setHours(0, 0, 0, 0));
      end = new Date(filterDate.setHours(23, 59, 59, 999));
    } else if (viewBy === "monthly") {
      start = new Date(filterDate.getFullYear(), filterDate.getMonth(), 1);
      end = new Date(
        filterDate.getFullYear(),
        filterDate.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );
    } else if (viewBy === "yearly") {
      start = new Date(filterDate.getFullYear(), 0, 1);
      end = new Date(filterDate.getFullYear(), 11, 31, 23, 59, 59, 999);
    }

    // Fetch all voicers created within the given period for the shop owner
    const voicers = await prisma.productVoicer.findMany({
      where: {
        shopOwnerId,
        createdAt: { gte: start, lte: end },
      },
      include: {
        sellingProducts: true,
      },
      orderBy: {
        createdAt: "asc",
      },
      skip,
      take: limit,

    });

    const report = [];
    let sl = 1;

    for (const voicer of voicers) {
      for (const product of voicer.sellingProducts) {
        const productData = await prisma.product.findUnique({
          where: { id: product.productId },
        });

        const inventories = await prisma.inventory.findMany({
          where: {
            productId: product.productId,
            shopOwnerId,
          },
          orderBy: {
            createdAt: "asc",
          },
        });

        // Calculate profit/loss per product
        let quantityLeft = product.quantity;
        let profit = 0;
        let loss = 0;
        let qtyCounted = 0;

        for (const inv of inventories) {
          if (quantityLeft <= 0) break;

          const usedQty = Math.min(
            quantityLeft,
            inv.stokeAmount + product.quantity
          ); // + product.quantity because inventory already decremented
          const diff = product.sellingPrice - inv.buyingPrice;

          if (diff >= 0) profit += diff * usedQty;
          else loss += Math.abs(diff) * usedQty;

          quantityLeft -= usedQty;
          qtyCounted += usedQty;
        }

        report.push({
          sl: sl++,
          date: voicer.createdAt.toLocaleDateString(),
          productName: product.productName,
          quantity: product.quantity,
          sellingPrice: product.sellingPrice,
          profit: profit.toFixed(2),
          loss: loss.toFixed(2),
        });
      }
    }
    const count = await prisma.productVoicer.count({
      where: {
        shopOwnerId,
        createdAt: { gte: start, lte: end },
      },
    });

    return res.status(200).json({
      meta: {
        page,
        limit,
        count,
      },
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("Error generating selling report:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export {
  generateDailyPurchaseReport,
  generateMonthlyPurchaseReport,
  generateYearlyPurchaseReport,
  getPurchaseReports,
  getSellingReport,
};
