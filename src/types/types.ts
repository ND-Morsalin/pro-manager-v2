interface shopOwnerBodyType {
  shopName: string;
  mobile: string;
  pincode: string;
  confirmPincode: string;
}

interface LoginBodyType {
  mobile: string;
  pincode: string;
}

interface CookiePayloadType {
  mobile: string;
  id: string;
}

export { shopOwnerBodyType,LoginBodyType ,CookiePayloadType};
