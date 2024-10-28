import { Response } from "express";
import { ExtendedRequest } from "../../types/types";
import { SellingProduct } from "@prisma/client";
import prisma from "../../utility/prisma";
import fs from "fs";
import path from "path";
import Handlebars from "handlebars";

import puppeteer from "puppeteer";
// import purchaseConfirmBySms from "../../utility/purchaseConfirmBySms";

// Outside the function, at the top of your file
let browser;

(async () => {
  browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
})();

const createProductVoicer = async (req: ExtendedRequest, res: Response) => {
  try {
    const { sellingProducts, customerId, paidAmount, date, discountAmount } =
      req.body as {
        sellingProducts: SellingProduct[];
        customerId: string;
        paidAmount: number;
        date: Date;
        discountAmount: number | undefined;
      };
console.log({
  body: req.body,
})
    // find user by Customer id
    const customer = await prisma.customer.findUnique({
      where: {
        id: customerId,
        shopOwnerId: req.shopOwner.id,
      },
    });
    console.log({
      customer,
      customerId,
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
        remainingDue:
          totalBill - paidAmount + customer.deuAmount - discountAmount,
        discountAmount,
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

    // cash will get of date of today
    const startTime = new Date(date);
    startTime.setHours(0, 0, 0, 0);
    const endTime = new Date(date);
    endTime.setHours(23, 59, 59, 999);

    // update cash balance and cash in history

    // check if cash is available or not
    const cash = await prisma.cash.findUnique({
      where: {
        shopOwnerId: req.shopOwner.id,
        createdAt: {
          gte: startTime,
          lte: endTime,
        },
      },
    });

    if (!cash) {
      await prisma.cash.create({
        data: {
          shopOwnerId: req.shopOwner.id,
          cashBalance: paidAmount,
          cashInHistory: {
            create: {
              cashInAmount: paidAmount,
              cashInFor: `Product sell to ${customer.customerName}`,
              shopOwnerId: req.shopOwner.id,
              cashInDate: new Date(date),
            },
          },
        },
      });
    } else {
      // if cash is available then update cash
      await prisma.cash.update({
        where: {
          shopOwnerId: req.shopOwner.id,
          createdAt: {
            gte: startTime,
            lte: endTime,
          },
        },
        data: {
          cashBalance: {
            increment: paidAmount,
          },
          cashInHistory: {
            create: {
              cashInAmount: paidAmount,
              cashInFor: "Product sell",
              shopOwnerId: req.shopOwner.id,
              cashInDate: new Date(date),
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
          increment: totalBill - (paidAmount + discountAmount),
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

    // ... (previous code remains unchanged)
    const pdfProductData = sellingProducts.map((product) => ({
      ...product,
      totalProductPrice: product.sellingPrice * product.quantity,
    }));

    const data = {
      customerName: customer.customerName,
      address: customer.address,
      phone: customer.phoneNumber,
      products: pdfProductData,
      totalPrice: totalBill,
      beforeDue: customer.deuAmount,
      nowPaying: paidAmount,
      remainingDue: (totalBill + customer.deuAmount) - (paidAmount + discountAmount),
      shopOwnerName: req.shopOwner.shopName,
      shopOwnerPhone: req.shopOwner.mobile,
      date: newProductVoicer.createdAt.toDateString(),
      // invoiceId will be 6 digit
      invoiceId: newProductVoicer.id.toString().slice(0, 10),
      discountAmount: discountAmount ||0 ,
    };

    // send message to customer
    // purchaseConfirmBySms({
    //   mobile: customer.phoneNumber,
    //   totalAmount: totalBill,
    //   dueAmount: totalBill - paidAmount + customer.deuAmount,
    //   shopName: req.shopOwner.shopName,
    // });
    // send message to customer end

    // Register Handlebars helpers (this can be outside the function if reused across requests)
    Handlebars.registerHelper("incrementedIndex", function (index) {
      return index + 1;
    });
    Handlebars.registerHelper("isBengali", function (text) {
      const bengaliRegex = /[\u0980-\u09FF]/;
      return bengaliRegex.test(text) ? "bengali" : "english";
    });

    // Compile Handlebars template
    const hbsFileName = path.join(
      __dirname,
      "../../utility/invoice_template.hbs"
    );
    const source = fs.readFileSync(hbsFileName, "utf8");
    const template = Handlebars.compile(source);
    const html = template(data);

    // Optimized Puppeteer launch and PDF generation
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    // Inside the createProductVoicer function
    const page = await browser.newPage();
    await page.setRequestInterception(true);

    page.on("request", (request) => {
      if (["image", "stylesheet", "font"].includes(request.resourceType())) {
        request.abort();
      } else {
        request.continue();
      }
    });

    await page.setContent(html);

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await page.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=invoice.pdf");
    res.send(pdfBuffer);
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
