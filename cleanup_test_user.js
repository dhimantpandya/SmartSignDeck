const mongoose = require('mongoose');

async function cleanup() {
  try {
    const uri = 'mongodb+srv://dhimantpandya6_db_user:SmartSign123@cluster0.anzjuct.mongodb.net/smartsigndeck?retryWrites=true&w=majority&appName=Cluster0';
    console.log('Connecting to cleanup...');
    await mongoose.connect(uri);
    
    const email = 'testuser_antigravity@example.com';
    
    // Clean up
    const res1 = await mongoose.connection.collection('users').deleteOne({ email });
    const res2 = await mongoose.connection.collection('pendingsignups').deleteOne({ email });
    
    console.log(`Cleaned up user: ${res1.deletedCount}, Pending: ${res2.deletedCount}`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

cleanup();
