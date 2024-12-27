import { Request } from "express";

interface shopOwnerBodyType {
  shopName: string;
  mobile: string;
  pincode: string;
  confirmPincode: string;
  otherMobiles  : string[];
  address?: string;
}

interface LoginBodyType {
  mobile: string;
  pincode: string;
}

interface CookiePayloadType {
  mobile: string;
  id: string;
}

interface DecodedToken {
  id: string;
  iat: number;
  exp: number;
}

interface ExtendedRequest extends Request {
  shopOwner: {
    id: string;
    shopName: string;
    mobile: string;
    pincode?: string;
  };
}

export interface ProductGiveBodyType {
  productId: string;
  amount: number;
  customerId: string;
  companyName: string;
  note: string;
  reason: string;
  quantity: string;
  status: ReceiveGiveStatus;
}

enum ReceiveGiveStatus {
  RECEIVE_FROM_CUSTOMER = "RECEIVE_FROM_CUSTOMER",
  HANDOVER_TO_CUSTOMER = "HANDOVER_TO_CUSTOMER",
  PRODUCT_ON_SHOP = "PRODUCT_ON_SHOP",
  PRODUCT_ON_SUPPLIER = "PRODUCT_ON_SUPPLIER",
}



export {
  shopOwnerBodyType,
  LoginBodyType,
  CookiePayloadType,
  DecodedToken,
  ExtendedRequest,
};
