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
    // cash will get of date of today
    const startTime = new Date(date);
    startTime.setHours(0, 0, 0, 0);
    const endTime = new Date(date);
    endTime.setHours(23, 59, 59, 999);

    const cash = await prisma.cash.findUnique({
      where: {
        shopOwnerId: req.shopOwner.id,
        createdAt: {
          gte: startTime,
          lte: endTime,
        },
      },
    });
    // if cash is not available then create cash

    if (!cash) {
      let newCash;
      if (requestType === "cashIn") {
        /* 
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
        */
        newCash = await prisma.cash.create({
          data: {
            cashBalance: cashInBalance,
            cashInHistory: {
              create: {
                cashInAmount: cashInBalance,
                cashInFor: note,
                shopOwnerId: req.shopOwner.id,
                cashInDate: date || new Date(),
              },
            },
            shopOwner: {
              connect: {
                id: req.shopOwner.id,
              },
            },
          },
        });
      } else if (requestType === "cashOut") {
        newCash = await prisma.cash.create({
          data: {
            cashBalance: -cashOutBalance,
            cashOutHistory: {
              create: {
                cashOutAmount: cashOutBalance,
                cashOutFor: note,
                shopOwnerId: req.shopOwner.id,
                cashOutDate: new Date(),
              },
            },
            shopOwner: {
              connect: {
                id: req.shopOwner.id,
              },
            },
          },
        });
      }

      return res.status(200).json({
        success: true,
        message: "cash created",
        cash: newCash,
      });
    }

    // if cash is available then update cash
    let updatedCash;
    if (requestType === "cashIn" && cashInBalance > 0) {
      updatedCash = await prisma.cash.update({
        where: {
          shopOwnerId: req.shopOwner.id,
        },
        data: {
          cashBalance: {
            increment: cashInBalance,
          },
          cashInHistory: {
            create: {
              cashInAmount: cashInBalance,
              cashInFor: note,
              shopOwnerId: req.shopOwner.id,
              cashInDate: new Date(date),
            },
          },
        },
      });
    } else if (requestType === "cashOut" && cashOutBalance > 0) {
      updatedCash = await prisma.cash.update({
        where: {
          shopOwnerId: req.shopOwner.id,
        },
        data: {
          cashBalance: {
            decrement: cashOutBalance,
          },
          cashOutHistory: {
            create: {
              cashOutAmount: cashOutBalance,
              cashOutFor: note,
              shopOwnerId: req.shopOwner.id,
              cashOutDate: new Date(date),
            },
          },
        },
      });
    } else {
      return res.status(400).json({
        success: false,
        errors: [
          {
            type: "bad request",
            value: "",
            msg: "Invalid request",
          },
        ],
      });
    }

    // Today Cash
    const cashNew = await prisma.cash.findUnique({
      where: {
        shopOwnerId: req.shopOwner.id,
        createdAt: {
          gte: startTime,
          lte: endTime,
        },
      },
    });

    // Today Cash In History
    const cashInHistory = await prisma.cashInHistory.findMany({
      where: {
        shopOwnerId: req.shopOwner.id,
        cashInDate: {
          gte: startTime,
          lte: endTime,
        },
      },
    });

    // Today Cash Out History
    const cashOutHistory = await prisma.cashOutHistory.findMany({
      where: {
        shopOwnerId: req.shopOwner.id,
        cashOutDate: {
          gte: startTime,
          lte: endTime,
        },
      },
    });

    const todayTotalCashIn = cashInHistory.reduce(
      (acc, curr) => acc + curr.cashInAmount,
      0
    );

    const todayTotalCashOut = cashOutHistory.reduce(
      (acc, curr) => acc + curr.cashOutAmount,
      0
    );

    return res.status(200).json({
      success: true,
      message: "cash updated successfully",
      todayCashBalance: cashNew.cashBalance,
      todayTotalCashOut,
      todayTotalCashIn,
      cashInHistory,
      cashOutHistory,
    });
  } catch (error) {
    console.log({ error });
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

const createManyCash = async (req: ExtendedRequest, res: Response) => {
  try {
    const createIt = req.body as {
      cashInBalance: number;
      cashOutBalance: number;
      note: string;
      requestType: "cashIn" | "cashOut";
      date: Date;
    }[];

    const cash = await prisma.cash.findMany({
      distinct: ["shopOwnerId"],
    });

    console.log(cash);
    return res.json({ success: true, cash });
  } catch (error) {
    console.log({ error });
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

const getAllCash = async (req: ExtendedRequest, res: Response) => {
  try {
    const cash = await prisma.cash.findMany();

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
    console.log({ cashLen: cash.length });
    return res.json({ success: true, cashLen: cash.length, cash });
  } catch (error) {
    console.log({ error });
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

const getTodayCash = async (req: ExtendedRequest, res: Response) => {
  try {
    console.log({
      today: req.params.today,
    });

    const today = req.params.today;
    const startDate = new Date(today);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const cash = await prisma.cash.findMany({
      where: {
        shopOwnerId: req.shopOwner.id,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
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
          },
        ],
      });
    }

    return res.json({ success: true, cash });
  } catch (error) {
    console.log(error);
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

// Get Today Cash In and Cash Out History of Shop Owner

// Get Cash In History of Shop Owner using cash id
const getTodayCashInHistory = async (req: ExtendedRequest, res: Response) => {
  try {
    const today = req.params.today;
    const startDate = new Date(today);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999);

    const cashInHistory = await prisma.cashInHistory.findMany({
      where: {
        shopOwnerId: req.shopOwner.id,
        cashInDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // if cashInHistory is not available then return error
    if (!cashInHistory) {
      return res.status(404).json({
        success: false,
        errors: [
          {
            type: "not found",
            value: "",
            msg: "Cash In History not found",
          },
        ],
      });
    }

    const todayTotalCashIn = cashInHistory.reduce(
      (acc, curr) => acc + curr.cashInAmount,
      0
    );

    return res.json({ success: true, cashInHistory, todayTotalCashIn });
  } catch (error) {
    console.log(error);
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

// Get Cash Out History of Shop Owner using cash id

const getTodayCashOutHistory = async (req: ExtendedRequest, res: Response) => {
  try {
    const today = req.params.today;
    const startDate = new Date(today);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999);

    const cashOutHistory = await prisma.cashOutHistory.findMany({
      where: {
        shopOwnerId: req.shopOwner.id,
        cashOutDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // if cashOutHistory is not available then return error
    if (!cashOutHistory) {
      return res.status(404).json({
        success: false,
        errors: [
          {
            type: "not found",
            value: "",
            msg: "Cash Out History not found",
          },
        ],
      });
    }

    const todayTotalCashOut = cashOutHistory.reduce(
      (acc, curr) => acc + curr.cashOutAmount,
      0
    );

    return res.json({ success: true, cashOutHistory, todayTotalCashOut });
  } catch (error) {
    console.log(error);
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

prisma.$disconnect();
export {
  crateCash,
  getAllCash,
  getTodayCash,
  createManyCash,
  getTodayCashInHistory,
  getTodayCashOutHistory,
};
