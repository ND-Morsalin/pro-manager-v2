import { Response } from "express";
import { ExtendedRequest } from "../../types/types";
import prisma from "../../utility/prisma";

const crateCash = async (req: ExtendedRequest, res: Response) => {
  try {
    const { cashInBalance, cashOutBalance, note, requestType, date } =
      req.body as {
        cashInBalance: number;
        cashOutBalance: number;
        note: string;
        requestType: "cashIn" | "cashOut";
        date: Date;
      };

    // find cash of the shop owner
    const cash = await prisma.cash.findUnique({
      where: {
        shopOwnerId: req.shopOwner.id,
      },
    });
    // if cash is not available then create cash

    if (!cash) {
      const newCash = await prisma.cash.create({
        data: {
          shopOwnerId: req.shopOwner.id,
          cashBalance:
            requestType === "cashIn" ? cashInBalance : -cashOutBalance,
          cashInHistory: requestType === "cashIn" && {
            create: {
              cashInAmount: cashInBalance,
              cashInFor: note,
              shopOwnerId: req.shopOwner.id,
              cashInDate: date || new Date(),
            },
          },
          cashOutHistory: requestType === "cashOut" && {
            create: {
              cashOutAmount: cashOutBalance,
              cashOutFor: note,
              shopOwnerId: req.shopOwner.id,
              cashOutDate: new Date(),
            },
          },
        },
      });

      return res.status(201).json({
        success: true,
        message: "cash created",
        cash: newCash,
      });
    }

    // if cash is available then update cash
    const updatedCash = await prisma.cash.update({
      where: {
        shopOwnerId: req.shopOwner.id,
      },
      data: {
        cashBalance: (requestType === "cashIn" && {
          increment: cashInBalance,
        }) || {
          decrement: cashOutBalance,
        },
        cashInHistory: requestType === "cashIn" && {
          create: {
            cashInAmount: cashInBalance,
            cashInFor: note,
            shopOwnerId: req.shopOwner.id,
            cashInDate: date || new Date(),
          },
        },
        cashOutHistory: requestType === "cashOut" && {
          create: {
            cashOutAmount: cashOutBalance,
            cashOutFor: note,
            shopOwnerId: req.shopOwner.id,
            cashOutDate: new Date(),
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: "cash updated",
      cash: updatedCash,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      errors: [
        {
          type: "server error",
          value: "",
          msg: "Internal server error",
          path: "server",
          location: "crateCash",
        },
      ],
    });
  }
};

const getAllCash = async (req: ExtendedRequest, res: Response) => {
  try {
    const cash = await prisma.cash.findMany({
      where: {
        shopOwnerId: req.shopOwner.id,
      },
      include: {
        cashInHistory: true,
        cashOutHistory: true,
      },
    });

    // if cash is not available then return error
    if (!cash) {
      return res.status(404).json({
        success: false,
        errors: [
          {
            type: "not found",
            value: "",
            msg: "Cash not found",
            path: "cash",
            location: "getAllCash",
          },
        ],
      });
    }

    return res.json({ success: true, cash });
  } catch (error) {
    return res.status(500).json({
      success: false,
      errors: [
        {
          type: "server error",
          value: "",
          msg: "Internal server error",
          path: "server",
          location: "getAllCash",
        },
      ],
    });
  }
};


export { crateCash, getAllCash };
