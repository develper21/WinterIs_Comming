import { getDB } from "../../config/db.js";

// #region DonationModel

export const DonationCollection = () => {
  return getDB().collection("donations");
};
