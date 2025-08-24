import { Response } from "express";
import { ExtendedRequest } from "../../types/types";
import prisma from "../../utility/prisma";
import { getPagination } from "../../utility/getPaginatin";

import { parseDateRange } from "../../utility/parseDateRange";

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

    const cash = await prisma.cash.findUnique({
      where: {
        shopOwnerId: req.shopOwner.id,
      },
    });

    // If cash doesn't exist, create it with initial balance
    if (!cash) {
      const initialBalance =
        requestType === "cashIn" ? cashInBalance : -cashOutBalance;

      const createdCash = await prisma.cash.create({
        data: {
          shopOwner: { connect: { id: req.shopOwner.id } },
          cashBalance: initialBalance,
          ...(requestType === "cashIn" && {
            cashInHistory: {
              create: {
                cashInAmount: cashInBalance,
                cashInFor: note,
                shopOwnerId: req.shopOwner.id,
                cashInDate: new Date(date),
              },
            },
          }),
          ...(requestType === "cashOut" && {
            cashOutHistory: {
              create: {
                cashOutAmount: cashOutBalance,
                cashOutFor: note,
                shopOwnerId: req.shopOwner.id,
                cashOutDate: new Date(date),
              },
            },
          }),
        },
      });

      return res.status(200).json({
        success: true,
        message: "Initial cash created",
        cash: createdCash,
      });
    }

    // Update existing cash
    const updatedCash = await prisma.cash.update({
      where: {
        shopOwnerId: req.shopOwner.id,
      },
      data: {
        ...(requestType === "cashIn" && {
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
        }),
        ...(requestType === "cashOut" && {
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
        }),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Cash updated successfully",
      updatedCash,
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

// const crateCash = async (req: ExtendedRequest, res: Response) => {
//   try {
//     const { cashInBalance, cashOutBalance, note, requestType, date } =
//       req.body as {
//         cashInBalance: number;
//         cashOutBalance: number;
//         note: string;
//         requestType: "cashIn" | "cashOut";
//         date: Date;
//       };

//     // find cash of the shop owner
//     // cash will get of date of today
//     const startTime = new Date(date);
//     startTime.setHours(0, 0, 0, 0);
//     const endTime = new Date(date);
//     endTime.setHours(23, 59, 59, 999);

//     const cash = await prisma.cash.findUnique({
//       where: {
//         shopOwnerId: req.shopOwner.id,
//         createdAt: {
//           gte: startTime,
//           lte: endTime,
//         },
//       },
//     });
//     // if cash is not available then create cash

//     if (!cash) {
//       let newCash;
//       if (requestType === "cashIn") {
//         /*
//         const newCash = await prisma.cash.create({
//         data: {
//           shopOwnerId: req.shopOwner.id,
//           cashBalance:
//             requestType === "cashIn" ? cashInBalance : -cashOutBalance,
//           cashInHistory: requestType === "cashIn" && {
//             create: {
//               cashInAmount: cashInBalance,
//               cashInFor: note,
//               shopOwnerId: req.shopOwner.id,
//               cashInDate: date || new Date(),
//             },
//           },
//           cashOutHistory: requestType === "cashOut" && {
//             create: {
//               cashOutAmount: cashOutBalance,
//               cashOutFor: note,
//               shopOwnerId: req.shopOwner.id,
//               cashOutDate: new Date(),
//             },
//           },
//         },
//       });
//         */
//         newCash = await prisma.cash.create({
//           data: {
//             cashBalance: cashInBalance,
//             cashInHistory: {
//               create: {
//                 cashInAmount: cashInBalance,
//                 cashInFor: note,
//                 shopOwnerId: req.shopOwner.id,
//                 cashInDate: new Date(date),
//               },
//             },
//             shopOwner: {
//               connect: {
//                 id: req.shopOwner.id,
//               },
//             },
//           },
//         });
//       } else if (requestType === "cashOut") {
//         newCash = await prisma.cash.create({
//           data: {
//             cashBalance: -cashOutBalance,
//             cashOutHistory: {
//               create: {
//                 cashOutAmount: cashOutBalance,
//                 cashOutFor: note,
//                 shopOwnerId: req.shopOwner.id,
//                 cashOutDate: new Date(date),
//               },
//             },
//             shopOwner: {
//               connect: {
//                 id: req.shopOwner.id,
//               },
//             },
//           },
//         });
//       }

//       return res.status(200).json({
//         success: true,
//         message: "cash created",
//         cash: newCash,
//       });
//     }

//     // if cash is available then update cash
//     let updatedCash;
//     if (requestType === "cashIn" && cashInBalance > 0) {
//       updatedCash = await prisma.cash.update({
//         where: {
//           shopOwnerId: req.shopOwner.id,
//         },
//         data: {
//           cashBalance: {
//             increment: cashInBalance,
//           },
//           cashInHistory: {
//             create: {
//               cashInAmount: cashInBalance,
//               cashInFor: note,
//               shopOwnerId: req.shopOwner.id,
//               cashInDate: new Date(date),
//             },
//           },
//         },
//       });
//     } else if (requestType === "cashOut" && cashOutBalance > 0) {
//       updatedCash = await prisma.cash.update({
//         where: {
//           shopOwnerId: req.shopOwner.id,
//         },
//         data: {
//           cashBalance: {
//             decrement: cashOutBalance,
//           },
//           cashOutHistory: {
//             create: {
//               cashOutAmount: cashOutBalance,
//               cashOutFor: note,
//               shopOwnerId: req.shopOwner.id,
//               cashOutDate: new Date(date),
//             },
//           },
//         },
//       });
//     } else {
//       return res.status(400).json({
//         success: false,
//         errors: [
//           {
//             type: "bad request",
//             value: "",
//             msg: "Invalid request",
//           },
//         ],
//       });
//     }

//     // Today Cash
//     const cashNew = await prisma.cash.findUnique({
//       where: {
//         shopOwnerId: req.shopOwner.id,
//         createdAt: {
//           gte: startTime,
//           lte: endTime,
//         },
//       },
//     });

//     // Today Cash In History
//     const cashInHistory = await prisma.cashInHistory.findMany({
//       where: {
//         shopOwnerId: req.shopOwner.id,
//         cashInDate: {
//           gte: startTime,
//           lte: endTime,
//         },
//       },
//     });

//     // Today Cash Out History
//     const cashOutHistory = await prisma.cashOutHistory.findMany({
//       where: {
//         shopOwnerId: req.shopOwner.id,
//         cashOutDate: {
//           gte: startTime,
//           lte: endTime,
//         },
//       },
//     });

//     const todayTotalCashIn = cashInHistory.reduce(
//       (acc, curr) => acc + curr.cashInAmount,
//       0
//     );

//     const todayTotalCashOut = cashOutHistory.reduce(
//       (acc, curr) => acc + curr.cashOutAmount,
//       0
//     );

//     return res.status(200).json({
//       success: true,
//       message: "cash updated successfully",
//       todayCashBalance: cashNew.cashBalance,
//       todayTotalCashOut,
//       todayTotalCashIn,
//       cashInHistory,
//       cashOutHistory,
//     });

//   } catch (error) {
//     console.log({ error });
//     return res.status(500).json({
//       success: false,
//       errors: [
//         {
//           type: "server error",
//           value: "",
//           msg: "Internal server error",
//           path: "server",
//           location: "crateCash",
//         },
//       ],
//     });
//   }

// };

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
  const { page, limit, skip } = getPagination(req);
  try {
    const cash = await prisma.cash.findMany({
      where: {
        shopOwnerId: req.shopOwner.id,
      },
      // include: {
      //   cashInHistory: true,
      //   cashOutHistory: true,
      // },
      skip,
      take: limit,
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
    const count = await prisma.cash.count({
      where: {
        shopOwnerId: req.shopOwner.id,
      },
    });
    res.json({
      meta: {
        page,
        limit,
        count,
      },
      success: true,
      cash,
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
          location: "getAllCash",
        },
      ],
    });
  }
};

const getTodayCash = async (req: ExtendedRequest, res: Response) => {
  try {
    const today = req.params.today;

    const { start, end } = parseDateRange(today);
    const createdAtFilter: any = {};
    if (today) {
      createdAtFilter.gte = start;
      createdAtFilter.lte = end;
    }

    const cash = await prisma.cash.findUnique({
      where: {
        shopOwnerId: req.shopOwner.id,
        ...(today ? { createdAt: createdAtFilter } : {}),
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

    // Today Cash In History
    const cashInHistory = await prisma.cashInHistory.aggregate({
      where: {
        shopOwnerId: req.shopOwner.id,
        ...(today ? { createdAt: createdAtFilter } : {}),
      },
      _sum: {
        cashInAmount: true,
      },
    });

    // Today Cash Out History
    const cashOutHistory = await prisma.cashOutHistory.aggregate({
      where: {
        shopOwnerId: req.shopOwner.id,
        ...(today ? { createdAt: createdAtFilter } : {}),
      },
      _sum: {
        cashOutAmount: true,
      },
    });

    return res.json({
      success: true,
      message: "cash updated successfully",
      todayCashBalance: cash.cashBalance,
      todayTotalCashOut: cashOutHistory._sum.cashOutAmount || 0,
      todayTotalCashIn: cashInHistory._sum.cashInAmount || 0,
    });
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

const getCashBalance = async (req: ExtendedRequest, res: Response) => {
  try {
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const { start } =   parseDateRange(startDate as string);
    const { end } =  parseDateRange(endDate as string);
    const createdAtFilter: any = {};
    if (startDate) {
      createdAtFilter.gte = start; 
    }
    if (endDate) {
      createdAtFilter.let = end; 
    }

    const cash = await prisma.cash.findUnique({
      where: {
        shopOwnerId: req.shopOwner.id,
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

    // Today Cash In History
    const cashInHistory = await prisma.cashInHistory.aggregate({
      where: {
        shopOwnerId: req.shopOwner.id,
        ...(startDate || endDate ? { createdAt: createdAtFilter } : {}),
      },
      _sum: {
        cashInAmount: true,
      },
    });

    // Today Cash Out History
    const cashOutHistory = await prisma.cashOutHistory.aggregate({
      where: {
        shopOwnerId: req.shopOwner.id,
        ...(startDate || endDate ? { createdAt: createdAtFilter } : {}),
      },
      _sum: {
        cashOutAmount: true,
      },
    });

    return res.json({
      success: true,
      message: ` Cash balance for  ${startDate} to ${endDate}`,
      cashBalance: cash.cashBalance,
      totalCashOutDateRange: cashOutHistory._sum.cashOutAmount || 0,
      totalCashInDateRange: cashInHistory._sum.cashInAmount || 0,
    });
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
    const date = req.params.date;
    const { start, end } = parseDateRange(date);
    const { page, limit, skip } = getPagination(req);

    const createdAtFilter: any = {};
    if (date) {
      createdAtFilter.gte = start;
      createdAtFilter.lte = end;
    }

    const [cashInHistory, count, totalCashIn] = await Promise.all([
      prisma.cashInHistory.findMany({
        where: {
          shopOwnerId: req.shopOwner.id,
          ...(date ? { createdAt: createdAtFilter } : {}),
        },
        skip,
        take: limit,
        orderBy: {
          cashInDate: "desc",
        },
      }),
      prisma.cashInHistory.count({
        where: {
          shopOwnerId: req.shopOwner.id,
          ...(date ? { createdAt: createdAtFilter } : {}),
        },
      }),
      prisma.cashInHistory.aggregate({
        where: {
          shopOwnerId: req.shopOwner.id,
        },
        _sum: {
          cashInAmount: true,
        },
      }),
    ]);

    return res.json({
      success: true,
      meta: {
        page,
        limit,
        count,
      },
      cashInHistory,
      totalCashIn: totalCashIn._sum.cashInAmount,
    });
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
    const date = req.params.date;
    const { page, limit, skip } = getPagination(req);

    const { start, end } = parseDateRange(date);
    const createdAtFilter: any = {};
    if (date) {
      createdAtFilter.gte = start;
      createdAtFilter.lte = end;
    }

    const [cashOutHistory, count, totalCashOut] = await Promise.all([
      prisma.cashOutHistory.findMany({
        where: {
          shopOwnerId: req.shopOwner.id,
          ...(date ? { createdAt: createdAtFilter } : {}),
        },
        skip,
        take: limit,
        orderBy: {
          cashOutDate: "desc",
        },
      }),
      prisma.cashOutHistory.count({
        where: {
          shopOwnerId: req.shopOwner.id,
          ...(date ? { createdAt: createdAtFilter } : {}),
        },
      }),
      prisma.cashOutHistory.aggregate({
        where: {
          shopOwnerId: req.shopOwner.id,
        },
        _sum: {
          cashOutAmount: true,
        },
      }),
    ]);

    return res.json({
      success: true,
      meta: {
        page,
        limit,
        count,
      },
      cashOutHistory,
      totalCashOut: totalCashOut._sum.cashOutAmount,
    });
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

export {
  crateCash,
  getAllCash,
  getTodayCash,
  createManyCash,
  getTodayCashInHistory,
  getTodayCashOutHistory,
  getCashBalance
};
