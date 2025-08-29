import { Response } from "express";
import { ExtendedRequest } from "../../types/types";
import prisma from "../../utility/prisma";
import { getPagination } from "../../utility/getPaginatin";
import { parseDateRange } from "../../utility/parseDateRange";

export async function getDashboardData(req: ExtendedRequest, res: Response) {
  try {
    const { startDate, endDate } = req.query;
    const shopOwnerId = req.shopOwner.id;
/* . Total Sales 
2. Total invoice 
3. Total products sold 
4. Profit 
5. Loss
 */
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
    
    const suppliersDue = await prisma.supplier.aggregate({
      where: {
        shopOwnerId,
        // ...(startDate || endDate ? { createdAt: createdAtFilter } : {}), // add condition only if needed
      },
      _sum: {
        totalDue: true,
      },
    });
    
    const customersDue = await prisma.customer.aggregate({
      where: {
        shopOwnerId,
        // ...(startDate || endDate ? { createdAt: createdAtFilter } : {}), // add condition only if needed
      },
      _sum: {
        deuAmount: true,
      },
    });

    const totalCustomers = await prisma.customer.count({
      where: {
        shopOwnerId,
        // ...(startDate || endDate ? { createdAt: createdAtFilter } : {}), // add condition only if needed
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
    const productsInvestment = await prisma.product.aggregate({
      where: {
        shopOwnerId,
        // ...(startDate || endDate ? { createdAt: createdAtFilter } : {}), // add condition only if needed
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
        totalQuantity:true,
        totalLoss:true,
        totalProfit:true
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
      totalProductsSold: productVoicers._sum.totalQuantity || 0,
      totalLosses: productVoicers._sum.totalLoss || 0,
      totalProfit: productVoicers._sum.totalProfit || 0,
      totalInvoices: productVoicersCount || 0,
      totalInvestments: productsInvestment._sum.totalInvestment || 0,
      totalDueFromCustomers: customersDue._sum.deuAmount || 0,
      totalDueToSuppliers: suppliersDue._sum.totalDue || 0,
      totalProductsOnStock: productsInvestment._sum.totalStokeAmount || 0,
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
console.log({start,end, startDate,endDate});
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
            profit:true,
            loss:true
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

    // Add these parameters to your function
const { productPage = 1, productLimit = 50 } = req.query;
const productSkip = (Number(productPage) - 1) * Number(productLimit);

// Modify the aggregation query
const aggregatedProducts = await prisma.sellingProduct.groupBy({
  by: ['productName', 'unit'],
  where: {
    productVoicer: {
      shopOwnerId,
      createdAt: {
        gte: start,
        lte: end,
      },
    },
  },
  _sum: {
    quantity: true,
    totalPrice: true,
    profit: true,
    loss: true,
  },
  orderBy: {
    _sum: {
      totalPrice: 'desc',
    },
  },
  skip,
  take: limit,
});


    return res.status(200).json({
      success: true,
      meta: {
        page,
        limit,
        count,
      },
      data: sells,
      uniqueProducts: aggregatedProducts
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
