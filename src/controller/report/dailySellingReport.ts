import { Request, Response } from "express";
import prisma from "../../utility/prisma";
import { ExtendedRequest } from "types/types";

const dailySellingReport = async (req: ExtendedRequest, res: Response) => {

    try {
        
        const { date } = req.query;
        console.log(
            date
        )
        
        const dailySellingReport = await prisma.sellingProduct.findMany({
            where: {
                createdAt: date as string,
                shopOwnerId: req.shopOwner.id,
            },
        });

        return res.status(200).json({
            success: true,
            data: dailySellingReport,
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
                    path: "server",
                    location: "dailySellingReport",
                },
            ],
        });
    }

}

export { dailySellingReport };