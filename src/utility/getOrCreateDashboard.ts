import prisma from "./prisma";

// Helper function to get or create dashboard for a specific date
export async function getOrCreateDashboard(shopOwnerId: string, date: Date) {
  const dateStr = date.toISOString();
  const year = date.getFullYear().toString();
  const month = date.toLocaleString("default", { month: "long" });

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  let dashboard = await prisma.dashboard.findFirst({
    where: {
      shopOwnerId,
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });
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
  if (dashboard) {
    return {
      ...dashboard,
      totalDueFromCustomers: customers._sum.deuAmount,
      totalDueToSuppliers: suppliers._sum.totalDue,
    };
  }

  // Find the most recent dashboard before the given date
  const previousDashboard = await prisma.dashboard.findFirst({
    where: {
      shopOwnerId,
      date: { lt: dateStr },
    },
    orderBy: { date: "desc" },
  });

  // Calculate current values from other collections if no previous dashboard exists
  let previousValues = {
    totalInvestments: 0,
    totalProductsOnStock: 0,
    totalDueToSuppliers: 0,
    totalDueFromCustomers: 0,
  };

  if (previousDashboard) {
    previousValues = {
      totalInvestments: previousDashboard.totalInvestments,
      totalProductsOnStock: previousDashboard.totalProductsOnStock,
      totalDueToSuppliers: suppliers._sum.totalDue,
      totalDueFromCustomers: customers._sum.deuAmount,
    };
  } else {
    const products = await prisma.product.aggregate({
      where: { shopOwnerId },
      _sum: {
        totalInvestment: true,
        totalStokeAmount: true,
        totalLoss: true,
        totalProfit: true,
      },
    });

    const customers = await prisma.customer.aggregate({
      where: { shopOwnerId },
      _sum: {
        deuAmount: true,
      },
    });

    const suppliers = await prisma.supplier.aggregate({
      where: { shopOwnerId },
      _sum: {
        totalDue: true,
      },
    });

    const sellingProducts = await prisma.sellingProduct.aggregate({
      where: { shopOwnerId },
      _sum: {
        quantity: true,
        totalPrice: true,
      },
    });
    previousValues = {
      totalInvestments: products._sum.totalInvestment || 0,
      totalProductsOnStock: products._sum.totalStokeAmount || 0,
      totalDueToSuppliers: suppliers._sum.totalDue || 0,
      totalDueFromCustomers: customers._sum.deuAmount || 0,
    };
  }

  // Create new dashboard
  return await prisma.dashboard.create({
    data: {
      shopOwnerId,
      date: dateStr,
      month,
      year,
      totalSales: 0,
      totalOrders: 0,
      totalCustomers: 0,
      totalProductsSold: 0,
      totalLosses: 0,
      totalProfit: 0,
      totalInvoices: 0,
      totalInvestments: previousValues.totalInvestments,
      totalDueFromCustomers: previousValues.totalDueFromCustomers,
      totalDueToSuppliers: previousValues.totalDueToSuppliers,
      totalProductsOnStock: previousValues.totalProductsOnStock,
    },
  });
}
