import { Router } from "express";
import { AdminController } from "./admin.controller";
import verifyToken from "../../middleware/verifyToken";

const router = Router();

router.post("/create-admin",AdminController.createAdmin)
router.post("/login-admin",AdminController.loginAdmin)
router.get("/get-all-admin",verifyToken(["ADMIN"]),AdminController.getAllAdmin)
router.get("/:adminId",AdminController.getAdminByAdminId)
router.put("/:adminId",AdminController.updateAdmin)
router.delete("/:adminId",AdminController.deleteAdmin)

export const adminRoutes = router

  
