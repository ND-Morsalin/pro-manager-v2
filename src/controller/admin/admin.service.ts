import setCookie from "../../utility/setCookie";
import ApiError from "../../middleware/error";
import prisma from "../../utility/prisma";
import { AdminPayload } from "./admin.types";
import bcryptjs from "bcryptjs";
import { Response } from "express";
class Service {
  async createAdmin(payload: AdminPayload) {
    // hash pin
     const admin = await prisma.admin.findUnique({
      where: { mobile:payload.mobile },
      select: {
        id: true,
        name: true,
        mobile: true,
        role: true,
        pincode: true,
      },
    });

    if (admin) {
      throw new ApiError(404,"Admin Already Exists" );
    }

    const salt = await bcryptjs.genSalt(10);

    const hashPin = await bcryptjs.hash(payload.pincode, salt);
    const adminNew = await prisma.admin.create({
      data: {
        mobile: payload.mobile,
        name: payload.name,
        pincode: hashPin,
        role: payload.role,
      },
      select: {
        id: true,
      name: true,
        mobile: true,
        role:true
      },
    });
    return adminNew;
  }

   async loginAdmin(mobile: string, pincode: string,res:Response) {
    const admin = await prisma.admin.findUnique({
      where: { mobile },
      select: {
        id: true,
        name: true,
        mobile: true,
        role: true,
        pincode: true,
      },
    });

    if (!admin) {
      throw new Error("Admin not found");
    }

    const isMatch = await bcryptjs.compare(pincode, admin.pincode);
    if (!isMatch) {
      throw new Error("Invalid credentials");
    }
// set cookie
  const token = await setCookie(res, {
    mobile: admin.mobile,
    id: admin.id,
  });
    return {
    token,
      id: admin.id,
      name: admin.name,
      mobile: admin.mobile,
      role: admin.role,
    };
  }

  async getAllAdmin() {
    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        name: true,
        mobile: true,
        role: true,
      },
    });
    return admins;
  }

  async updateAdmin(adminId: string, payload: Partial<AdminPayload>) {
    const updateData: any = {
      ...(payload.name && { name: payload.name }),
      ...(payload.mobile && { mobile: payload.mobile }),
      ...(payload.role && { role: payload.role }),
    };

    if (payload.pincode) {
      const salt = await bcryptjs.genSalt(10);
      updateData.pincode = await bcryptjs.hash(payload.pincode, salt);
    }

    const admin = await prisma.admin.update({
      where: { id: adminId },
      data: updateData,
      select: {
        id: true,
        name: true,
        mobile: true,
        role: true,
      },
    });
    return admin;
  }

  async deleteAdmin(adminId: string) {
    const admin = await prisma.admin.delete({
      where: { id: adminId },
      select: {
        id: true,
        name: true,
        mobile: true,
        role: true,
      },
    });
    return admin;
  }

  async getAdminByAdminId(adminId: string) {
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        name: true,
        mobile: true,
        role: true,
      },
    });

    if (!admin) {
      throw new Error("Admin not found");
    }

    return admin;
  }
}

export const AdminService = new Service();
