import { Response } from "express";
import { ExtendedRequest } from "types/types";
import prisma from "../../utility/prisma";

const dashboardReport = async (req: ExtendedRequest, res: Response) => {
  try {
    const { startDateUTC, endDateUTC } = req.body as {
      startDateUTC: string;
      endDateUTC: string;
    };
    // cash will get of date of today
    const startDate = new Date(startDateUTC);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(endDateUTC);
    endDate.setHours(23, 59, 59, 999);

    console.log({
      startDate,
      endDate,
      startDateUTC,
      endDateUTC,
    });

    const sellingProducts = await prisma.sellingProduct.findMany({
      where: {
        shopOwnerId: req.shopOwner.id,
      },
      include: {
        product: true,
      },
    });

    const totalSellingPrice = sellingProducts.reduce((acc, curr) => {
      return acc + curr.totalPrice;
    }, 0);

    const totalProfit = sellingProducts.reduce((acc, curr) => {
      return acc + (curr.totalPrice - curr.quantity * curr.product.buyingPrice);
    }, 0);
    const totalLoss = sellingProducts.reduce((acc, curr) => {
      return acc + (curr.quantity * curr.product.buyingPrice - curr.totalPrice);
    }, 0);
    const sellingProductsOnThisPeriod = await prisma.sellingProduct.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        shopOwnerId: req.shopOwner.id,
      },
      include: {
        product: true,
      },
    });

    const totalSellingPriceOnThisPeriod = sellingProductsOnThisPeriod.reduce(
      (acc, curr) => {
        return acc + curr.totalPrice;
      },
      0
    );

    const totalProfitOnThisPeriod = sellingProductsOnThisPeriod.reduce(
      (acc, curr) => {
        return (
          acc + (curr.totalPrice - curr.quantity * curr.product.buyingPrice)
        );
      },
      0
    );

    const totalLossOnThisPeriod = sellingProductsOnThisPeriod.reduce(
      (acc, curr) => {
        return (
          acc + (curr.quantity * curr.product.buyingPrice - curr.totalPrice)
        );
      },
      0
    );

    const numberOfProductOnStock = await prisma.product.count({
      where: {
        shopOwnerId: req.shopOwner.id,
        stokeAmount: {
          gt: 0,
        },
      },
    });
    const numberOfProductOnStockOnThisPeriod = await prisma.product.count({
      where: {
        shopOwnerId: req.shopOwner.id,
        stokeAmount: {
          gt: 0,
        },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const numberOfProductOutOfStockOnThisPeriod = await prisma.product.count({
      where: {
        shopOwnerId: req.shopOwner.id,
        stokeAmount: {
          lte: 0,
        },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const numberOfProductOutOfStock = await prisma.product.count({
      where: {
        shopOwnerId: req.shopOwner.id,
        stokeAmount: {
          lte: 0,
        },
      },
    });

    const totalProduct = await prisma.product.count({
      where: {
        shopOwnerId: req.shopOwner.id,
      },
    });

    const totalCustomer = await prisma.customer.count({
      where: {
        shopOwnerId: req.shopOwner.id,
      },
    });

    const customerOnThisPeriod = await prisma.customer.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        shopOwnerId: req.shopOwner.id,
      },
    });

    const customerOnHighestPurchase = await prisma.customer.findFirst({
      where: {
        shopOwnerId: req.shopOwner.id,
      },
      orderBy: {
        paidAmount: "desc",
      },
    });

    const customerOnHighestDueAmount = await prisma.customer.findFirst({
      where: {
        shopOwnerId: req.shopOwner.id,
      },
      orderBy: {
        deuAmount: "desc",
      },
    });

    const totalDueAmountOnThisPeriod = customerOnThisPeriod.reduce(
      (acc, curr) => {
        return acc + curr.deuAmount;
      },
      0
    );

    const totalPaidAmountOnThisPeriod = customerOnThisPeriod.reduce(
      (acc, curr) => {
        return acc + curr.paidAmount;
      },
      0
    );

    const totalInvestment = await prisma.product.findMany({
      where: {
        shopOwnerId: req.shopOwner.id,
      },
    });

    const totalInvestmentAmount = totalInvestment.reduce((acc, curr) => {
      return acc + curr.buyingPrice * curr.stokeAmount;
    }, 0);
    const totalInvestmentOnThisPeriod = await prisma.product.findMany({
      where: {
        shopOwnerId: req.shopOwner.id,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalInvestmentAmountPeriod = totalInvestment.reduce((acc, curr) => {
      return acc + curr.buyingPrice * curr.stokeAmount;
    }, 0);

    const totalInvoiceNumber = await prisma.productVoicer.count();
    const totalInvoiceNumberOnThisPeriod = await prisma.productVoicer.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalInvoice = await prisma.productVoicer.findMany();
    const totalInvoiceOnThisPeriod = await prisma.productVoicer.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        sellingProducts,
        totalSellingPrice,
        totalProfit,
        totalLoss,
        sellingProductsOnThisPeriod,
        totalSellingPriceOnThisPeriod,
        totalProfitOnThisPeriod,
        totalLossOnThisPeriod,
        numberOfProductOnStock,
        numberOfProductOnStockOnThisPeriod,
        numberOfProductOutOfStockOnThisPeriod,
        numberOfProductOutOfStock,
        totalProduct,
        totalCustomer,
        customerOnHighestPurchase,
        customerOnHighestDueAmount,
        totalDueAmountOnThisPeriod,
        totalPaidAmountOnThisPeriod,
        totalInvestmentAmount,
        totalInvestmentAmountPeriod,
        totalInvestmentOnThisPeriod,
        totalInvoiceNumber,
        totalInvoiceNumberOnThisPeriod,
        totalInvoice,
        totalInvoiceOnThisPeriod,
      },
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
        },
      ],
    });
  }
};

export default dashboardReport;
