import { Router } from "express";
import {
  addCustomer,
  deleteCustomer,
  getAllCustomers,
  getSingleCustomer,
  getSingleCustomerByPhone,
  updateCustomer,
} from "./customerController";
import checkValidUser from "../../middleware/checkValidUser";

const router = Router();

router.post("/", checkValidUser, addCustomer);
router.get("/", checkValidUser, getAllCustomers);
router.get("/:id", checkValidUser, getSingleCustomer);
router.get("/by-phone/:phone", checkValidUser, getSingleCustomerByPhone);
router.put("/:id", checkValidUser, updateCustomer);
router.delete("/:id", checkValidUser, deleteCustomer);

export default router;
