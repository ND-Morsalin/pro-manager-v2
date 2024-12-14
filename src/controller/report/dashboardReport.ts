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