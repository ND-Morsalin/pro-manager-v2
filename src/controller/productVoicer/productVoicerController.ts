import { Response } from "express";
import { ExtendedRequest } from "../../types/types";
import { SellingProduct } from "@prisma/client";
import prisma from "../../utility/prisma";

// Atomic increment for MongoDB
async function getNextInvoiceId(shopOwnerId: string): Promise<string> {
  const counter = await prisma.invoiceCounter.upsert({
    where: { shopOwnerId },
    update: { lastInvoiceNumber: { increment: 1 } },
    create: {
      shopOwnerId,
      lastInvoiceNumber: 1,
    },
  });

  return counter.lastInvoiceNumber.toString().padStart(6, "0");
}

const createProductVoicer = async (req: ExtendedRequest, res: Response) => {
  try {
    const {
      sellingProducts,
      customerId,
      paidAmount,
      date,
      discountAmount,
      labourCost,
    } = req.body as {
      sellingProducts: (SellingProduct & { dhor?: number })[];
      customerId?: string;
      paidAmount: number;
      date: Date;
      discountAmount?: number;
      labourCost?: number;
    };

    const shopOwnerId = req.shopOwner.id;

    // Get the next invoice ID for tracking purposes
    const invoiceId = await getNextInvoiceId(shopOwnerId);

    // Try to find customer info if customerId is provided
    let customer = null;
    if (customerId) {
      customer = await prisma.customer.findUnique({
        where: { id: customerId, shopOwnerId },
      });
      if (!customer) {
        return res.status(404).json({
          success: false,
          errors: [
            {
              type: "validation error",
              msg: "Customer not found",
              path: "customerId",
            },
          ],
        });
      }
    }

    const sellingProductsData: any[] = []; // Array to hold processed product sales
    let totalProfit = 0; // Tracks total profit for this sale
    let totalLoss = 0; // Tracks total loss for this sale
    let totalBill = 0; // Total bill amount for all products
    let totalInvestment = 0;
    let totalProductsSold = 0;

    // Loop through each product being sold
    for (const item of sellingProducts) {
      const { productId, quantity } = item;
      //  Check if product exists
      const isProductExists = await prisma.product.findUnique({
        where: { id: productId, shopOwnerId },
      });

      if (!isProductExists) {
        return res.status(404).json({
          success: false,
          errors: [
            {
              type: "validation error",
              msg: "Product not found",
            },
          ],
        });
      }
      // check if the product has enough stock
      if (isProductExists.totalStokeAmount < quantity) {
        console.log(`Not enough stock for product ${isProductExists.productName} (ID: ${productId}) 
          available stock: ${isProductExists.totalStokeAmount}, requested quantity: ${quantity}
          shopOwnerId: ${shopOwnerId}
          `);
        //
        return res.status(400).json({
          success: false,
          errors: [
            {
              type: "validation error",
              msg: "Not enough stock for this product",
            },
          ],
        });
      }

      let qtyLeftToSell = quantity; // This helps manage how much more we need to sell from inventory

      // Fetch inventories for this product in FIFO order (latest entries first)
      const inventories = await prisma.inventory.findMany({
        where: { productId, shopOwnerId , stokeAmount:{
          gt:0
        }},
        orderBy: { createdAt: "asc" },
      });

      let productProfit = 0; // Tracks profit from this product
      let productLoss = 0; // Tracks loss from this product
      let investment = 0; // tracks the investment

      // Start deducting inventory using FIFO
      for (const inv of inventories) {
        if (qtyLeftToSell <= 0) break; // If we've fulfilled the sale, break the loop

        const availableQty = inv.stokeAmount;
        const sellQty = Math.min(qtyLeftToSell, availableQty); // Max quantity we can sell from this batch
        const buyingPrice = inv.buyingPrice;

        const priceDiff = isProductExists.currentSellingPrice - buyingPrice; // Profit/Loss per item
        console.log("price diff.", priceDiff);
        investment += buyingPrice * sellQty; // Accumulate investment for this product
        // console.log({
        //   priceDiff,
        //   sellingPrice,
        //   buyingPrice,
        //   sellQty,
        //   productId,
        //   shopOwnerId,
        //   productLoss,
        //   productProfit,
        // });
        if (priceDiff >= 0) {
          productProfit += priceDiff * quantity; // Accumulate profit
        } else {
          // make priceDiff positive for loss calculation
          productLoss += Math.abs(priceDiff) * quantity; // Accumulate loss
          // console.log(
          //   ` ${sellQty} ${quantity} Loss for product ${productName} (ID: ${productId}) at selling price ${sellingPrice} and buying price ${buyingPrice} is ${(+priceDiff) * quantity} testing: ${(Math.abs(priceDiff))}`
          // );
        }

        // Update inventory to reduce stock
        await prisma.inventory.update({
          where: { id: inv.id },
          data: { stokeAmount: { decrement: sellQty } },
        });

        qtyLeftToSell -= sellQty; // Decrease remaining quantity to sell
      }

      totalProfit += productProfit;
      totalLoss += productLoss;
      totalInvestment += investment;
      totalProductsSold += quantity;

      totalBill += quantity * isProductExists.currentSellingPrice; // Calculate total selling price of this product
      // Prepare entry for this sold product
      sellingProductsData.push({
        productId,
        quantity,
        sellingPrice: isProductExists.currentSellingPrice,
        totalPrice: quantity * isProductExists.currentSellingPrice,
        productName: isProductExists.productName,
        shopOwnerId,
        profit: productProfit,
        loss: productLoss,
        unit: isProductExists.unit,
      });
      console.log(
        `individual Total profit:${totalProfit} : ${productProfit} Total loss:${totalLoss} : ${productLoss} `
      );
      // console.log(
      //   `Sold ${quantity} of ${productName} (ID: ${productId}) at ${sellingPrice} each, total: ${
      //     quantity * sellingPrice
      //   }, profit: ${productProfit}, loss: ${productLoss}, investment: ${investment}`
      // );
      // Update overall product tracking fields
      await prisma.product.update({
        where: { id: productId },
        data: {
          totalProfit: { increment: productProfit },
          totalLoss: { increment: productLoss },
          totalStokeAmount: { decrement: quantity },

          totalInvestment: {
            decrement: investment, // reduce the total investment by the amount sold because we are selling it
          },
          totalSold: {
            increment: quantity, // increment the total sold by the quantity sold
          },
        },
      });

      // update dashboard data
    }
    console.log({
      totalLoss: totalLoss,
      totalProfit: totalProfit,
      totalQuantity: totalProductsSold,
    });
    // Create the product voicer record with sale info
    const newProductVoicer = await prisma.productVoicer.create({
      data: {
        customerId: customer?.id || null,
        shopOwnerId,
        totalBillAmount: totalBill,
        paidAmount,
        sellingProducts: { create: sellingProductsData },
        customerName: customer?.customerName || "anonymous",
        address: customer?.address || "anonymous",
        phone: customer?.phoneNumber || "anonymous",
        totalPrice: totalBill,
        beforeDue: customer?.deuAmount || 0,
        labourCost: labourCost || 0,
        nowPaying: paidAmount,
        remainingDue: customer
          ? totalBill -
            paidAmount +
            customer.deuAmount -
            (discountAmount || 0) +
            (labourCost || 0)
          : 0,
        shopOwnerName: req.shopOwner.shopName,
        shopOwnerPhone: req.shopOwner.mobile,
        discountAmount: discountAmount || 0,
        totalLoss: totalLoss,
        totalProfit: totalProfit,
        totalQuantity: totalProductsSold,
      },
      include: { sellingProducts: true },
    });

    // Prepare the cashIn record
    const cashData = {
      cashInAmount: paidAmount,
      cashInFor: `Product sell to ${customer?.customerName || "quick invoice"}`,
      shopOwnerId,
      cashInDate: new Date(date),
    };

    // Update or create cash entry with this income
    const existingCash = await prisma.cash.findUnique({
      where: { shopOwnerId },
    });
    if (existingCash) {
      await prisma.cash.update({
        where: { shopOwnerId },
        data: {
          cashBalance: { increment: paidAmount },
          cashInHistory: { create: cashData },
        },
      });
    } else {
      await prisma.cash.create({
        data: {
          shopOwnerId,
          cashBalance: paidAmount,
          cashInHistory: { create: cashData },
        },
      });
    }

    // Update customer due and payment history if customer involved
    if (customerId) {
      const newDue =
        totalBill - (paidAmount + (discountAmount || 0)) + (labourCost || 0);

      await prisma.customer.update({
        where: { id: customerId, shopOwnerId },
        data: {
          deuAmount: { increment: newDue },
          customerPaymentHistories: {
            create: {
              paymentAmount: paidAmount,
              paymentStatus: "SHOPOWNERGIVE",
              shopOwnerId,
              deuAmount: newDue,
            },
          },
        },
      });
    }

    // Final response with voicer details
    return res.status(200).json({
      success: true,
      message: "Product voicer created successfully",
      voicer: {
        id: newProductVoicer.id,
        invoiceId,
        customerName: customer?.customerName || "anonymous",
        address: customer?.address || "anonymous",
        phone: customer?.phoneNumber || "anonymous",
        products: sellingProductsData,
        totalPrice: totalBill,
        beforeDue: customer?.deuAmount || 0,
        labourCost: labourCost || 0,
        nowPaying: paidAmount,
        remainingDue: customer
          ? totalBill -
            paidAmount +
            customer.deuAmount -
            (discountAmount || 0) +
            (labourCost || 0)
          : "anonymous",
        shopOwnerName: req.shopOwner.shopName,
        shopOwnerPhone: req.shopOwner.mobile,
        date: newProductVoicer.createdAt.toDateString(),
        discountAmount: discountAmount || 0,
        totalProfit,
        totalLoss,
      },
    });
  } catch (error) {
    console.error("Error in createProductVoicer:", error);
    return res.status(500).json({
      success: false,
      errors: [
        {
          type: "server error",
          msg: "Internal server error",
          path: "server",
        },
      ],
    });
  }
};

const getProductVoicersWithoutCustomer = async (
  req: ExtendedRequest,
  res: Response
) => {
  try {
    const { shopOwner } = req;

    // Fetch product voicers without customer associated
    const productVoicersWithoutCustomer = await prisma.productVoicer.findMany({
      where: {
        customerId: null,
        shopOwnerId: shopOwner.id,
      },
      include: {
        sellingProducts: true,
      },
    });

    // Return the result
    return res.status(200).json({
      success: true,
      data: productVoicersWithoutCustomer,
    });
  } catch (error) {
    console.error("Error fetching product voicers without customer:", error);

    // Handle internal server error
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getAllProductVoicer = async (req: ExtendedRequest, res: Response) => {
  try {
    const { customerid } = req.query as { customerid: string };
    const { shopOwner } = req;

    // Fetch product voicers for the given customer ID
    const productVoicers = await prisma.productVoicer.findMany({
      where: {
        shopOwnerId: shopOwner.id,
        customerId: customerid || null, // Handle case where customerId may not be provided
      },
      include: {
        sellingProducts: true,
      },
    });

    // Respond with success and data
    return res.status(200).json({
      success: true,
      data: productVoicers,
    });
  } catch (error) {
    console.error("Error in getAllProductVoicer:", error);

    // Handle server errors
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
    const { id } = req.params;

    // Fetch the product voicer by ID
    const productVoicer = await prisma.productVoicer.findUnique({
      where: { id },
      include: { sellingProducts: true },
    });

    // Handle case where product voicer is not found
    if (!productVoicer) {
      return res.status(404).json({
        success: false,
        errors: [
          {
            type: "validation error",
            value: "",
            msg: "Product voicer not found",
            path: "id",
            location: "getSingleProductVoicer",
          },
        ],
      });
    }

    // Respond with success and the product voicer
    return res.status(200).json({
      success: true,
      data: productVoicer,
    });
  } catch (error) {
    console.error("Error in getSingleProductVoicer:", error);

    // Handle server errors
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
  getProductVoicersWithoutCustomer,
  getAllProductVoicer,
  getSingleProductVoicer,
  //   updateProductVoicer,
  //   deleteProductVoicer,
};
