import { Router } from "express";

import authRouter from "./auth/routes";
import productsRouter from "./products/routes";
import customersRouter from "./customers/routes";
import paymentHistoryRouter from "./payment-history/routes";
import loanProvidersRouter from "./loan-providers/routes";
import productVoicersRouter from "./product-voicers/routes";
import businessContactRouter from "./business-contact/routes";
import cashRouter from "./cash/routes";
import reportsRouter from "./reports/routes";
import productGiveTakeRouter from "./product-give-take/routes";
import categoriesRouter from "./categories/routes";
import smsRouter from "./sms/routes";
import notesRouter from "./notes/routes";
import rawProductsRouter from "./raw-products/routes";
import rawCategoriesRouter from "./raw-categories/routes";
import suppliersRouter from "./suppliers/routes";
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
router.use("/product-give-take", productGiveTakeRouter);
router.use("/categories", categoriesRouter);
router.use("/sms", smsRouter);
router.use("/notes", notesRouter);
router.use("/raw-products", rawProductsRouter);
router.use("/raw-categories", rawCategoriesRouter);
router.use("/suppliers", suppliersRouter);

export default router;
