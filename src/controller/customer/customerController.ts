import { Customer } from "@prisma/client";
import { Response } from "express";
import { ExtendedRequest } from "types/types";
import prisma from "../../utility/prisma";

const addCustomer = async (req: ExtendedRequest, res: Response) => {
  try {
    const {
      address,
      customerName,
      phoneNumber,
      shopOwnerId,
      deuAmount,
      paidAmount,
    } = req.body as Customer;

    const newCustomer = await prisma.customer.create({
      data: {
        address,
        customerName,
        phoneNumber,
        shopOwnerId,
        deuAmount,
        paidAmount,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Customer created successfully",
      customer: newCustomer,
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

// TODO If give customer any stokeAmount then update the paidAmount and deuAmount and create customerPaymentHistory
const updateCustomer = async (req: ExtendedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { address, customerName, phoneNumber, deuAmount, paidAmount } =
      req.body as Customer;

    const updatedCustomer = await prisma.customer.update({
      where: {
        id: id as string,
        shopOwnerId: req.shopOwner.id,
      },
      data: {
        address,
        customerName,
        phoneNumber,
        deuAmount,
        paidAmount,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      customer: updatedCustomer,
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
  getSingleCustomer,
  updateCustomer,
  deleteCustomer,
};
