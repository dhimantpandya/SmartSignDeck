const mongoose = require('mongoose');

async function checkOtp() {
  try {
    const uri = 'mongodb+srv://dhimantpandya6_db_user:SmartSign123@cluster0.anzjuct.mongodb.net/smartsigndeck?retryWrites=true&w=majority&appName=Cluster0';
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
    
    // Define a minimal schema for PendingSignup
    const PendingSignup = mongoose.model('PendingSignup', new mongoose.Schema({
      email: String,
      otp: String,
      otpExpires: Date
    }), 'pendingsignups');
    
    const targetEmail = 'testuser_antigravity@example.com';
    const pending = await PendingSignup.findOne({ email: targetEmail });
    
    if (pending) {
      console.log(`\n[OTP FOUND] for ${targetEmail}: ${pending.otp}`);
      console.log(`Expires: ${pending.otpExpires}`);
    } else {
      console.log(`\n[ERROR] No pending signup found for email: ${targetEmail}`);
      
      const allPending = await PendingSignup.find({});
      console.log(`Total Pending Signups: ${allPending.length}`);
      allPending.forEach(p => console.log(`- ${p.email}`));
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkOtp();
