const mongoose = require('mongoose');

async function checkUsers() {
  try {
    await mongoose.connect('mongodb://localhost:27017/smartsigndeck');
    console.log('Connected to MongoDB');
    
    // Define a minimal schema
    const User = mongoose.model('User', new mongoose.Schema({
      email: String,
      is_email_verified: Boolean
    }), 'users');
    
    const users = await User.find({});
    console.log('Users found:', users.length);
    users.forEach(u => {
      console.log(`- Email: "${u.email}", Verified: ${u.is_email_verified}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkUsers();
