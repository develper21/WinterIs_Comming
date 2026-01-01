import { connectDB, disconnectDB } from "./config/db.js";
import { getDB } from "./config/db.js";

// #region UserCheck

async function checkUser() {
  try {
    await connectDB();
    const db = getDB();
    
    const organizationCode = "BB-MUM-001";
    const email = "contact@citybloodbank.com";
    
    console.log("\n  Checking for user...");
    console.log(`Organization Code: ${organizationCode}`);
    console.log(`Email: ${email}\n`);
    
    // Check in organizationUsers collection
    const user = await db.collection("organizationUsers").findOne({
      organizationCode: organizationCode,
      email: email.toLowerCase()
    });
    
    if (user) {
      console.log("   USER FOUND in organizationUsers collection:");
      console.log(`   User Code: ${user.userCode}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Organization: ${user.organizationName}`);
      console.log(`   Type: ${user.organizationType}`);
      console.log(`   Password Hash: ${user.password ? "EXISTS" : "MISSING"}`);
    } else {
      console.log("   USER NOT FOUND in organizationUsers collection");
      
      // Check if organization exists
      const org = await db.collection("organizations").findOne({
        organizationCode: organizationCode
      });
      
      if (org) {
        console.log("\n ORGANIZATION FOUND:");
        console.log(`   Name: ${org.name}`);
        console.log(`   Type: ${org.type}`);
        console.log(`   Status: ${org.status}`);
        console.log(`   Email: ${org.email}`);
      } else {
        console.log("\n  ORGANIZATION NOT FOUND");
      }
      
      // List all users in this organization
      const allUsers = await db.collection("organizationUsers").find({
        organizationCode: organizationCode
      }).toArray();
      
      console.log(`\n  Total users in ${organizationCode}: ${allUsers.length}`);
      if (allUsers.length > 0) {
        console.log("\nUsers:");
        allUsers.forEach(u => {
          console.log(`   - ${u.userCode}: ${u.email} (${u.role})`);
        });
      }
    }
    
    await disconnectDB();
    
  } catch (error) {
    console.error("  Error:", error.message);
    process.exit(1);
  }
}

checkUser();
