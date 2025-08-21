import { Response } from "express";
import { ExtendedRequest } from "../../types/types";
import prisma from "../../utility/prisma";
import { getPagination } from "../../utility/getPaginatin";
import { parseDateRange } from "../../utility/parseDateRange";

export async function getDashboardData(req: ExtendedRequest, res: Response) {
  try {
    const { startDate, endDate } = req.query;
    const shopOwnerId = req.shopOwner.id;

    const { start } = parseDateRange(
      (startDate as string) || new Date().toISOString().split("T")[0]
    );
    const { end } = parseDateRange(
      (endDate as string) || new Date().toISOString().split("T")[0]
    );

    const createdAtFilter: any = {};
    if (startDate) {
      createdAtFilter.gte = start;
    }
    if (endDate) {
      createdAtFilter.lte = end;
    }
    const suppliers = await prisma.supplier.aggregate({
      where: {
        shopOwnerId,
        ...(startDate || endDate ? { createdAt: createdAtFilter } : {}), // add condition only if needed
      },
      _sum: {
        totalDue: true,
      },
    });
    const customers = await prisma.customer.aggregate({
      where: {
        shopOwnerId,
        ...(startDate || endDate ? { createdAt: createdAtFilter } : {}), // add condition only if needed
      },
      _sum: {
        deuAmount: true,
      },
    });

    const totalCustomers = await prisma.customer.count({
      where: {
        shopOwnerId,
        ...(startDate || endDate ? { createdAt: createdAtFilter } : {}), // add condition only if needed
      },
    });
    const products = await prisma.product.aggregate({
      where: {
        shopOwnerId,
        ...(startDate || endDate ? { createdAt: createdAtFilter } : {}), // add condition only if needed
      },
      _sum: {
        totalInvestment: true,
        totalStokeAmount: true,
        totalLoss: true,
        totalProfit: true,
        totalSold: true, // total sold products
      },
    });
    const productVoicers = await prisma.productVoicer.aggregate({
      where: {
        shopOwnerId,
        ...(startDate || endDate ? { createdAt: createdAtFilter } : {}), // add condition only if needed
      },
      _sum: {
        totalBillAmount: true,
      },
    });
    const productVoicersCount = await prisma.productVoicer.count({
      where: {
        shopOwnerId,
        ...(startDate || endDate ? { createdAt: createdAtFilter } : {}), // add condition only if needed
      },
    });
    const data = {
      totalSales: productVoicers._sum.totalBillAmount || 0,
      totalOrders: productVoicersCount || 0,
      totalCustomers: totalCustomers || 0,
      totalProductsSold: products._sum.totalSold || 0,
      totalLosses: products._sum.totalLoss || 0,
      totalProfit: products._sum.totalProfit || 0,
      totalInvoices: productVoicersCount || 0,
      totalInvestments: products._sum.totalInvestment || 0,
      totalDueFromCustomers: customers._sum.deuAmount || 0,
      totalDueToSuppliers: suppliers._sum.totalDue || 0,
      totalProductsOnStock: products._sum.totalStokeAmount || 0,
    };
    return res.status(200).json({
      meta: {
        startDate: start,
        endDate: end,
      },
      success: true,
      data: data,
      message: "Dashboard data fetched successfully",
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
export async function totalSell(req: ExtendedRequest, res: Response) {
  try {
    const { startDate, endDate } = req.query;
    const shopOwnerId = req.shopOwner.id;
    const { page, skip, limit } = getPagination(req);
    console.log();
    const { start } = parseDateRange(
      (startDate as string) || new Date().toISOString().split("T")[0]
    );
    const { end } = parseDateRange(
      (endDate as string) || new Date().toISOString().split("T")[0]
    );

    const sells = await prisma.productVoicer.findMany({
      where: {
        shopOwnerId,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        sellingProducts: {
          select: {
            productName: true,
            quantity: true,
            sellingPrice: true,
            totalPrice: true,
            unit: true,
          },
        },
        customer: {
          select: {
            customerName: true,
            phoneNumber: true,
          },
        },
      },
      skip,
      take: limit,
    });
    const count = await prisma.productVoicer.count({
      where: {
        shopOwnerId,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    });
    return res.status(200).json({
      success: true,
      meta: {
        page,
        limit,
        count,
      },
      data: sells,
    });
  } catch (error) {
    console.error("Error in totalSell:", error);
    return res.status(500).json({
      success: false,
      errors: [
        { type: "server error", msg: "Internal server error", path: "server" },
      ],
    });
  }
}
