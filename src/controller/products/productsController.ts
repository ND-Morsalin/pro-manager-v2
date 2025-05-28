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
      categoryId,
      productBrand,
      unit,
      supplierId,
      paidAmount,
    } = req.body as {
      productName: string;
      stokeAmount: number;
      buyingPrice: number;
      sellingPrice: number;
      categoryId: string;
      productBrand: string;
      unit: string;
      supplierId?: string;
      paidAmount?: number;
    };

    const category = await prisma.category.findUnique({
      where: {
        id: categoryId,
      },
    });

    const product = await prisma.product.create({
      data: {
        productName,
        stokeAmount,
        buyingPrice,
        sellingPrice,
        productBrand,
        unit,
        shopOwnerId: req.shopOwner.id as string,
        productCategory: category.category,
        productCategoryID: categoryId,
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
          productId: product.id,
          supplierId: supplier.id,
          productBrand: product.productBrand,
          quantity: product.stokeAmount,
          productName: product.productName,
          unit: product.unit,
          remainingDue: product.stokeAmount * product.buyingPrice - paidAmount || 0,
          paidAmount: paidAmount || 0,
          totalPrice: product.stokeAmount * product.buyingPrice,
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
    const {
      stokeAmount,
      buyingPrice,
      sellingPrice,
      unit,
      shopOwnerId,
      productBrand,
      productName,
      productCategory,
      productCategoryID,
    } = req.body as Product;

    const oldProduct = await prisma.product.findUnique({
      where: {
        id,
        shopOwnerId,
      },
    });

    const product = await prisma.product.update({
      where: {
        id,
        shopOwnerId,
      },
      data: {
        // if the value is not provided, it will not be updated
        stokeAmount: stokeAmount || oldProduct?.stokeAmount,
        buyingPrice: buyingPrice || oldProduct?.buyingPrice,
        sellingPrice: sellingPrice || oldProduct?.sellingPrice,
        unit: unit || oldProduct?.unit,
        productBrand: productBrand || oldProduct?.productBrand,
        productName: productName || oldProduct?.productName,
        productCategory: productCategory || oldProduct?.productCategory,
        productCategoryID: productCategoryID || oldProduct?.productCategoryID,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
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
          location: "updateProduct function",
        },
      ],
    });
  }
};

const deleteProduct = async (req: ExtendedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const shopOwnerId = req.shopOwner.id;

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
    console.log(error);
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

const getSellingProductByDate = async (req: ExtendedRequest, res: Response) => {
  try {
    const { dateUTC } = req.body as {
      dateUTC: string;
    };
    // cash will get of date of today
    const startDate = new Date(dateUTC);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(dateUTC);
    endDate.setHours(23, 59, 59, 999);

    const sellingProductsOnThisPeriod = await prisma.sellingProduct.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        shopOwnerId: req.shopOwner.id,
      },
      include: {
        product: true,
      },
    });
    const totalSellingPrice = sellingProductsOnThisPeriod.reduce(
      (acc, curr, index) => {
        return acc + curr.totalPrice;
      },
      0
    );
    const sellingProducts = {
      totalSellingPrice,
      sellingProductsOnThisPeriod,
      date: dateUTC,
    };

    return res.status(200).json({
      success: true,
      message: "Selling products on this period",
      sellingProducts,
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
          location: "getSellingProductByDate",
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
  getSellingProductByDate,
};
