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
    } = req.body as {
      name: string;
      buyingPrice: number;
      sellingPrice: number;
      quantity: number;
      rawCategoryID: string;
      brandName: string;
      unit: string;
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

export {
  addRawProduct,
  getAllRawProducts,
  getRawSingleProduct,
  updateRawProduct,
  deleteRawProduct,
};
