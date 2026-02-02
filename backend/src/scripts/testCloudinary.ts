import cloudinary from "../config/cloudinary";
import logger from "../config/logger";

async function testCloudinary() {
  try {
    console.log("Testing Cloudinary configuration...");
    const result = await cloudinary.api.ping();
    console.log("Cloudinary ping result:", result);

    if (result.status === "ok") {
      console.log("✅ Cloudinary is configured correctly!");
    } else {
      console.log("❌ Cloudinary ping failed.");
    }
  } catch (error) {
    console.error("❌ Error testing Cloudinary:", error);
  }
}

testCloudinary();
