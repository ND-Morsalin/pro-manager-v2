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
  const { phone, name, due } = req.query as {
    phone?: string;
    name?: string;
    due?: "true" | "false";
  };

  try {
    const suppliers = await prisma.supplier.findMany({
      where: {
        shopOwnerId: req.shopOwner.id,
        // filter by phone and name if provided using regex
        ...(phone && {
          phone: {
            contains: phone,
            mode: "insensitive",
          },
        }),
        ...(name && {
          name: {
            contains: name,
            mode: "insensitive",
          },
        }),
        ...(due === "true" && {
          totalDue: {
            gt: 0,
          },
        }),
        ...(due === "false" && {
          totalDue: 0,
        }),
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
        // filter by phone and name if provided using regex
        ...(phone && {
          phone: {
            contains: phone,
            mode: "insensitive",
          },
        }),
        ...(name && {
          name: {
            contains: name,
            mode: "insensitive",
          },
        }),
        ...(due === "true" && {
          totalDue: {
            gt: 0,
          },
        }),
        ...(due === "false" && {
          totalDue: 0,
        }),
      },
    });

    const supplierTotalDuePaid = await prisma.supplier.aggregate({
      where: { shopOwnerId: req.shopOwner.id },
      _sum: {
        totalDue: true,
        totalPaid: true,
      },
    });

    return res.status(200).json({
      meta: {
        page,
        limit,
        count,
      },
      totalDue: supplierTotalDuePaid._sum.totalDue || 0,
      totalPaid: supplierTotalDuePaid._sum.totalPaid || 0,
      success: true,
      message: "All lone providers",
      suppliers,
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
    const { paidAmount, paymentType } = req.body as {
      paidAmount: number;
      paymentType: "CASH" | "OTHER";
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

    // create a supplier SupplierPaymentHistory
    await prisma.supplierPaymentHistory.create({
      data: {
        supplierId: id as string,
        shopOwnerId: req.shopOwner.id as string,
        paidAmount,
        transactionStatus: "DUE_PAYMENT",
        note: `Paid ${paidAmount} to supplier ${supplier.name}`,
        paymentDate: new Date(),
      },
    });

    if (paymentType === "CASH") {
      await prisma.cash.update({
        where: {
          shopOwnerId: req.shopOwner.id,
        },
        data: {
          cashBalance: {
            decrement: paidAmount,
          },
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: `Supplier updated successfully, paid ${paidAmount} to supplier ${supplier.name} payment by ${paymentType}`,
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

const getSupplierPaymentHistory = async (
  req: ExtendedRequest,
  res: Response
) => {
  try {
    const { supplierId } = req.params as { supplierId: string };

    const { page, limit, skip } = getPagination(req);

    const { dateFrom, dateTo, order } = req.query as {
      dateFrom?: string;
      dateTo?: string;
      order?: "asc" | "desc";
    };

    const supplier = await prisma.supplier.findUnique({
      where: {
        id: supplierId as string,
      },
    });
    if (!supplier) {
      return res.status(404).json({
        success: false,
        errors: [
          {
            type: "not found",
            value: supplierId,
            msg: "Supplier not found",
          },
        ],
      });
    }

    const paymentHistory = await prisma.supplierPaymentHistory.findMany({
      where: {
        supplierId: supplierId as string,
        shopOwnerId: req.shopOwner.id,
        paymentDate: {
          gte: dateFrom ? new Date(dateFrom) : undefined,
          lte: dateTo ? new Date(dateTo) : undefined,
        },
      },
      orderBy: {
        paymentDate: order || "desc",
      },
      skip,
      take: limit,
    });

    if (!paymentHistory.length) {
      return res.status(404).json({
        success: false,
        errors: [
          {
            type: "not found",
            value: supplierId,
            msg: "No payment history found for this supplier",
          },
        ],
      });
    }
    const count = await prisma.supplierPaymentHistory.count({
      where: {
        supplierId: supplierId as string,
        shopOwnerId: req.shopOwner.id,
        paymentDate: {
          gte: dateFrom ? new Date(dateFrom) : undefined,
          lte: dateTo ? new Date(dateTo) : undefined,
        },
      },
    });
    return res.status(200).json({
      success: true,
      meta: {
        page,
        limit,
        count,
      },
      paymentHistory,
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
  getSupplierPaymentHistory,
};
