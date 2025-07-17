// import fs from "fs";
// import path from "path";
// import Handlebars from "handlebars";

// import puppeteer from "puppeteer";
// import { ExtendedRequest } from "../types/types";
// import { Response } from "express";

// const createPdf = async (req: ExtendedRequest, res: Response) => {
//   const data = {
//     customerName: "John Doe",
//     age: 28,
//     address: "123, Main St, Springfield, IL",
//     phone: "123-456-7890",
//     products: [
//       { name: "Product 1", price: 100, quantity: 2 },
//       { name: "Product 2", price: 200, quantity: 1 },
//       { name: "Product 3", price: 300, quantity: 1 },
//     ],
//     totalPrice: 600,
//     beforeDue: 500,
//     totalDue: 100,
//     nowPaying: 100,
//     remainingDue: 10,
//   };

//   // Compile Handlebars template
//   const hbsFileName = path.join(__dirname, "../utility/invoice_template.hbs");
//   const source = fs.readFileSync(hbsFileName, "utf8");
//   const template = Handlebars.compile(source);
//   const html = template(data);

//   // console.log(html);
//   const browser = await puppeteer.launch();
//   const page = await browser.newPage();

//   // Set content to the page
//   await page.setContent(html);

//   // Generate PDF
//   const pdfBuffer = await page.pdf({
//     format: "A6",
//     width: "3in",
//     height: "auto",
//   });

//   // Close browser
//   await browser.close();

//   // send pdf to the client

//   res.setHeader("Content-Type", "application/pdf");
//   res.setHeader("Content-Disposition", "attachment; filename=invoice.pdf");
//   res.send(pdfBuffer);
// };
// export default createPdf;
