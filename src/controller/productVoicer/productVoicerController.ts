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
    let customer = null;
    const invoiceId = await getNextInvoiceId(shopOwnerId); // Get sequential ID

    // Fetch customer if customerId is provided
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

    // Calculate total bill
    const totalBill = sellingProducts.reduce(
      (acc, product) => acc + product.totalPrice,
      0
    );

    // Prepare product data for insertion
    const sellingProductsData = sellingProducts.map((product) => ({
      totalPrice: product.sellingPrice * product.quantity,
      shopOwnerId,
      productId: product.productId,
      quantity: product.quantity,
      productName: product.productName,
      sellingPrice: product.sellingPrice,
      unit: product.unit,
    }));

    // Create product voicer
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
        remainingDue: customer?.id
          ? totalBill -
            paidAmount +
            customer.deuAmount -
            (discountAmount || 0) +
            (labourCost || 0)
          : 0,
        shopOwnerName: req.shopOwner.shopName,
        shopOwnerPhone: req.shopOwner.mobile,

        discountAmount: discountAmount || 0,
      },
      include: { sellingProducts: true },
    });
    // Update product stock
    await Promise.all(
      sellingProducts.map((product) =>
        prisma.product.update({
          where: { id: product.productId },
          data: { stokeAmount: { decrement: product.quantity } },
        })
      )
    );

    // Handle cash transactions
    const startTime = new Date(date);
    startTime.setHours(0, 0, 0, 0);

    const endTime = new Date(date);
    endTime.setHours(23, 59, 59, 999);
    const cash = await prisma.cash.findUnique({
      where: { shopOwnerId, createdAt: { gte: startTime, lte: endTime } },
    });

    const cashData = {
      cashInAmount: paidAmount,
      cashInFor: `Product sell to ${customer?.customerName || "quick invoice"}`,
      shopOwnerId,
      cashInDate: new Date(date),
    };

    if (cash) {
      await prisma.cash.update({
        where: { shopOwnerId, createdAt: { gte: startTime, lte: endTime } },
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

    // Update customer dues
    if (customerId) {
      const newDueAmount =
        totalBill - (paidAmount + (discountAmount || 0)) + (labourCost || 0);
      await prisma.customer.update({
        where: { id: customerId, shopOwnerId },
        data: {
          deuAmount: { increment: newDueAmount },
          customerPaymentHistories: {
            create: {
              paymentAmount: paidAmount,
              paymentStatus: "SHOPOWNERGIVE",
              shopOwnerId,
              deuAmount: newDueAmount,
            },
          },
        },
      });
    }

    // Prepare invoice data
    const invoiceData = {
      id: newProductVoicer.id,
      customerName: customer?.customerName || "anonymous",
      address: customer?.address || "anonymous",
      phone: customer?.phoneNumber || "anonymous",
      products: sellingProducts.map((product) => ({
        ...product,
        totalProductPrice: product.sellingPrice * product.quantity,
      })),
      totalPrice: totalBill,
      beforeDue: customer?.deuAmount || 0,
      labourCost: labourCost || 0,
      nowPaying: paidAmount,
      remainingDue: customer?.id
        ? totalBill -
          paidAmount +
          customer.deuAmount -
          (discountAmount || 0) +
          (labourCost || 0)
        : "anonymous",
      shopOwnerName: req.shopOwner.shopName,
      shopOwnerPhone: req.shopOwner.mobile,
      date: newProductVoicer.createdAt.toDateString(),
      invoiceId: invoiceId,
      discountAmount: discountAmount || 0,
    };

    return res.status(200).json({
      success: true,
      message: "Product voicer created successfully",
      voicer: invoiceData,
    });
  } catch (error) {
    console.error("Error in createProductVoicer:", error);
    return res.status(500).json({
      success: false,
      errors: [
        { type: "server error", msg: "Internal server error", path: "server" },
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
