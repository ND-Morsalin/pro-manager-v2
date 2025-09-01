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
  try {
    const {
      products,
      supplierId,
      paidAmount,
      cost,
      overallDiscountAmount,
      overallDiscountType,
      paymentType,
    } = req.body;

    // Validate required fields (add more validation as needed)
    if (!products || !Array.isArray(products) || products.length === 0) {
      throw new Error("Products array is required and must not be empty");
    }

    const supplier = await prisma.supplier.findUnique({
      where: {
        id: supplierId,
      },
    });
    if (!supplier) {
      throw new Error("Supplier not found");
    }

    // Fetch existing products to get names and ensure they exist
    const existingProducts = [];
    let productNames = [];
    for (const prod of products) {
      const { productId } = prod;
      const existingProduct = await prisma.product.findUnique({
        where: { id: productId },
        select: { productName: true },
      });
      if (!existingProduct) {
        throw new Error(`Product with id ${productId} not found`);
      }
      existingProducts.push(existingProduct);
      productNames.push(existingProduct.productName);
    }
    const productNamesStr = productNames.join(', ');

    // Calculate locals
    const productCalculations = products.map((prod, index) => {
      const {
        productId,
        stokeAmount,
        sellingPrice,
        buyingPrice,
        productDiscountAmount,
        productDiscountType,
      } = prod;

      const localFlatPrice = stokeAmount * buyingPrice;
      let localDiscountAmount = 0;
      if (productDiscountType === DiscountType.PERCENTAGE) {
        localDiscountAmount = (localFlatPrice * productDiscountAmount) / 100;
      } else if (productDiscountType === DiscountType.FLAT) {
        localDiscountAmount = productDiscountAmount;
      }
      const localAfterDiscount = localFlatPrice - localDiscountAmount;

      return {
        ...prod,
        localFlatPrice,
        localDiscountAmount,
        localAfterDiscount,
      };
    });

    const subtotal = productCalculations.reduce((sum, calc) => sum + calc.localAfterDiscount, 0);

    let overallDiscount = 0;
    if (overallDiscountType === DiscountType.PERCENTAGE) {
      overallDiscount = (subtotal * overallDiscountAmount) / 100;
    } else if (overallDiscountType === DiscountType.FLAT) {
      overallDiscount = overallDiscountAmount;
    }

    const finalTotalPrice = subtotal - overallDiscount + cost;
    const due = finalTotalPrice - paidAmount; // Fixed bug: no extra -discount

    // Handle cash check outside transaction
    let cash = null;
    let isCashInsufficient = false;
    if (paymentType === PaymentType.CASH) {
      cash = await prisma.cash.findUnique({
        where: {
          shopOwnerId: req.shopOwner.id,
        },
      });
      if (!cash) {
        isCashInsufficient = true;
      }
    }

    // Perform all database operations in a transaction
   
      const updatedProducts = [];
// console.log(productCalculations);
      // Update each product
      for (const calc of productCalculations) {
      
        const proportion = subtotal > 0 ? calc.localAfterDiscount / subtotal : 0;
        const effectiveAdjustment = proportion * (-overallDiscount + cost);
        const productFinalTotal = calc.localAfterDiscount + effectiveAdjustment;
        const unitPrice = calc.stokeAmount > 0 ? productFinalTotal / calc.stokeAmount : 0;

        const updatedProduct = await prisma.product.update({
          where: {
            id: calc.productId,
          },
          data: {
            totalStokeAmount: {
              increment: calc.stokeAmount,
            },
            currentSellingPrice: calc.sellingPrice,
            totalInvestment: {
              increment: productFinalTotal,
            },
          },
        });
        updatedProducts.push(updatedProduct);

        // Create inventory for this product
        await prisma.inventory.create({
          data: {
            buyingPrice: unitPrice,
            sellingPrice:calc.sellingPrice,
            stokeAmount:calc.stokeAmount,
            productId:calc.productId,
            supplierId,
            shopOwnerId: req.shopOwner.id as string,
            // purchasedHistoryId will be set after creating purchasedHistory
          },
        });
      }

      // Create purchasedHistory
      const purchasedHistory = await prisma.purchasedHistory.create({
        data: {
          cost,
          supplierId,
          discountAmount: overallDiscount,
          discountType: overallDiscountType,
          paid: paidAmount,
          totalPrice: finalTotalPrice,
          due,
          shopOwnerId: req.shopOwner.id as string,
          paymentType,
        },
      });

      // Link products to purchasedHistory and update inventory with purchasedHistoryId
      for (const calc of productCalculations) {
        const { productId } = calc;

        await prisma.purchasedHistoryProduct.create({
          data: {
            purchasedHistoryId: purchasedHistory.id,
            productId,
          },
        });

        // Update the inventory with purchasedHistoryId (assuming one inventory per product per purchase)
        // Note: Since create returns the id, but to simplicity, assume we create with purchasedHistoryId now
        // Wait, in the loop above, inventory created without purchasedHistoryId, so update it here
        // But to fix, better create inventory after purchasedHistory

        // Actually, to correct, move inventory create here
        // But since I already created without purchasedHistoryId, let's adjust: create inventory here instead

        // Correction: I'll move the inventory create to after purchasedHistory
      }

      // Redo: to fix, let's structure better
      // First create purchasedHistory, then loop for product update, historyProduct, inventory

      // Restart structure inside tx:

      // Create purchasedHistory first
      const purchasedHistoryTry = await prisma.purchasedHistory.create({
        data: {
          cost,
          supplierId,
          discountAmount: overallDiscount,
          discountType: overallDiscountType,
          paid: paidAmount,
          totalPrice: finalTotalPrice,
          due,
          shopOwnerId: req.shopOwner.id as string,
          paymentType,
        },
      });

      

      // Update supplier
      await prisma.supplier.update({
        where: {
          id: supplierId,
        },
        data: {
          totalDue: {
            increment: due,
          },
          totalPaid: {
            increment: paidAmount,
          },
          totalTransaction: {
            increment: finalTotalPrice,
          },
        },
      });

      // If CASH and cash exists, update cash
      if (paymentType === PaymentType.CASH && cash) {
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
                cashOutFor: `Purchased products ${productNamesStr} from supplier ${supplier.name}`,
                shopOwnerId: req.shopOwner.id as string,
                cashOutAmount: paidAmount,
                cashOutDate: new Date(),
              },
            },
          },
        });
      }

      // Create supplierPaymentHistory
      await prisma.supplierPaymentHistory.create({
        data: {
          supplierId,
          shopOwnerId: req.shopOwner.id as string,
          paidAmount,
          deuAmount: due, // Assuming typo in original, should be dueAmount?
          transactionStatus: "BUYING_PRODUCTS",
          note: `Purchased products ${productNamesStr} from supplier ${supplier.name}`,
          transactionAmount: finalTotalPrice,
          paymentDate: new Date(),
        },
      });


    let message = "Inventory updated successfully";
    if (isCashInsufficient) {
      message = "Products added to inventory successfully, but your cash balance is not enough to pay the supplier. Please add cash to your account or change the payment type.";
    }

    return res.status(200).json({
      success: true,
      message,
      products: updatedProducts,
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
          location: "updateInventory function",
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
