import { DiscountType, PaymentType } from "@prisma/client";
import { Response } from "express";
import prisma from "../../utility/prisma";
import qrcode from "qrcode";
import { ExtendedRequest } from "../../types/types";
import { AddProductsPayload } from "./products.types";
import { getOrCreateDashboard } from "../../utility/getOrCreateDashboard";

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
      discount,
      cost,
      discountType,
      paymentType,
    } = req.body as AddProductsPayload;

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

    const category = await prisma.category.findUnique({
      where: {
        id: categoryId,
      },
    });
    const totalInvestment = stokeAmount * buyingPrice;
    const product = await prisma.product.create({
      data: {
        productName,
        totalStokeAmount: stokeAmount,
        currentSellingPrice: sellingPrice,

        totalProfit: 0,
        totalLoss: 0,
        totalInvestment,
        productBrand,
        unit,
        shopOwnerId: req.shopOwner.id as string,
        productCategory: category.category,
        productCategoryID: categoryId,
      },
    });

    // calculate discount amount base to totalInvestment
    let discountAmount = 0;
    if (discountType === DiscountType.PERCENTAGE) {
      discountAmount = (totalInvestment * discount) / 100;
    } else if (discountType === DiscountType.FLAT) {
      discountAmount = discount;
    }

    // Purchased history
    const purchasedHistory = await prisma.purchasedHistory.create({
      data: {
        cost,
        supplierId,
        discountAmount,
        discountType,
        paid: paidAmount,
        totalPrice: totalInvestment,
        due: totalInvestment - paidAmount,
        shopOwnerId: req.shopOwner.id as string,
        paymentType,
        productId: product.id, // link the purchased history to the product
      },
    });

    // create inventory
    const inventory = await prisma.inventory.create({
      data: {
        buyingPrice,
        sellingPrice,
        stokeAmount,
        productId: product.id,
        supplierId,
        shopOwnerId: req.shopOwner.id as string,
        purchasedHistoryId: purchasedHistory.id,
      },
    });
     // Update Dashboard
    const currentDate = new Date();
   const dashboard =  await getOrCreateDashboard(req.shopOwner.id, currentDate);
    await prisma.dashboard.update({
      where: {
        id: dashboard.id,
      },
      data: {
        totalProductsOnStock: { increment: stokeAmount },
        totalDueToSuppliers: { increment: totalInvestment - paidAmount },
        totalInvestments: { increment: totalInvestment }
      }
    });

    // Update Supplier
    const updateSupplier = await prisma.supplier.update({
      where: {
        id: supplierId,
      },
      data: {
        totalDue: {
          increment: purchasedHistory.due || 0, // increment the total due of supplier
        },
        totalPaid: {
          increment: purchasedHistory.paid || 0, // increment the total paid of supplier
        },
        totalTransaction: {
          increment: totalInvestment, // increment the total transaction of supplier
        },
      },
    });

    // if payment type is CASH then it will reduce CASH balance

    if (paymentType === PaymentType.CASH) {
      const cash = await prisma.cash.findUnique({
        where: {
          shopOwnerId: req.shopOwner.id,
        },
      });
      if (!cash) {
        return res.status(200).json({
          success: true,
          message:
            "Product created successfully, But on your cash balance is not enough to pay the supplier please add cash to your account or change the payment type your product purchase and it already added to your inventory",
          product,
        });
      } else {
        const cash = await prisma.cash.update({
          where: {
            shopOwnerId: req.shopOwner.id,
          },
          data: {
            cashBalance: {
              decrement: paidAmount,
            },
            cashOutHistory: {
              create: {
                cashOutFor: `Purchased product ${productName} from supplier ${supplier.name}`,
                shopOwnerId: req.shopOwner.id as string,
                cashOutAmount: paidAmount,
                cashOutDate: new Date(),
              },
            },
          },
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Product created successfully",
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
          location: "addProduct function",
        },
      ],
    });
  }
};

const updateInventory = async (req: ExtendedRequest, res: Response) => {
  const { id } = req.params; // product id
  try {
    const {
      stokeAmount,
      buyingPrice,
      sellingPrice,
      supplierId,
      paidAmount,
      discount,
      cost,
      discountType,
      paymentType,
    } = req.body as AddProductsPayload;
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
    const totalInvestment = stokeAmount * buyingPrice;
    const product = await prisma.product.update({
      where: {
        id,
      },
      data: {
        totalStokeAmount: {
          increment: stokeAmount,
        },
        currentSellingPrice: sellingPrice,
        totalInvestment: {
          increment: totalInvestment,
        },
      },
    });

    // calculate discount amount base to totalInvestment
    let discountAmount = 0;
    if (discountType === DiscountType.PERCENTAGE) {
      discountAmount = (totalInvestment * discount) / 100;
    } else if (discountType === DiscountType.FLAT) {
      discountAmount = discount;
    }

    // Purchased history
    const purchasedHistory = await prisma.purchasedHistory.create({
      data: {
        cost,
        supplierId,
        discountAmount,
        discountType,
        paid: paidAmount,
        totalPrice: totalInvestment,
        due: totalInvestment - paidAmount,
        shopOwnerId: req.shopOwner.id as string,
        paymentType,
        productId: product.id, // link the purchased history to the product
      },
    });

    // create inventory
    const inventory = await prisma.inventory.create({
      data: {
        buyingPrice,
        sellingPrice,
        stokeAmount,
        productId: product.id,
        supplierId,
        shopOwnerId: req.shopOwner.id as string,
        purchasedHistoryId: purchasedHistory.id,
      },
    });
  // Update Dashboard
    const currentDate = new Date();
   const dashboard =  await getOrCreateDashboard(req.shopOwner.id, currentDate);
    await prisma.dashboard.update({
      where: {
        id: dashboard.id,
      },
      data: {
        totalProductsOnStock: { increment: stokeAmount },
        totalDueToSuppliers: { increment: totalInvestment - paidAmount },
        totalInvestments: { increment: totalInvestment }
      }
    });

    // Update Supplier
    const updateSupplier = await prisma.supplier.update({
      where: {
        id: supplierId,
      },
      data: {
        totalDue: {
          increment: purchasedHistory.due || 0, // increment the total due of supplier
        },
        totalPaid: {
          increment: purchasedHistory.paid || 0, // increment the total paid of supplier
        },
        totalTransaction: {
          increment: totalInvestment, // increment the total transaction of supplier
        },
      },
    });

    // if payment type is CASH then it will reduce CASH balance

    if (paymentType === PaymentType.CASH) {
      const cash = await prisma.cash.findUnique({
        where: {
          shopOwnerId: req.shopOwner.id,
        },
      });
      if (!cash) {
        return res.status(200).json({
          success: true,
          message:
            "Product created successfully, But on your cash balance is not enough to pay the supplier please add cash to your account or change the payment type your product purchase and it already added to your inventory",
          product,
        });
      } else {
        const cash = await prisma.cash.update({
          where: {
            shopOwnerId: req.shopOwner.id,
          },
          data: {
            cashBalance: {
              decrement: paidAmount,
            },
            cashOutHistory: {
              create: {
                cashOutFor: `Purchased product ${updateProduct.name} from supplier ${supplier.name}`,
                shopOwnerId: req.shopOwner.id as string,
                cashOutAmount: paidAmount,
                cashOutDate: new Date(),
              },
            },
          },
        });
      }
    }
    return res.status(200).json({
      success: true,
      message: "Product created successfully",
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
      include: {
        inventories: true,
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

const getSingleProduct = async (req: ExtendedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: {
        id: id as string,
      },
      include: {
        inventories: true,
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

const updateProduct = async (req: ExtendedRequest, res: Response) => {
  try {
    const { id } = req.params;
    // ! update only stokeAmount, buyingPrice, sellingPrice, unit
    const { categoryId, productBrand, productName, sellingPrice, unit } =
      req.body as Partial<AddProductsPayload>;

    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: {
          id: categoryId,
        },
      });

      const product = await prisma.product.update({
        where: {
          id,
          shopOwnerId: req.shopOwner.id,
        },
        data: {
          // if the value is not provided, it will not be updated
          currentSellingPrice: sellingPrice,
          unit: unit,
          productBrand: productBrand,
          productName: productName,
          productCategoryID: categoryId,
          productCategory: category.category,
        },
      });

      return res.status(200).json({
        success: true,
        message: "Product updated successfully",
        product,
      });
    }

    const product = await prisma.product.update({
      where: {
        id,
        shopOwnerId: req.shopOwner.id,
      },
      data: {
        // if the value is not provided, it will not be updated
        currentSellingPrice: sellingPrice,
        unit: unit,
        productBrand: productBrand,
        productName: productName,
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
  updateInventory,
};
