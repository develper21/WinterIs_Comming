import { connectDB, disconnectDB, getDB } from "./config/db.js";
import bcrypt from "bcryptjs";


// #region createBloodBankUser
async function createBloodBankUser() {
  try {
    await connectDB();
    const db = getDB();
    
    const organizationCode = "BB-MUM-001";
    const email = "contact@citybloodbank.com";
    const password = "bloodbank123";
    
    console.log("\n=== BLOOD BANK USER SETUP ===\n");
    
    const org = await db.collection("organizations").findOne({
      organizationCode: organizationCode
    });
    
    if (!org) {
      console.log("Organization BB-MUM-001 not found!");
      console.log("Please create the organization first.");
      await disconnectDB();
      return;
    }
    
    console.log(`Organization Found: ${org.name}`);
    console.log(`Type: ${org.type}`);
    console.log(`Status: ${org.status}\n`);
    
    const existingUser = await db.collection("organizationUsers").findOne({
      organizationCode: organizationCode,
      email: email.toLowerCase()
    });
    
    if (existingUser) {
      console.log("User Already Exists:");
      console.log(`User Code: ${existingUser.userCode}`);
      console.log(`Name: ${existingUser.name}`);
      console.log(`Email: ${existingUser.email}`);
      console.log(`Role: ${existingUser.role}`);
      console.log(`Status: ${existingUser.status}\n`);
      
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.collection("organizationUsers").updateOne(
        { _id: existingUser._id },
        { 
          $set: { 
            password: hashedPassword,
            updatedAt: new Date()
          } 
        }
      );
      
      console.log("Password Updated Successfully!");
      console.log(`\nLOGIN CREDENTIALS:`);
      console.log(`Organization Code: ${organizationCode}`);
      console.log(`Email: ${email}`);
      console.log(`Password: ${password}\n`);
      
    } else {
      console.log("User not found. Creating new user...\n");
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const newUser = {
        organizationCode: organizationCode,
        organizationName: org.name,
        organizationType: org.type,
        userCode: `${organizationCode}-ADMIN`,
        name: "Blood Bank Admin",
        email: email.toLowerCase(),
        password: hashedPassword,
        role: "ADMIN",
        status: "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await db.collection("organizationUsers").insertOne(newUser);
      
      console.log("User Created Successfully!");
      console.log(`User Code: ${newUser.userCode}`);
      console.log(`Name: ${newUser.name}`);
      console.log(`Email: ${newUser.email}`);
      console.log(`Role: ${newUser.role}\n`);
      
      console.log(`LOGIN CREDENTIALS:`);
      console.log(`Organization Code: ${organizationCode}`);
      console.log(`Email: ${email}`);
      console.log(`Password: ${password}\n`);
    }
    
    await disconnectDB();
    console.log("Done!\n");
    
  } catch (error) {
    console.error("Error:", error.message);
    await disconnectDB();
    process.exit(1);
  }
}

createBloodBankUser();
