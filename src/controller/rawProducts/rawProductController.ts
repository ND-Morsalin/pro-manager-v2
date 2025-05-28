import { Request, Response } from "express";
import prisma from "../../utility/prisma";
import qrcode from "qrcode";
import { ExtendedRequest } from "../../types/types";

const addRawProduct = async (req: ExtendedRequest, res: Response) => {
  try {
    const {
      name,
      quantity,
      buyingPrice,
      sellingPrice,
      rawCategoryID,
      brandName,
      unit,
      paidAmount,
      supplierId,
    } = req.body as {
      name: string;
      buyingPrice: number;
      sellingPrice: number;
      quantity: number;
      rawCategoryID: string;
      brandName: string;
      unit: string;
      supplierId?: string;
      paidAmount?: number;
    };

    const rawCategory = await prisma.rawCategory.findUnique({
      where: {
        id: rawCategoryID,
      },
    });
    if (!rawCategory) {
      return res.status(404).json({
        success: false,
        errors: [
          {
            type: "not found",
            value: rawCategoryID,
            msg: "Category not found",
          },
        ],
      });
    }

    const rawProduct = await prisma.rawProduct.create({
      data: {
        name,
        quantity,
        buyingPrice,
        sellingPrice,
        unit,
        shopOwnerId: req.shopOwner.id as string,
        rawCategoryID,
        brandName,
        rawCategory: rawCategory.name,
      },
    });
    if (supplierId) {
          const supplier = await prisma.supplier.findUnique({
            where: {
              id: supplierId,
            },
          });
          if (!supplier) {
            return res.status(404).json({
              success: false,
              errors: [
                {
                  type: "not found",
                  value: supplierId,
                  msg: "Supplier not found",
                  path: "supplierId",
                  location: "addProduct function",
                },
              ],
            });
          }
          const supplierProduct = await prisma.supplierProduct.create({
            data: {
              productId: rawProduct.id,
              supplierId: supplier.id,
              productBrand: rawProduct.brandName,
              quantity: rawProduct.quantity,
              productName: rawProduct.name,
              unit: rawProduct.unit,
              remainingDue: rawProduct.quantity * rawProduct.buyingPrice - paidAmount || 0,
              paidAmount: paidAmount || 0,
              totalPrice: rawProduct.quantity * rawProduct.buyingPrice,
              shopOwnerId: req.shopOwner.id as string,
            },
          });
    
          if (!supplierProduct) {
            return res.status(500).json({
              success: false,
              errors: [
                {
                  type: "server error",
                  value: "",
                  msg: "Internal server error",
                  path: "server",
                  location: "addProduct function",
                },
              ],
            });
          }
        }
    

    return res.status(200).json({
      success: true,
      message: "Product created successfully",
      rawProduct,
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
          location: "addRawProduct function",
        },
      ],
    });
  }
};

const getAllRawProducts = async (req: ExtendedRequest, res: Response) => {
  try {
    const rawProducts = await prisma.rawProduct.findMany({
      where: {
        shopOwnerId: req.shopOwner.id,
      },
    });

    return res.status(200).json({
      success: true,
      message: "All Raw products",
      rawProducts,
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
          location: "getAllRawProducts function",
        },
      ],
    });
  }
};

const getRawSingleProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const rawProduct = await prisma.rawProduct.findUnique({
      where: {
        id: id as string,
      },
    });

    if (!rawProduct) {
      return res.status(404).json({
        success: false,
        errors: [
          {
            type: "not found",
            value: id,
            msg: "Product not found",
            path: "product",
            location: "getRawSingleProduct function",
          },
        ],
      });
    }

    const qrcodeUrl = await qrcode.toDataURL(JSON.stringify(rawProduct));

    return res.status(200).json({
      success: true,
      message: "Product found",
      rawProduct: { ...rawProduct, qrcodeUrl },
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
          location: "getRawSingleProduct function",
        },
      ],
    });
  }
};

const updateRawProduct = async (req: ExtendedRequest, res: Response) => {
  try {
    const { id } = req.params;
    // ! update only stokeAmount, buyingPrice, sellingPrice, unit
    const {
      buyingPrice,
      sellingPrice,
      unit,
      brandName,
      name,
      quantity,
      rawCategoryID,
    } = req.body as {
      name: string;
      buyingPrice: number;
      sellingPrice: number;
      quantity: number;
      rawCategoryID: string;
      brandName: string;
      unit: string;
    };

    const oldRawProduct = await prisma.rawProduct.findUnique({
      where: {
        id,
        shopOwnerId: req.shopOwner.id,
      },
    });
    if (!oldRawProduct) {
      return res.status(404).json({
        success: false,
        errors: [
          {
            type: "not found",
            value: id,
            msg: "Product not found",
          },
        ],
      });
    }
    const rawCategory = await prisma.rawCategory.findUnique({
      where: {
        id: rawCategoryID,
      },
    });
    if (!rawCategory) {
      return res.status(404).json({
        success: false,
        errors: [
          {
            type: "not found",
            value: rawCategoryID,
            msg: "Category not found",
          },
        ],
      });
    }
    // check if the rawCategoryID is changed

    const rawProduct = await prisma.rawProduct.update({
      where: {
        id,
        shopOwnerId: req.shopOwner.id,
      },
      data: {
        // if the value is not provided, it will not be updated
        name: name || oldRawProduct?.name,
        quantity: quantity || oldRawProduct?.quantity,
        buyingPrice: buyingPrice || oldRawProduct?.buyingPrice,
        sellingPrice: sellingPrice || oldRawProduct?.sellingPrice,
        unit: unit || oldRawProduct?.unit,
        brandName: brandName || oldRawProduct?.brandName,
        rawCategoryID: rawCategoryID || oldRawProduct?.rawCategoryID,
        rawCategory: rawCategory.name || oldRawProduct?.rawCategory,
        shopOwnerId: req.shopOwner.id as string,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      rawProduct,
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
          location: "updateRawProduct function",
        },
      ],
    });
  }
};

const deleteRawProduct = async (req: ExtendedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const shopOwnerId = req.shopOwner.id;

    const deletedRawProduct = await prisma.rawProduct.delete({
      where: {
        id,
        shopOwnerId: shopOwnerId as string,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
      deletedRawProduct,
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
          location: "deleteRawProduct function",
        },
      ],
    });
  }
};

// Create a stock history entry (stock in or out)
export const createRawProductHistory = async (req: Request, res: Response) => {
  try {
    const {
      shopOwnerId,
      rawProductId,
      quantityIn = 0,
      quantityOut = 0,
      buyingPrice,
      sellingPrice,
      note,
      transactionDate,
    } = req.body;

    // Get last balance
    const lastEntry = await prisma.rawProductHistory.findFirst({
      where: { rawProductId },
      orderBy: { transactionDate: 'desc' },
    });

    const lastBalance = lastEntry?.balance || 0;
    const newBalance = lastBalance + quantityIn - quantityOut;

    const history = await prisma.rawProductHistory.create({
      data: {
        shopOwnerId,
        rawProductId,
        quantityIn,
        quantityOut,
        balance: newBalance,
        buyingPrice,
        sellingPrice,
        note,
        transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
      },
    });

    res.status(201).json({ success: true, data: history });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Fetch report by date range
export const getRawProductReport = async (req: Request, res: Response) => {
  try {
    const { shopOwnerId } = req.query;
    const { startDate, endDate } = req.body;

    if (!shopOwnerId || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const reports = await prisma.rawProductHistory.findMany({
      where: {
        shopOwnerId: shopOwnerId as string,
        transactionDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: { transactionDate: 'asc' },
      include: {
        rawProduct: true,
      },
    });

    res.status(200).json({ success: true, data: reports });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to get report' });
  }
};
export {
  addRawProduct,
  getAllRawProducts,
  getRawSingleProduct,
  updateRawProduct,
  deleteRawProduct,
};

// raw product to production it will only reduce the quantity of raw product
export const useRawProductForProduction = async (req: ExtendedRequest, res: Response) => {
  try {
    const { rawProductId, quantity } = req.body as {
      rawProductId: string;
      quantity: number;
    };

    const rawProduct = await prisma.rawProduct.findUnique({
      where: {
        id: rawProductId,
        shopOwnerId: req.shopOwner.id,
      },
    });

    if (!rawProduct) {
      return res.status(404).json({
        success: false,
        errors: [
          {
            type: "not found",
            value: rawProductId,
            msg: "Raw product not found",
          },
        ],
      });
    }

    if (rawProduct.quantity < quantity) {
      return res.status(400).json({
        success: false,
        errors: [
          {
            type: "validation error",
            value: "",
            msg: "Insufficient quantity",
          },
        ],
      });
    }

    const updatedRawProduct = await prisma.rawProduct.update({
      where: {
        id: rawProductId,
        shopOwnerId: req.shopOwner.id,
      },
      data: {
        quantity: rawProduct.quantity - quantity,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Raw product used for production successfully",
      updatedRawProduct,
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
          location: "useRawProductForProduction function",
        },
      ],
    });
  }
};
