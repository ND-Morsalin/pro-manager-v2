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

    return res.status(200).json({
      success: true,
      message: "Single customer",
      customer,
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

const getSingleCustomerByPhone = async (req: ExtendedRequest, res: Response) => {
  try {
    const { phone } = req.params;

    const customer = await prisma.customer.findUnique({
      where: {
        phoneNumber: phone as string,
        shopOwnerId: req.shopOwner.id,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Single customer by phone number",
      customer,
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
    const { deuAmount, paidAmount } = req.body as Customer;

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
          paidAmount,
          customerPaymentHistories: {
            create: {
              paymentAmount: deuAmount,
              paymentStatus: "SHOPOWNERGIVE",
              shopOwnerId: req.shopOwner.id,
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
          customerPaymentHistories: {
            create: {
              paymentAmount: paidAmount,
              paymentStatus: "SHOPOWNERRECIVED",
              shopOwnerId: req.shopOwner.id,
            },
          },
        },
      }));

    // update cash balance
    const cash = await prisma.cash.findUnique({
      where: {
        shopOwnerId: req.shopOwner.id,
      },
    });

    if (paidAmount > 0 && cash) {
      await prisma.cash.update({
        where: {
          shopOwnerId: req.shopOwner.id,
        },
        data: {
          cashBalance: {
            increment: paidAmount,
          },
          cashInHistory: {
            create: {
              cashInAmount: paidAmount,
              cashInFor: "customer give his/her previous deu",
              shopOwnerId: req.shopOwner.id,
            },
          },
        },
      });
    } else if (paidAmount > 0) {
      await prisma.cash.create({
        data: {
          cashBalance: paidAmount,
          shopOwnerId: req.shopOwner.id,
          cashInHistory: {
            create: {
              cashInAmount: paidAmount,
              cashInFor: `Customer give his/her previous due `,
              shopOwnerId: req.shopOwner.id,
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
