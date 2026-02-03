import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { getDB } from "./config/db.js";
import { sentryMiddleware, requestTrackingMiddleware, performanceMiddleware, errorContextMiddleware, complianceMiddleware } from "./middleware/sentry.js";
import { performanceTrackingMiddleware } from "./config/performance.js";
import complianceRoutes from "./routes/compliance/ComplianceRoutes.js";

// #region ImportRoutes
import authRoutes from "./routes/auth/AuthRoutes.js";
import ngoRoutes from "./routes/ngo/NgoRoutes.js";
import donorRoutes from "./routes/donor/DonorRoutes.js";
import adminAuthRoutes from "./routes/admin/AdminAuthRoutes.js";
import approvalRoutes from "./routes/admin/ApprovalRoutes.js";
import adminHospitalRoutes from "./routes/admin/HospitalRoutes.js";
import bloodBankRoutes from "./routes/admin/BloodBankRoutes.js";
import adminNgoRoutes from "./routes/admin/NgoRoutes.js";
import bloodStockRoutes from "./routes/admin/BloodStockRoutes.js";
import alertRoutes from "./routes/admin/AlertRoutes.js";
import auditRoutes from "./routes/admin/AuditRoutes.js";
import dashboardRoutes from "./routes/admin/DashboardRoutes.js";
import orgRegistrationRoutes from "./routes/organization/OrganizationRegistrationRoutes.js";
import orgUsersRoutes from "./routes/organization/OrganizationUsersRoutes.js";
import bloodBankNgoDriveRoutes from "./routes/admin/BloodBankNgoDriveRoutes.js";
import hospitalRoutes from "./routes/hospital/HospitalRoutes.js";
import hospitalNgoDriveRoutes from "./routes/hospital/HospitalNgoDriveRoutes.js";
import adminHospitalBloodRequestRoutes from "./routes/admin/HospitalBloodRequestRoutes.js";
import hospitalBloodRequestRoutes from "./routes/hospital/HospitalBloodRequestRoutes.js";
import publicBloodBankRoutes from "./routes/BloodBankRoutes.js";  // ← Public blood banks
import publicNgoRoutes from "./routes/NgoPublicRoutes.js";  // ← Public NGOs
import debugRoutes from "./routes/DebugRoutes.js";  // ← Debug routes
import syncRoutes from "./routes/SyncRoutes.js";  // ← Sync routes
import monitoringRoutes from "./routes/monitoring/MonitoringRoutes.js";  // ← Monitoring routes


// #region ImportMiddleware
import authMiddleware from "./middleware/auth.middleware.js";

dotenv.config();

const app = express();

// #region CorsConfig
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// #region BodyParser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// #region Monitoring & Tracking Middleware
app.use(requestTrackingMiddleware);
app.use(performanceMiddleware);
app.use(performanceTrackingMiddleware);
app.use(complianceMiddleware);
app.use(errorContextMiddleware);

// #region RequestLogging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// #region HealthCheck
app.get("/health", (req, res) => {
  const db = getDB();
  let dbStatus = 'disconnected';
  
  try {
    // Check database connection
    if (db) {
      dbStatus = 'connected';
    }
  } catch (error) {
    dbStatus = 'error';
  }
  
  res.json({
    status: "OK",
    message: "SEBN Backend is running 🚀",
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbStatus,
      type: 'mongodb'
    },
    monitoring: {
      sentry: !!process.env.SENTRY_DSN,
      logging: true
    },
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// #region RootRoute
app.get("/", (req, res) => {
  res.json({ message: "SEBN Backend Running 🚀" });
});

// #region PublicCamps
app.get("/api/public/camps", async (req, res) => {
  try {
    const db = getDB();
    const camps = await db
      .collection("ngoCamps")
      .find({ isActive: true })
      .toArray();
    
    console.log("Fetched camps:", camps.length);
    
    res.json({
      success: true,
      message: `Found ${camps.length} camps`,
      camps: camps.map((camp) => ({
        _id: camp._id,
        campName: camp.campName || camp.name,
        location: camp.location,
        city: camp.city,
        startDate: camp.startDate,
        endDate: camp.endDate,
      })),
    });
  } catch (error) {
    console.error("Error fetching camps:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch camps",
    });
  }
});

// #region PublicSlots
app.get("/api/public/camps/:campId/slots", async (req, res) => {
  try {
    const db = getDB();
    const { campId } = req.params;
    const { ObjectId } = await import("mongodb");
    
    const slots = await db
      .collection("campSlots")
      .find({ campId: new ObjectId(campId) })
      .sort({ createdAt: 1 })
      .toArray();
    
    console.log(`Fetched slots for camp ${campId}:`, slots.length);
    
    res.json({
      success: true,
      message: `Found ${slots.length} slots`,
      slots: slots.map((slot) => ({
        _id: slot._id,
        slotTime: slot.slotTime,
        maxDonors: slot.maxDonors,
        bookedCount: slot.bookedCount || 0,
        availableSpots: (slot.maxDonors || 0) - (slot.bookedCount || 0),
      })),
    });
  } catch (error) {
    console.error("Error fetching slots:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch slots",
    });
  }
});

// #region TestSampleCamps
app.post("/api/test/create-sample-camps", async (req, res) => {
  try {
    const db = getDB();
    const sampleCamps = [
      {
        campName: "Red Cross Blood Camp - Delhi",
        location: "Central Hospital, New Delhi",
        city: "New Delhi",
        state: "Delhi",
        pincode: "110001",
        description: "Monthly blood donation camp",
        contactPersonName: "Dr. Sharma",
        contactMobile: "9876543210",
        totalSlots: 5,
        expectedDonors: 100,
        status: "active",
        isActive: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        campName: "NGO Blood Drive - Mumbai",
        location: "Community Center, Mumbai",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
        description: "Weekly donation camp",
        contactPersonName: "Mr. Patel",
        contactMobile: "8765432109",
        totalSlots: 3,
        expectedDonors: 80,
        status: "active",
        isActive: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        campName: "Blood Bank Camp - Bangalore",
        location: "City Hospital, Bangalore",
        city: "Bangalore",
        state: "Karnataka",
        pincode: "560001",
        description: "Fortnightly blood donation",
        contactPersonName: "Dr. Desai",
        contactMobile: "7654321098",
        totalSlots: 4,
        expectedDonors: 120,
        status: "active",
        isActive: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const result = await db.collection("ngoCamps").insertMany(sampleCamps);
    res.json({
      success: true,
      message: `Created ${result.insertedIds.length} sample camps`,
      insertedIds: result.insertedIds
    });
  } catch (error) {
    console.error("Error creating sample camps:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create sample camps",
      error: error.message
    });
  }
});

// #region TestSampleSlots
app.post("/api/test/create-sample-slots", async (req, res) => {
  try {
    const db = getDB();
    const { ObjectId } = await import("mongodb");
    
    // Get all camps
    const camps = await db.collection("ngoCamps").find({}).toArray();
    
    if (camps.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No camps found. Please create camps first using /api/test/create-sample-camps"
      });
    }

    const timeSlots = [
      "06:00 AM - 08:00 AM",
      "08:00 AM - 10:00 AM",
      "10:00 AM - 12:00 PM",
      "12:00 PM - 02:00 PM",
      "02:00 PM - 04:00 PM",
      "04:00 PM - 06:00 PM",
      "06:00 PM - 08:00 PM"
    ];

    const sampleSlots = [];

    // Create slots for each camp
    camps.forEach(camp => {
      timeSlots.forEach(time => {
        sampleSlots.push({
          campId: camp._id,
          slotTime: time,
          maxDonors: 10,
          bookedCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });
    });

    const result = await db.collection("campSlots").insertMany(sampleSlots);
    
    res.json({
      success: true,
      message: `Created ${sampleSlots.length} sample time slots for ${camps.length} camps`,
      slotsCreated: result.insertedIds.length,
      campCount: camps.length,
      slotsPerCamp: timeSlots.length
    });
  } catch (error) {
    console.error("Error creating sample slots:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create sample slots",
      error: error.message
    });
  }
});

// #region ApiRoutesSetup
app.use("/api/auth/org", orgRegistrationRoutes);  // ← Organization registration
app.use("/api/auth", authRoutes);
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin/approvals", approvalRoutes);
app.use("/api/admin/hospitals", adminHospitalRoutes);
app.use("/api/admin/bloodbanks", bloodBankRoutes);
app.use("/api/admin/ngos", adminNgoRoutes);
app.use("/api/admin/blood-stock", bloodStockRoutes);
app.use("/api/admin/alerts", alertRoutes);
app.use("/api/admin/logs", auditRoutes);
app.use("/api/admin/dashboard", dashboardRoutes);
app.use("/api/admin/drives", bloodBankNgoDriveRoutes);
app.use("/api/admin/requests", adminHospitalBloodRequestRoutes);
app.use("/api/organization-users", orgUsersRoutes);  // ← Organization users
app.use("/api/hospitals", hospitalRoutes);  // ← Hospital routes
app.use("/api/hospital-ngo-drives", hospitalNgoDriveRoutes);  // ← Hospital-NGO drives
app.use("/api/hospital-blood-requests", hospitalBloodRequestRoutes);  // ← Hospital blood requests
app.use("/api/blood-banks", publicBloodBankRoutes);  // ← Public blood banks list
app.use("/api/public-ngos", publicNgoRoutes);  // ← Public NGOs list
app.use("/api/ngo", authMiddleware, ngoRoutes);
app.use("/api/donor", donorRoutes);
app.use("/api/debug", debugRoutes);  // ← Debug routes (development only)
app.use("/api/sync", syncRoutes);  // ← Sync routes (development only)

// #region MonitoringRoutes
app.use("/api/monitoring", monitoringRoutes);

// #region ComplianceRoutes
app.use("/api/compliance", complianceRoutes);

// #region ErrorHandling

// #region NotFoundHandler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.path
  });
});

// #region GlobalErrorHandler
app.use(sentryMiddleware);
app.use((err, req, res, next) => {
  console.error("Error:", err);
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  res.status(statusCode).json({
    success: false,
    message,
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
});

export default app;
