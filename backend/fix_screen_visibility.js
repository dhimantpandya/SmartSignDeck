const mongoose = require('mongoose');

async function fixScreen() {
    try {
        await mongoose.connect('mongodb://localhost:27017/smartsigndeck');
        const Screen = mongoose.model('Screen', new mongoose.Schema({}, { strict: false }));
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

        // Find the user we suspect is logged in
        const user = await User.findOne({ email: 'smartsigndeck@gmail.com' });
        if (!user) {
            console.log('User smartsigndeck@gmail.com not found');
            process.exit(1);
        }

        const userId = user._id;
        const companyId = user.companyId;

        // Find the most recent screen in Technostacks
        const screen = await Screen.findOne({ companyId }).sort({ created_at: -1 });
        if (screen) {
            console.log(`Updating screen: "${screen.name}" (${screen._id})`);
            console.log(`Old owner: ${screen.createdBy}`);
            console.log(`New owner: ${userId}`);

            await Screen.updateOne(
                { _id: screen._id },
                {
                    $set: {
                        createdBy: userId,
                        name: "Technostacks Screen",
                        deletedAt: null
                    }
                }
            );
            console.log('Update successful');
        } else {
            console.log('No screens found for company');
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fixScreen();
