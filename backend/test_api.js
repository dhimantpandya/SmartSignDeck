const mongoose = require("mongoose");
const httpMocks = require("node-mocks-http");
const { User, CollaborationRequest, Template } = require("./src/models");
const collaborationRequestController = require("./src/controllers/collaborationRequest.controller").default;

const dbUrl = "mongodb://localhost:27017/smartsigndeck";

async function run() {
    await mongoose.connect(dbUrl);

    // Get an existing User ID (from earlier output)
    const senderObjId = new mongoose.Types.ObjectId("6980409f5f0b4d7e96411597"); // dhimant.pandya@technostacks.in

    // 4. Test API
    const req = httpMocks.createRequest({
        method: 'GET',
        url: '/v1/collaboration-requests',
        query: {
            type: 'outgoing',
            status: 'pending'
        }
    });
    req.user = { _id: senderObjId, id: senderObjId.toString() };

    const res = httpMocks.createResponse();

    await collaborationRequestController.getRequests(req, res);

    console.log("Response DATA:");
    console.log(JSON.stringify(res._getData(), null, 2));

    process.exit(0);
}

run().catch(console.error);
