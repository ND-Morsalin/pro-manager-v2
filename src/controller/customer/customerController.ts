import { Customer } from "@prisma/client";
import { Response } from "express";
import { ExtendedRequest } from "types/types";
import prisma from "../../utility/prisma";

const addCustomer = async (req: ExtendedRequest, res: Response) => {
  try {
    const { address, customerName, phoneNumber, deuAmount, paidAmount } =
      req.body as Customer;

    const oldCustomer = await prisma.customer.findUnique({
      where: {
        phoneNumber: phoneNumber as string,
        shopOwnerId: req.shopOwner.id,
      },
    });

    if (oldCustomer) {
      return res.status(400).json({
        success: false,
        errors: [
          {
            type: "validation error",
            value: "",
            msg: "Customer already exist",
            path: "phoneNumber",
            location: "addCustomer function",
          },
        ],
      });
    }

    let newCustomer;

    if (deuAmount > 0) {
      newCustomer = await prisma.customer.create({
        data: {
          address,
          customerName,
          phoneNumber,
          shopOwnerId: req.shopOwner.id,
          deuAmount,
          paidAmount,
          customerPaymentHistories: {
            create: {
              paymentAmount: deuAmount,
              paymentStatus: "SHOPOWNERGIVE",
              shopOwnerId: req.shopOwner.id,
            },
          },
        },
      });
    } else {
      newCustomer = await prisma.customer.create({
        data: {
          address,
          customerName,
          phoneNumber,
          shopOwnerId: req.shopOwner.id,
          deuAmount,
          paidAmount,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Customer created successfully",
      customer: newCustomer,
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
          path: "server",
          location: "addCustomer function",
        },
      ],
    });
  }
};

const getAllCustomers = async (req: ExtendedRequest, res: Response) => {
  try {
    const customers = await prisma.customer.findMany({
      where: {
        shopOwnerId: req.shopOwner.id,
      },
      include: {
        customerPaymentHistories: true,
        invoiceHistory: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "All customers",
      customers,
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
          location: "getAllCustomers function",
        },
      ],
    });
  }
};

const getSingleCustomer = async (req: ExtendedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: {
        id: id as string,
        shopOwnerId: req.shopOwner.id,
      },
    });

    // if customer not found
    if (!customer) {
      return res.status(404).json({
        success: false,
        errors: [
          {
            type: "not found",
            value: "",
            msg: "Customer not found",
          },
        ],
      });
    }

    // if customer found then find all invoice history payment history of this customer
    const invoiceHistory = await prisma.productVoicer.findMany({
      where: {
        customerId: id as string,
        shopOwnerId: req.shopOwner.id,
      },
    });

    const customerPaymentHistory = await prisma.customerPaymentHistory.findMany(
      {
        where: {
          customerId: id as string,
          shopOwnerId: req.shopOwner.id,
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "Single customer",
      customer,
      invoiceHistory,
      customerPaymentHistory,
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
          location: "getSingleCustomer function",
        },
      ],
    });
  }
};

const getSingleCustomerByPhone = async (
  req: ExtendedRequest,
  res: Response
) => {
  try {
    const { phone } = req.params;

    const customer = await prisma.customer.findUnique({
      where: {
        phoneNumber: phone as string,
        shopOwnerId: req.shopOwner.id,
      },
    });

    // if customer not found
    if (!customer) {
      return res.status(404).json({
        success: false,
        errors: [
          {
            type: "not found",
            value: "",
            msg: "Customer not found",
          },
        ],
      });
    }

    // if customer found then find all invoice history payment history of this customer
    const invoiceHistory = await prisma.productVoicer.findMany({
      where: {
        customerId: customer.id,
        shopOwnerId: req.shopOwner.id,
      },
    });

    const customerPaymentHistory = await prisma.customerPaymentHistory.findMany(
      {
        where: {
          customerId: customer.id,
          shopOwnerId: req.shopOwner.id,
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "Single customer by phone number",
      customer,
      invoiceHistory,
      customerPaymentHistory,
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
          location: "getSingleCustomer function",
        },
      ],
    });
  }
};

// TODO If give customer any stokeAmount then update the paidAmount and deuAmount and create customerPaymentHistory
const updateCustomer = async (req: ExtendedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { deuAmount, paidAmount, date, note } = req.body as {
      deuAmount: number;
      paidAmount: number;
      date: string;
      note: string;
    };

    const updatedCustomerDeu =
      deuAmount &&
      (await prisma.customer.update({
        where: {
          id: id as string,
          shopOwnerId: req.shopOwner.id,
        },
        data: {
          deuAmount: {
            increment: deuAmount,
          },
          customerPaymentHistories: {
            create: {
              paymentAmount: deuAmount,
              paymentStatus: "SHOPOWNERGIVE",
              shopOwnerId: req.shopOwner.id,
              note,
            },
          },
        },
      }));

    const updatedCustomerPaid =
      paidAmount &&
      (await prisma.customer.update({
        where: {
          id: id as string,
          shopOwnerId: req.shopOwner.id,
        },
        data: {
          paidAmount: {
            increment: paidAmount,
          },
          deuAmount: {
            decrement: paidAmount,
          },
          customerPaymentHistories: {
            create: {
              paymentAmount: paidAmount,
              paymentStatus: "SHOPOWNERRECIVED",
              shopOwnerId: req.shopOwner.id,
              note,
            },
          },
        },
      }));

    // update cash balance

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
console.log({
  paidAmount,
  cash
})
    if (paidAmount > 0 && cash) {
      await prisma.cash.update({
        where: {
          shopOwnerId: req.shopOwner.id,
          createdAt: {
            gte: startTime,
            lte: endTime,
          },
        },
        data: {
          cashBalance: {
            increment: paidAmount,
          },
          cashInHistory: {
            create: {
              cashInAmount: paidAmount,
              cashInFor: note || "customer give his/her previous deu",
              shopOwnerId: req.shopOwner.id,
            },
          },
        },
      });
    } else if (paidAmount > 0) {
      await prisma.cash.create({
        data: {
          cashBalance: paidAmount,
          cashInHistory: {
            create: {
              cashInAmount: paidAmount,
              cashInFor: note,
              shopOwnerId: req.shopOwner.id,
              cashInDate: new Date(date),
            },
          },
          shopOwner: {
            connect: {
              id: req.shopOwner.id,
            },
          },
        },
      });
    } else if (deuAmount > 0 && cash) {
      await prisma.cash.update({
        where: {
          shopOwnerId: req.shopOwner.id,
          createdAt: {
            gte: startTime,
            lte: endTime,
          },
        },
        data: {
          cashBalance: {
            decrement: deuAmount,
          },
          cashOutHistory: {
            create: {
              cashOutAmount: deuAmount,
              cashOutFor: note,
              shopOwnerId: req.shopOwner.id,
              cashOutDate: new Date(date),
            },
          },
        },
      });
    } else if (deuAmount > 0) {
      await prisma.cash.create({
        data: {
          cashBalance: -deuAmount,
          cashOutHistory: {
            create: {
              cashOutAmount: deuAmount,
              cashOutFor: note,
              shopOwnerId: req.shopOwner.id,
              cashOutDate: new Date(date),
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

    const customer = await prisma.customer.findUnique({
      where: {
        shopOwnerId: req.shopOwner.id,
        id,
      },
      include:{
        customerPaymentHistories: true,
        invoiceHistory: true,
      }
    });

    return res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      customer,
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
          path: "server",
          location: "updateCustomer function",
        },
      ],
    });
  }
};

const deleteCustomer = async (req: ExtendedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const deletedCustomer = await prisma.customer.delete({
      where: {
        id: id as string,
        shopOwnerId: req.shopOwner.id,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
      customer: deletedCustomer,
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
          location: "deleteCustomer function",
        },
      ],
    });
  }
};

export {
  addCustomer,
  getAllCustomers,
  getSingleCustomerByPhone,
  getSingleCustomer,
  updateCustomer,
  deleteCustomer,
};
