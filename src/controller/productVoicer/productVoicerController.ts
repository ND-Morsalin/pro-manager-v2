import { Response } from "express";
import { ExtendedRequest } from "../../types/types";
import { SellingProduct } from "@prisma/client";
import prisma from "../../utility/prisma";
import fs from "fs";
import path from "path";
import Handlebars from "handlebars";

import puppeteer from "puppeteer";
const createProductVoicer = async (req: ExtendedRequest, res: Response) => {
  try {
    const { sellingProducts, customerId, paidAmount } = req.body as {
      sellingProducts: SellingProduct[];
      customerId: string;
      paidAmount: number;
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
        paidAmount,
        remainingDue: totalBill - paidAmount + customer.deuAmount,
        sellingProducts: {
          create: sellingProducts.map((product) => {
            return {
              totalPrice: product.sellingPrice * product.quantity,
              shopOwnerId: req.shopOwner.id,
              productId: product.productId,
              quantity: product.quantity,
              productName: product.productName,
              sellingPrice: product.sellingPrice,
              unit: product.unit,
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
              cashInAmount: paidAmount,
              cashInFor: `Product sell to ${customer.customerName}`,
              shopOwnerId: req.shopOwner.id,
              cashInDate: new Date(),
            },
          },
        },
      });
    } else {
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
    }
    // update customer due balance
    await prisma.customer.update({
      where: {
        id: customerId,
        shopOwnerId: req.shopOwner.id,
      },
      data: {
        deuAmount: {
          increment: totalBill - paidAmount,
        },
        customerPaymentHistories: {
          create: {
            paymentAmount: totalBill - paidAmount,
            paymentStatus: "SHOPOWNERGIVE",
            shopOwnerId: req.shopOwner.id,
          },
        },
      },
    });

    const data = {
      customerName: customer.customerName,
      address: customer.address,
      phone: customer.phoneNumber,
      products: sellingProducts,
      totalPrice: totalBill,
      beforeDue: customer.deuAmount,
      nowPaying: paidAmount,
      remainingDue: totalBill - paidAmount + customer.deuAmount,
    };

    // Compile Handlebars template
    const hbsFileName = path.join(__dirname, "/template/invoice_template.hbs");
    const source = fs.readFileSync(hbsFileName, "utf8");
    const template = Handlebars.compile(source);
    const html = template(data);

    // console.log(html);
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Set content to the page
    await page.setContent(html);

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A6",
      width: "3in",
      height: "auto",
    });

    // Close browser
    await browser.close();

    // send pdf to the client

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=invoice.pdf");
    res.send(pdfBuffer);
    /* 
    return res.status(200).json({
      success: true,
      productVoicer: newProductVoicer,
    }); */
  } catch (error) {
    console.log({
      error,
      line: 195,
    });
    return res.status(500).json({
      success: false,
      obj: error,
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
