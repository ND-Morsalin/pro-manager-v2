import { Router } from "express";

import authRouter from "../controller/shopOwner/routes";
import productsRouter from "../controller/products/routes";
import customersRouter from "../controller/customer/routes";
import paymentHistoryRouter from "./payment-history/routes";
import loanProvidersRouter from "../controller/loneProvider/routes";
import productVoicersRouter from "../controller/productVoicer/routes";
import businessContactRouter from "../controller/businessContactInfo/routes";
import categoriesRouter from "../controller/category/routes";
import cashRouter from "../controller/cash/routes";
import smsRouter from "../controller/sms/routes";
import notesRouter from "../controller/note/routes";
import rawCategoriesRouter from "../controller/rawCategory/routes";
import suppliersRouter from "../controller/supplier/routes";
import reportsRouter from "../controller/report/routes";
const router = Router();

router.use("/auth", authRouter);
router.use("/products", productsRouter);
router.use("/customers", customersRouter);
router.use("/payment-history", paymentHistoryRouter);
router.use("/loan-providers", loanProvidersRouter);
router.use("/product-voicers", productVoicersRouter);
router.use("/business-contact", businessContactRouter);
router.use("/cash", cashRouter);
router.use("/reports", reportsRouter);
// router.use("/product-give-take", productGiveTakeRouter);
router.use("/categories", categoriesRouter);
router.use("/sms", smsRouter);
router.use("/notes", notesRouter);
// router.use("/raw-products", rawProductsRouter);
router.use("/raw-categories", rawCategoriesRouter);
router.use("/suppliers", suppliersRouter);

export default router;
