import { Response } from "express";
import { ExtendedRequest } from "../../types/types";
import prisma from "../../utility/prisma";
import { CustomerPaymentHistory } from "@prisma/client";

const createCustomerPaymentHistory = async (
  req: ExtendedRequest,
  res: Response
) => {
  try {
    const { paymentDate, paymentStatus, paymentAmount, customerId } =
      req.body as CustomerPaymentHistory;

    const customer = await prisma.customer.findUnique({
      where: {
        id: customerId,
        shopOwnerId: req.shopOwner.id,
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        errors: [
          {
            type: "validation error",
            value: "",
            msg: "Customer not found",
            path: "customerId",
            location: "createCustomerPaymentHistory",
          },
        ],
      });
    }

    const newPaymentHistory = await prisma.customerPaymentHistory.create({
      data: {
        paymentDate,
        paymentStatus,
        paymentAmount,
        shopOwnerId: req.shopOwner.id,
        customerId,
      },
    });

    return res.status(201).json({
      success: true,
      newPaymentHistory,
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
          location: "createCustomerPaymentHistory",
        },
      ],
    });
  }
};

const getAllCustomerPaymentHistory = async (
  req: ExtendedRequest,
  res: Response
) => {
  try {
    const { customerId } = req.query as { customerId: string };
    const customer = await prisma.customer.findUnique({
      where: {
        id: customerId,
        shopOwnerId: req.shopOwner.id,
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        errors: [
          {
            type: "validation error",
            value: "",
            msg: "Customer not found",
            path: "customerId",
            location: "getAllCustomerPaymentHistory",
          },
        ],
      });
    }

    const paymentHistory = await prisma.customerPaymentHistory.findMany({
      where: {
        customerId,
        shopOwnerId: req.shopOwner.id,
      },
    });

    return res.status(200).json({
      success: true,
      paymentHistory,
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
          location: "getAllCustomerPaymentHistory",
        },
      ],
    });
  }
};

const getSingleCustomerPaymentHistory = async (
  req: ExtendedRequest,
  res: Response
) => {
  try {
    const { customerId, paymentHistoryId } = req.query as {
      customerId: string;
      paymentHistoryId: string;
    };
    const customer = await prisma.customer.findUnique({
      where: {
        id: customerId,
        shopOwnerId: req.shopOwner.id,
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        errors: [
          {
            type: "validation error",
            value: "",
            msg: "Customer not found",
            path: "customerId",
            location: "getSingleCustomerPaymentHistory",
          },
        ],
      });
    }

    const paymentHistory = await prisma.customerPaymentHistory.findUnique({
      where: {
        id: paymentHistoryId,
        customerId,
        shopOwnerId: req.shopOwner.id,
      },
    });

    if (!paymentHistory) {
      return res.status(404).json({
        success: false,
        errors: [
          {
            type: "validation error",
            value: "",
            msg: "Payment history not found",
            path: "paymentHistoryId",
            location: "getSingleCustomerPaymentHistory",
          },
        ],
      });
    }

    return res.status(200).json({
      success: true,
      paymentHistory,
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
          location: "getSingleCustomerPaymentHistory",
        },
      ],
    });
  }
};

const updateCustomerPaymentHistory = async (
  req: ExtendedRequest,
  res: Response
) => {
  try {
    const { paymentDate, paymentStatus, paymentAmount, customerId } =
      req.body as CustomerPaymentHistory;
    const { paymentHistoryId } = req.query as { paymentHistoryId: string };

    const customer = await prisma.customer.findUnique({
      where: {
        id: customerId,
        shopOwnerId: req.shopOwner.id,
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        errors: [
          {
            type: "validation error",
            value: "",
            msg: "Customer not found",
            path: "customerId",
            location: "updateCustomerPaymentHistory",
          },
        ],
      });
    }

    const paymentHistory = await prisma.customerPaymentHistory.findUnique({
      where: {
        id: paymentHistoryId,
        customerId,
        shopOwnerId: req.shopOwner.id,
      },
    });

    if (!paymentHistory) {
      return res.status(404).json({
        success: false,
        errors: [
          {
            type: "validation error",
            value: "",
            msg: "Payment history not found",
            path: "paymentHistoryId",
            location: "updateCustomerPaymentHistory",
          },
        ],
      });
    }

    const updatedPaymentHistory = await prisma.customerPaymentHistory.update({
      where: {
        id: paymentHistoryId,
      },
      data: {
        paymentDate,
        paymentStatus,
        paymentAmount,
      },
    });

    return res.status(200).json({
      success: true,
      updatedPaymentHistory,
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
          location: "updateCustomerPaymentHistory",
        },
      ],
    });
  }
};

const deleteCustomerPaymentHistory = async (
  req: ExtendedRequest,
  res: Response
) => {
  try {
    const { customerId, paymentHistoryId } = req.query as {
      customerId: string;
      paymentHistoryId: string;
    };

    const customer = await prisma.customer.findUnique({
      where: {
        id: customerId,
        shopOwnerId: req.shopOwner.id,
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        errors: [
          {
            type: "validation error",
            value: "",
            msg: "Customer not found",
            path: "customerId",
            location: "deleteCustomerPaymentHistory",
          },
        ],
      });
    }

    const paymentHistory = await prisma.customerPaymentHistory.findUnique({
      where: {
        id: paymentHistoryId,
        customerId,
        shopOwnerId: req.shopOwner.id,
      },
    });

    if (!paymentHistory) {
      return res.status(404).json({
        success: false,
        errors: [
          {
            type: "validation error",
            value: "",
            msg: "Payment history not found",
            path: "paymentHistoryId",
            location: "deleteCustomerPaymentHistory",
          },
        ],
      });
    }

    await prisma.customerPaymentHistory.delete({
      where: {
        id: paymentHistoryId,
      },
    });

    return res.status(200).json({
      success: true,
      msg: "Payment history deleted successfully",
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
          location: "deleteCustomerPaymentHistory",
        },
      ],
    });
  }
};

export {
  createCustomerPaymentHistory,
  getAllCustomerPaymentHistory,
  getSingleCustomerPaymentHistory,
  updateCustomerPaymentHistory,
  deleteCustomerPaymentHistory,
};
