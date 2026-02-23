import mongoose from 'mongoose';
import { Template, CollaborationRequest, User } from './backend/src/models';
import * as dotenv from 'dotenv';
dotenv.config();

async function diagnose() {
    await mongoose.connect(process.env.MONGODB_URL!);
    console.log('Connected to DB');

    const requests = await CollaborationRequest.find({ status: 'accepted' }).populate('sender recipient templateId');
    console.log(`Found ${requests.length} accepted collaboration requests`);

    for (const req of requests as any) {
        console.log(`Request ${req._id}:`);
        console.log(`  Sender: ${req.sender?.email} (${req.sender?._id})`);
        console.log(`  Recipient: ${req.recipient?.email} (${req.recipient?._id})`);
        console.log(`  Template: ${req.templateId?.name} (${req.templateId?._id})`);

        const template = await Template.findById(req.templateId?._id);
        if (template) {
            console.log(`  Template Collaborators: ${template.collaborators}`);
            const isCollaborator = template.collaborators.some(id => id.toString() === req.recipient?._id.toString());
            console.log(`  Recipient is collaborator: ${isCollaborator}`);
        } else {
            console.log('  Template NOT FOUND');
        }
        console.log('---');
    }

    const allTemplates = await Template.find({ collaborators: { $exists: true, $not: { $size: 0 } } });
    console.log(`Total templates with collaborators: ${allTemplates.length}`);

    await mongoose.disconnect();
}

diagnose().catch(console.error);
