import { DiscountType, PaymentType } from "@prisma/client";
import { Response } from "express";
import prisma from "../../utility/prisma";
import qrcode from "qrcode";
import { ExtendedRequest } from "../../types/types";
import { AddProductsPayload } from "./products.types";

import { getPagination } from "../../utility/getPaginatin";

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

    // Calculate total investment and unit price
    const totalFlatPrice = stokeAmount * buyingPrice;

    // Calculate discount amount
    let discountAmount = 0;
    if (discountType === DiscountType.PERCENTAGE) {
      discountAmount = (totalFlatPrice * discount) / 100;
    } else if (discountType === DiscountType.FLAT) {
      discountAmount = discount;
    }

    // Calculate final total price (total investment - discount + cost)
    const finalTotalPrice = totalFlatPrice - discountAmount + cost;
    const unitPrice = finalTotalPrice / stokeAmount;

    const product = await prisma.product.create({
      data: {
        productName,
        totalStokeAmount: stokeAmount,
        currentSellingPrice: sellingPrice,
        totalProfit: 0,
        totalLoss: 0,
        totalInvestment: finalTotalPrice,
        productBrand,
        unit,
        shopOwnerId: req.shopOwner.id as string,
        productCategory: category.category,
        productCategoryID: categoryId,
      },
    });

    // Purchased history
    const purchasedHistory = await prisma.purchasedHistory.create({
      data: {
        cost,
        supplierId,
        discountAmount,
        discountType,
        paid: paidAmount,
        totalPrice: finalTotalPrice,
        due: finalTotalPrice - (paidAmount + discountAmount), // Updated due calculation
        shopOwnerId: req.shopOwner.id as string,
        paymentType,
      },
    });
    await prisma.purchasedHistoryProduct.create({
      data: {
        purchasedHistoryId: purchasedHistory.id,
        productId: product.id,
      },
    });
    // create inventory
    const inventory = await prisma.inventory.create({
      data: {
        buyingPrice: unitPrice, // Use unit price
        sellingPrice,
        stokeAmount,
        productId: product.id,
        supplierId,
        shopOwnerId: req.shopOwner.id as string,
        purchasedHistoryId: purchasedHistory.id,
      },
    });

    // Update Supplier
    const updateSupplier = await prisma.supplier.update({
      where: {
        id: supplierId,
      },
      data: {
        totalDue: {
          increment: finalTotalPrice - (paidAmount + discountAmount), // Updated due calculation
        },
        totalPaid: {
          increment: paidAmount, // increment the total paid of supplier
        },
        totalTransaction: {
          increment: finalTotalPrice, // increment the total transaction of supplier
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

    // create a supplier SupplierPaymentHistory
    await prisma.supplierPaymentHistory.create({
      data: {
        supplierId,
        shopOwnerId: req.shopOwner.id as string,
        paidAmount,
        deuAmount: finalTotalPrice - (paidAmount + discountAmount), // Updated due calculation
        transactionStatus: "BUYING_PRODUCTS",
        note: `Purchased products from supplier ${supplier.name}`,
        transactionAmount: finalTotalPrice,
        paymentDate: new Date(),
      },
    });

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
    // Use transaction to ensure all operations succeed or fail together

    const supplier = await prisma.supplier.findUnique({
      where: {
        id: supplierId,
      },
    });
    if (!supplier) {
      // Throw error to be caught outside the transaction
      throw new Error("Supplier not found");
    }

    
    const totalFlatPrice = stokeAmount * buyingPrice;
   
    // calculate discount amount base to totalInvestment
    let discountAmount = 0;
    if (discountType === DiscountType.PERCENTAGE) {
      discountAmount = (totalFlatPrice * discount) / 100;
    } else if (discountType === DiscountType.FLAT) {
      discountAmount = discount;
    }
  const finalTotalPrice = totalFlatPrice - discountAmount + cost;
    const unitPrice = finalTotalPrice / stokeAmount;

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
          increment: finalTotalPrice,
        },
      },
    });

    

    // Purchased history
    const purchasedHistory = await prisma.purchasedHistory.create({
      data: {
        cost,
        supplierId,
        discountAmount,
        discountType,
        paid: paidAmount,
        totalPrice: finalTotalPrice,
        due: finalTotalPrice - (paidAmount + discountAmount), // Updated due calculation
        shopOwnerId: req.shopOwner.id as string,
        paymentType,
      },
    });
    
    await prisma.purchasedHistoryProduct.create({
      data: {
        purchasedHistoryId: purchasedHistory.id,
        productId: product.id,
      },
    });

     // create inventory
    const inventory = await prisma.inventory.create({
      data: {
        buyingPrice: unitPrice, // Use unit price
        sellingPrice,
        stokeAmount,
        productId: product.id,
        supplierId,
        shopOwnerId: req.shopOwner.id as string,
        purchasedHistoryId: purchasedHistory.id,
      },
    });
    // Update Supplier
    const updateSupplier = await prisma.supplier.update({
      where: {
        id: supplierId,
      },
      data: {
        totalDue: {
          increment: finalTotalPrice - (paidAmount + discountAmount), // Updated due calculation
        },
        totalPaid: {
          increment: paidAmount, // increment the total paid of supplier
        },
        totalTransaction: {
          increment: finalTotalPrice, // increment the total transaction of supplier
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
    // create a supplier SupplierPaymentHistory
    await prisma.supplierPaymentHistory.create({
      data: {
        supplierId,
        shopOwnerId: req.shopOwner.id as string,
        paidAmount,
        deuAmount: finalTotalPrice - (paidAmount + discountAmount), // Updated due calculation
        transactionStatus: "BUYING_PRODUCTS",
        note: `Purchased products from supplier ${supplier.name}`,
        transactionAmount: finalTotalPrice,
        paymentDate: new Date(),
      },
    });


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

const updateMultipleProductsInventory = async (
  req: ExtendedRequest,
  res: Response
) => {
  const {
    products,
    supplierId,
    paidAmount,
    discount,
    cost,
    discountType,
    paymentType,
  } = req.body as {
    products: {
      productId: string;
      stokeAmount: number;
      buyingPrice: number;
      sellingPrice: number;
    }[];
    supplierId: string;
    paidAmount: number;
    discount: number;
    cost: number;
    discountType: DiscountType;
    paymentType: PaymentType;
  };

  try {
    // Validate inputs
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        errors: [
          {
            type: "validation",
            value: "",
            msg: "Products array is required and must not be empty",
            path: "products",
            location: "updateMultipleProductsInventory function",
          },
        ],
      });
    }

    // Validate supplier
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
            location: "updateMultipleProductsInventory function",
          },
        ],
      });
    }

    const results = [];

    let totalDashboardInvestment = 0;
    let totalDashboardStock = 0;
    let totalInvestment = 0;

    // Calculate total investment for all products
    for (const productData of products) {
      const { stokeAmount, buyingPrice } = productData;
      totalInvestment += stokeAmount * buyingPrice;
    }

    // Calculate discount amount based on totalInvestment
    let discountAmount = 0;
    if (discountType === DiscountType.PERCENTAGE) {
      discountAmount = (totalInvestment * discount) / 100;
    } else if (discountType === DiscountType.FLAT) {
      discountAmount = discount;
    }

    // Create purchased history (single entry for all products)
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
      },
    });

    // Process each product
    for (const productData of products) {
      const { productId, stokeAmount, buyingPrice, sellingPrice } = productData;

      // Update product
      const product = await prisma.product.update({
        where: {
          id: productId,
        },
        data: {
          totalStokeAmount: {
            increment: stokeAmount,
          },
          currentSellingPrice: sellingPrice,
          totalInvestment: {
            increment: stokeAmount * buyingPrice,
          },
        },
      });

      // Create inventory entry
      const inv = await prisma.inventory.create({
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

      // Create PurchasedHistoryProduct entry to link product to purchased history
      await prisma.purchasedHistoryProduct.create({
        data: {
          purchasedHistoryId: purchasedHistory.id,
          productId: product.id,
          inventoryId: inv.id, // Assuming inventoryId is part of productData
        },
      });

      // Accumulate dashboard updates
      totalDashboardStock += stokeAmount;
      totalDashboardInvestment += stokeAmount * buyingPrice;

      results.push({
        productId,
        success: true,
        message: `Product ${productId} updated successfully`,
        product,
      });
    }

    // Update supplier with totals from all products
    await prisma.supplier.update({
      where: {
        id: supplierId,
      },
      data: {
        totalDue: {
          increment: totalInvestment - paidAmount,
        },
        totalPaid: {
          increment: paidAmount,
        },
        totalTransaction: {
          increment: totalInvestment,
        },
      },
    });

    // Handle cash payment
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
            "Products updated successfully, but cash balance is not enough to pay the supplier",
          results,
        });
      }

      await prisma.cash.update({
        where: {
          shopOwnerId: req.shopOwner.id,
        },
        data: {
          cashBalance: {
            decrement: paidAmount,
          },
          cashOutHistory: {
            create: {
              cashOutFor: `Purchased products from supplier ${supplier.name}`,
              shopOwnerId: req.shopOwner.id as string,
              cashOutAmount: paidAmount,
              cashOutDate: new Date(),
            },
          },
        },
      });
    }

    // create a supplier SupplierPaymentHistory
    await prisma.supplierPaymentHistory.create({
      data: {
        supplierId,
        shopOwnerId: req.shopOwner.id as string,
        paidAmount,
        deuAmount: totalInvestment - paidAmount,
        transactionStatus: "BUYING_PRODUCTS",
        note: `Purchased products from supplier ${supplier.name}`,
        transactionAmount: totalInvestment,
        paymentDate: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Products updated successfully",
      results,
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
          location: "updateMultipleProductsInventory function",
        },
      ],
    });
  }
};
const getAllProducts = async (req: ExtendedRequest, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const { categoryId, search } = req.query as {
    categoryId?: string;
    search?: string;
  };
  try {
    const products = await prisma.product.findMany({
      where: {
        shopOwnerId: req.shopOwner.id,
        ...(categoryId && { productCategoryID: categoryId }),
        ...(search && {
          productName: {
            contains: search,
            mode: "insensitive",
          },
        }),
      },
      include: {
        // inventories: true,
        // only return those inventories have stokeAmount greater than 0
        inventories: {
          where: {
            stokeAmount: {
              gt: 0,
            },
          },
        },
      },
      skip,
      take: limit,
    });

    const count = await prisma.product.count({
      where: {
        shopOwnerId: req.shopOwner.id,
      },
    });

    return res.status(200).json({
      meta: {
        page,
        limit,
        count,
      },
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
    const shopOwnerId = req.shopOwner.id;

    // Check if product exists
    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        shopOwnerId,
      },
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found or you do not have permission to update it.",
      });
    }

    const { categoryId, productBrand, productName, sellingPrice, unit } =
      req.body as Partial<AddProductsPayload>;

    let updateData: any = {
      currentSellingPrice: sellingPrice,
      unit,
      productBrand,
      productName,
    };

    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }

      updateData.productCategoryID = categoryId;
      updateData.productCategory = category.category;
    }

    const product = await prisma.product.update({
      where: {
        id,
      },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("updateProduct error:", error);
    return res.status(500).json({
      success: false,
      errors: [
        {
          type: "server error",
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

    await prisma.$transaction([
      prisma.inventory.deleteMany({
        where: { productId: id, shopOwnerId },
      }),
      prisma.product.delete({
        where: { id },
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
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
  updateMultipleProductsInventory,
};
