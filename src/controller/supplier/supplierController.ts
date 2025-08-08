import { Response } from "express";
import { ExtendedRequest } from "../../types/types";
import prisma from "../../utility/prisma";
import { Supplier } from "@prisma/client";
import { getPagination } from "../../utility/getPaginatin";

const createSupplier = async (req: ExtendedRequest, res: Response) => {
  try {
    const { address, institution, name, phone } = req.body as Supplier;

    const newSupplier = await prisma.supplier.create({
      data: {
        address,
        institution,
        name,
        phone,
        shopOwnerId: req.shopOwner.id,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Supplier created successfully",
      Supplier: newSupplier,
    });
  } catch (error) {
    console.log({
      error,
    });
    return res.status(500).json({
      success: false,
      errors: [
        {
          type: "server error",
          value: "",
          msg: "Internal server error",
          path: "server",
          location: "createSupplier",
        },
      ],
    });
  }
};

const getAllSuppliers = async (req: ExtendedRequest, res: Response) => {
   const { page, limit, skip } = getPagination(req);
  try {
    const suppliers = await prisma.supplier.findMany({
      where: {
        shopOwnerId: req.shopOwner.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    // if no lone provider found
    if (!suppliers.length) {
      return res.status(404).json({
        success: false,
        errors: [
          {
            type: "not found",
            value: "",
            msg: "No lone provider found",
            path: "Supplier",
            location: "getAllSuppliers",
          },
        ],
      });
    }
    const count = await prisma.supplier.count({
      where: {
        shopOwnerId: req.shopOwner.id,
      },
    });

    return res.status(200).json({
      success: true,
      message: "All lone providers",
      suppliers,
      meta: {
        page,
        limit,
        count,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      errors: [
        {
          type: "server error",
          value: "",
          msg: "Internal server error",
          path: "server",
          location: "getAllSuppliers",
        },
      ],
    });
  }
};

const getSingleSupplier = async (req: ExtendedRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const supplier = await prisma.supplier.findUnique({
      where: {
        id: id as string,
      },
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        errors: [
          {
            type: "not found",
            value: id,
            msg: "Supplier not found",
            path: "Supplier",
            location: "getSingleSupplier",
          },
        ],
      });
    }

    return res.status(200).json({
      success: true,
      supplier,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      errors: [
        {
          type: "server error",
          value: "",
          msg: "Internal server error",
          path: "server",
          location: "getSingleSupplier",
        },
      ],
    });
  }
};

const updateSupplier = async (req: ExtendedRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { address, institution, name, phone } = req.body as Supplier;

    const supplier = await prisma.supplier.update({
      where: {
        id: id as string,
      },
      data: {
        address,
        institution,
        name,
        phone,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Supplier updated successfully",
      supplier,
    });
  } catch (error) {
    console.log({ error });
    return res.status(500).json({
      success: false,
      errors: [
        {
          type: "server error",
          value: "",
          msg: "Internal server error",
          path: "server",
          location: "updateSupplier",
        },
      ],
    });
  }
};
const supplierCashSupplier = async (req: ExtendedRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { paidAmount } = req.body as {
      paidAmount: number;
    };

    const supplier = await prisma.supplier.update({
      where: {
        id: id as string,
      },
      data: {
        totalDue: {
          decrement: paidAmount,
        },
        totalPaid: {
          increment: paidAmount,
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Supplier updated successfully",
      supplier,
    });
  } catch (error) {
    console.log({ error });
    return res.status(500).json({
      success: false,
      errors: [
        {
          type: "server error",
          value: "",
          msg: "Internal server error",
          path: "server",
          location: "updateSupplier",
        },
      ],
    });
  }
};

const deleteSupplier = async (req: ExtendedRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const supplierDeleted = await prisma.supplier.delete({
      where: {
        id: id as string,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Supplier deleted successfully",
      supplier: supplierDeleted,
    });
  } catch (error) {
    console.log({ error });
    return res.status(500).json({
      success: false,
      errors: [
        {
          type: "server error",
          value: "",
          msg: "Internal server error",
          path: "server",
          location: "deleteSupplier",
        },
      ],
    });
  }
};

export {
  createSupplier,
  getAllSuppliers,
  getSingleSupplier,
  updateSupplier,
  deleteSupplier,
  supplierCashSupplier,
};
