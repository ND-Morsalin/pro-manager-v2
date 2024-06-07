import { Request, Response } from "express";
import prisma from "../../utility/prisma";

const dailySellingReport = async (req: Request, res: Response) => {

    try {
        
        const { date } = req.query;
        
        const dailySellingReport = await prisma.sellingProduct.findMany({
            where: {
                createdAt: date as string,
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
                    path: "server",
                    location: "dailySellingReport",
                },
            ],
        });
    }

}

export { dailySellingReport };