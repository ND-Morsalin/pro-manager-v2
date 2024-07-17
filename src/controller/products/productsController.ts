import { Product } from "@prisma/client";
import { Request, Response } from "express";
import prisma from "../../utility/prisma";
import qrcode from "qrcode";
import { ExtendedRequest } from "../../types/types";

const addProduct = async (req: ExtendedRequest, res: Response) => {
  try {
    const {
      productName,
      stokeAmount,
      buyingPrice,
      sellingPrice,
      productCategory,
      productBrand,
      unit,
    } = req.body as Product;

    const product = await prisma.product.create({
      data: {
        productName,
        stokeAmount,
        buyingPrice,
        sellingPrice,
        productCategory,
        productBrand,
        unit,
        shopOwnerId: req.shopOwner.id as string,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Product created successfully",
      product,
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
          location: "addProduct function",
        },
      ],
    });
  }
};

const getAllProducts = async (req: ExtendedRequest, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        shopOwnerId: req.shopOwner.id,
      },
    });

    return res.status(200).json({
      success: true,
      message: "All products",
      products,
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
          location: "getAllProducts function",
        },
      ],
    });
  }
};

const getSingleProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: {
        id: id as string,
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        errors: [
          {
            type: "not found",
            value: id,
            msg: "Product not found",
            path: "product",
            location: "getSingleProduct function",
          },
        ],
      });
    }

    const qrcodeUrl = await qrcode.toDataURL(JSON.stringify(product));

    return res.status(200).json({
      success: true,
      message: "Product found",
      product: { ...product, qrcodeUrl },
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
          location: "getSingleProduct function",
        },
      ],
    });
  }
};

const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // ! update only stokeAmount, buyingPrice, sellingPrice, unit
    const { stokeAmount, buyingPrice, sellingPrice, unit, shopOwnerId } =
      req.body as Product;

    const product = await prisma.product.update({
      where: {
        id,
        shopOwnerId,
      },
      data: {
        stokeAmount,
        buyingPrice,
        sellingPrice,
        unit,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
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
          location: "updateProduct function",
        },
      ],
    });
  }
};

const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { shopOwnerId } = req.body;

    const deletedProduct = await prisma.product.delete({
      where: {
        id,
        shopOwnerId: shopOwnerId as string,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
      deletedProduct,
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
          location: "deleteProduct function",
        },
      ],
    });
  }
};

export {
  addProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
};
