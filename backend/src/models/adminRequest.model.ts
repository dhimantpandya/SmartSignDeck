import mongoose from 'mongoose';
import { toJSON, paginate } from './plugins';

const adminRequestSchema = new mongoose.Schema(
    {
        requesterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        targetUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company',
            required: true,
        },
        type: {
            type: String,
            enum: ['DELETE', 'ROLE_UPDATE'],
            required: true,
        },
        details: {
            proposedRole: String,
            reason: String,
        },
        status: {
            type: String,
            enum: ['PENDING', 'APPROVED', 'REJECTED'],
            default: 'PENDING',
        },
        adminComment: String,
    },
    {
        timestamps: true,
    }
);

adminRequestSchema.plugin(toJSON);
adminRequestSchema.plugin(paginate);


export interface IAdminRequest extends mongoose.Document {
    requesterId: mongoose.Types.ObjectId;
    targetUserId: mongoose.Types.ObjectId;
    companyId: mongoose.Types.ObjectId;
    type: 'DELETE' | 'ROLE_UPDATE';
    details: {
        proposedRole?: string;
        reason?: string;
    };
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    adminComment?: string;
    createdAt: Date;
    updatedAt: Date;
}

const AdminRequest = mongoose.model<IAdminRequest>('AdminRequest', adminRequestSchema);

export default AdminRequest;
