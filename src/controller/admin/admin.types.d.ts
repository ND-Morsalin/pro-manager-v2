export type RoleTypes = "ADMIN" | "MODERATOR";

export interface AdminPayload {
  name: string;
  mobile: string;
  pincode: string;
  role: RoleTypes;
}
