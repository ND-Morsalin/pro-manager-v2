import { Response } from "express";
import { ExtendedRequest } from "../../types/types";
import { BusinessContactInfo } from "@prisma/client";
import prisma from "../../utility/prisma";

const createBusinessContactInfo = async (
  req: ExtendedRequest,
  res: Response
) => {
  try {
    const businessInfo = req.body as BusinessContactInfo;

    const isExist = await prisma.businessContactInfo.findFirst({
      where: {
        phoneNumber: businessInfo.phoneNumber,
        shopOwnerId: req.shopOwner.id,
      },
    });
    if (isExist) {
      return res.status(403).json({
        success: false,
        message: "business Contact already Exist",
        isExist,
      });
    }

    const businessContactInfo = await prisma.businessContactInfo.create({
      data: {
        shopOwnerId: req.shopOwner.id,
        name: businessInfo.name,
        organization: businessInfo.organization,
        phoneNumber: businessInfo.phoneNumber,
      },
    });

    return res.status(200).json({
      success: true,
      message: "business Contact info created",
      businessContactInfo,
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
          location: "createBusinessContactInfo",
        },
      ],
    });
  }
};

const getAllBusinessContactInfo = async (
  req: ExtendedRequest,
  res: Response
) => {
  try {
    const allBusinessContactInfo = await prisma.businessContactInfo.findMany({
      where: {
        shopOwnerId: req.shopOwner.id,
      },
    });

    return res.status(200).json({
      success: true,
      allBusinessContactInfo,
      message: "all business info",
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
          location: "getAllBusinessContactInfo",
        },
      ],
    });
  }
};

const getSingleBusinessContactInfo = async (
  req: ExtendedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;

    const singleBusinessContactInfo =
      await prisma.businessContactInfo.findUnique({
        where: {
          id,
          shopOwnerId: req.shopOwner.id,
        },
      });

    return res.status(200).json({
      success: true,
      singleBusinessContactInfo,
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
          location: "getSingleBusinessContactInfo",
        },
      ],
    });
  }
};

const updateBusinessContactInfo = async (
  req: ExtendedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { organization, name, phoneNumber } = req.body as BusinessContactInfo;
    if (phoneNumber) {
      const isExist = await prisma.businessContactInfo.findFirst({
        where: {
          phoneNumber: phoneNumber,
          shopOwnerId: req.shopOwner.id,
        },
      });
      if (isExist) {
        return res.status(403).json({
          success: false,
          message: "You have already use this phone for another business owner",
        });
      }
    }
    const updatedBusinessContactInfo = await prisma.businessContactInfo.update({
      where: {
        id,

        shopOwnerId: req.shopOwner.id,
      },
      data: {
        organization,
        name,
        phoneNumber,
      },
    });

    return res.status(200).json({
      success: true,
      updatedBusinessContactInfo,
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
          location: "updateBusinessContactInfo",
        },
      ],
    });
  }
};

const deleteBusinessContactInfo = async (
  req: ExtendedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;

    const deletedBusinessContact = await prisma.businessContactInfo.delete({
      where: {
        id,
        shopOwnerId: req.shopOwner.id,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Business contact deleted",
      deletedBusinessContact,
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
          location: "deleteBusinessContactInfo",
        },
      ],
    });
  }
};

export {
  createBusinessContactInfo,
  getAllBusinessContactInfo,
  getSingleBusinessContactInfo,
  updateBusinessContactInfo,
  deleteBusinessContactInfo,
};
