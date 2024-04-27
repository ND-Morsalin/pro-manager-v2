import { Response } from "express";
import { ExtendedRequest } from "../../types/types";
import { SellingProduct } from "@prisma/client";
import prisma from "../../utility/prisma";

const createProductVoicer = async (req: ExtendedRequest, res: Response) => {
  try {
    const { sellingProducts, customerId } = req.body as {
      sellingProducts: SellingProduct[];
      customerId: string;
    };

    // find user by Customer id
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
            location: "createProductVoicer",
          },
        ],
      });
    }

    const totalBill = sellingProducts.reduce((acc, product) => {
      return acc + product.totalPrice;
    }, 0);

    // create product voicer
    const newProductVoicer = await prisma.productVoicer.create({
      data: {
        customerId,
        shopOwnerId: req.shopOwner.id,
        totalBillAmount: totalBill,
        sellingProducts: {
          create: sellingProducts.map((product) => {
            return {
              ...product,
              totalPrice: product.sellingPrice * product.quantity,
              shopOwnerId: req.shopOwner.id,
            };
          }),
        },
      },
    });

    // update product stoke amount
    for (let product of sellingProducts) {
      await prisma.product.update({
        where: {
          id: product.productId,
        },
        data: {
          stokeAmount: {
            decrement: product.quantity,
          },
        },
      });
    }

    // update cash balance and cash in history

    // check if cash is available or not
    const cash = await prisma.cash.findUnique({
      where: {
        shopOwnerId: req.shopOwner.id,
      },
    });

    if (!cash) {
      await prisma.cash.create({
        data: {
          shopOwnerId: req.shopOwner.id,
          cashBalance: totalBill,
          cashInHistory: {
            create: {
              cashInAmount: totalBill,
              cashInFor: "Product sell",
              shopOwnerId: req.shopOwner.id,
              cashInDate: new Date(),
            },
          },
        },
      });
    }

    // if cash is available then update cash
    await prisma.cash.update({
      where: {
        shopOwnerId: req.shopOwner.id,
      },
      data: {
        cashBalance: {
          increment: totalBill,
        },
        cashInHistory: {
          create: {
            cashInAmount: totalBill,
            cashInFor: "Product sell",
            shopOwnerId: req.shopOwner.id,
            cashInDate: new Date(),
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      productVoicer: newProductVoicer,
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
          location: "createProductVoicer",
        },
      ],
    });
  }
};

const getAllProductVoicer = async (req: ExtendedRequest, res: Response) => {
  try {
  } catch (error) {
    return res.status(500).json({
      success: false,
      errors: [
        {
          type: "server error",
          value: "",
          msg: "Internal server error",
          path: "server",
          location: "getAllProductVoicer",
        },
      ],
    });
  }
};

const getSingleProductVoicer = async (req: ExtendedRequest, res: Response) => {
  try {
  } catch (error) {
    return res.status(500).json({
      success: false,
      errors: [
        {
          type: "server error",
          value: "",
          msg: "Internal server error",
          path: "server",
          location: "getSingleProductVoicer",
        },
      ],
    });
  }
};

const updateProductVoicer = async (req: ExtendedRequest, res: Response) => {
  try {
  } catch (error) {
    return res.status(500).json({
      success: false,
      errors: [
        {
          type: "server error",
          value: "",
          msg: "Internal server error",
          path: "server",
          location: "updateProductVoicer",
        },
      ],
    });
  }
};

const deleteProductVoicer = async (req: ExtendedRequest, res: Response) => {
  try {
  } catch (error) {
    return res.status(500).json({
      success: false,
      errors: [
        {
          type: "server error",
          value: "",
          msg: "Internal server error",
          path: "server",
          location: "deleteProductVoicer",
        },
      ],
    });
  }
};

export {
  createProductVoicer,
  //   getAllProductVoicer,
  //   getSingleProductVoicer,
  //   updateProductVoicer,
  //   deleteProductVoicer,
};
