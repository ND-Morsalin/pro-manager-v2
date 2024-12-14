import { Response } from "express";
import { ExtendedRequest } from "types/types";
import prisma from "../../utility/prisma";

const dashboardReport = async (req: ExtendedRequest, res: Response) => {
    try {
        const {startDate, endDate} = req.body as {startDate: string, endDate: string};
        const sellingProducts = await prisma.sellingProduct.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
                shopOwnerId: req.shopOwner.id,
            },
            include:{
                product: true,
            }
        });

        const totalSellingPrice = sellingProducts.reduce((acc, curr) => {
            return acc + curr.totalPrice;
        }, 0);

        const totalProfit = sellingProducts.reduce((acc, curr) => {
            return acc + (curr.totalPrice - (curr.quantity * curr.product.buyingPrice));
        }, 0);

        const totalLoss = sellingProducts.reduce((acc, curr) => {
            return acc + ((curr.quantity * curr.product.buyingPrice) - curr.totalPrice);
        }, 0);

        const numberOfProductOnStock = await prisma.product.count({
            where: {
                shopOwnerId: req.shopOwner.id,
                stokeAmount: {
                    gt: 0,
                }
            }
        });

        const numberOfProductOutOfStock = await prisma.product.count({
            where: {
                shopOwnerId: req.shopOwner.id,
                stokeAmount: {
                    lte: 0,
                }
            }
        });

        const totalProduct = await prisma.product.count({
            where: {
                shopOwnerId: req.shopOwner.id,
            }
        });

        const totalCustomer = await prisma.customer.count({
            where: {
                shopOwnerId: req.shopOwner.id,
            }
        });

        const customerWithThisPeriod = await prisma.customer.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
                shopOwnerId: req.shopOwner.id,
            }
        });

        const customerWithHighestPurchase = await prisma.customer.findFirst({
            where: {
                shopOwnerId: req.shopOwner.id,
            },
            orderBy: {
                paidAmount: "desc",
            }
        });

        const customerWithHighestDueAmount = await prisma.customer.findFirst({
            where: {
                shopOwnerId: req.shopOwner.id,
            },
            orderBy: {
                deuAmount: "desc",
            }
        });

        const totalDueAmountWithThisPeriod = customerWithThisPeriod.reduce((acc, curr) => {
            return acc + curr.deuAmount;
        }, 0);

        const totalPaidAmountWithThisPeriod = customerWithThisPeriod.reduce((acc, curr) => {
            return acc + curr.paidAmount;
        }, 0);

        const totalInvestment = await prisma.product.findMany({
            where: {
                shopOwnerId: req.shopOwner.id,
            }
        });

        const totalInvestmentAmount = totalInvestment.reduce((acc, curr) => {
            return acc + (curr.buyingPrice * curr.stokeAmount);
        }, 0);

        return res.status(200).json({
            success: true,
            data: {
                totalSellingPrice,
                totalProfit,
                totalLoss: totalLoss < 0 ? 0 : totalLoss, 
                numberOfProductOnStock,
                numberOfProductOutOfStock,
                totalProduct,
                totalCustomer,
                customerWithHighestPurchase,
                customerWithHighestDueAmount,
                totalDueAmountWithThisPeriod,
                totalPaidAmountWithThisPeriod,
                totalInvestmentAmount,
            }
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
                }
            ],
        });
    }
}

export default dashboardReport;