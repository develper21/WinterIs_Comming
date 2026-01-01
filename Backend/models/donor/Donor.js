import { getDB } from "../../config/db.js";

// #region DonorModel

export const DonorCollection = () => {
  return getDB().collection("donors");
};
