import { getDB } from "../../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const createSuperAdminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const db = getDB();
    const admin = await db.collection("admins").findOne({ email });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is inactive"
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const token = jwt.sign(
      {
        id: admin._id,
        email: admin.email,
        adminCode: admin.adminCode,
        role: "SUPERADMIN",
        permissions: admin.permissions
      },
      process.env.JWT_SECRET || "superadmin_jwt_secret",
      { expiresIn: "24h" }
    );

    const adminData = {
      _id: admin._id,
      adminCode: admin.adminCode,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      isActive: admin.isActive,
      permissions: admin.permissions
    };

    res.status(200).json({
      success: true,
      message: "Superadmin login successful",
      data: {
        token,
        admin: adminData
      }
    });

  } catch (error) {
    console.error("Superadmin login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed"
    });
  }
};
