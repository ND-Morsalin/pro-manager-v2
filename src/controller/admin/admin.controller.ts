import { Request, Response } from "express";
import BaseController from "../../shared/baseController";
import { AdminService } from "./admin.service";
import { AdminPayload } from "./admin.types";

class Controller extends BaseController {
  createAdmin = this.catchAsync(async (req: Request, res: Response) => {
    const adminPayload = req.body as AdminPayload
    const data = await AdminService.createAdmin(adminPayload);
    this.sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "User registered successfully",
      data: data,
    });
  });
   loginAdmin = this.catchAsync(async (req: Request, res: Response) => {
    const { mobile, pincode } = req.body;
    const data = await AdminService.loginAdmin(mobile, pincode,res);
    this.sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "User logged in successfully",
      data: data,
    });
  });

  getAllAdmin = this.catchAsync(async (req: Request, res: Response) => {
    const data = await AdminService.getAllAdmin();
    this.sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Admins retrieved successfully",
      data: data,
    });
  });

  updateAdmin = this.catchAsync(async (req: Request, res: Response) => {
    const adminId = req.params.id;
    const adminPayload = req.body as Partial<AdminPayload>;
    const data = await AdminService.updateAdmin(adminId, adminPayload);
    this.sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Admin updated successfully",
      data: data,
    });
  });

  deleteAdmin = this.catchAsync(async (req: Request, res: Response) => {
    const adminId = req.params.id;
    const data = await AdminService.deleteAdmin(adminId);
    this.sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Admin deleted successfully",
      data: data,
    });
  });

  getAdminByAdminId = this.catchAsync(async (req: Request, res: Response) => {
    const adminId = req.params.id;
    const data = await AdminService.getAdminByAdminId(adminId);
    this.sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Admin retrieved successfully",
      data: data,
    });
  });
}

export const AdminController = new Controller();
