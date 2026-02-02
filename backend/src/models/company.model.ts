import mongoose, { Schema, type Document, type FilterQuery } from "mongoose";
import { paginate, toJSON } from "./plugins";
import {
    type CustomPaginateOptions,
    type CustomPaginateResult,
} from "./plugins/paginate.plugin";

export interface ICompany extends Document {
    name: string;
    ownerId: mongoose.Schema.Types.ObjectId;
    description?: string;
    logo?: string;
    website?: string;
    isActive: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface ICompanyModel extends mongoose.Model<ICompany> {
    isNameTaken: (
        name: string,
        excludeCompanyId?: mongoose.Types.ObjectId,
    ) => Promise<boolean>;
    paginate: (
        filter: FilterQuery<ICompany>,
        options: CustomPaginateOptions,
    ) => Promise<CustomPaginateResult<ICompany>>;
}

const companySchema = new Schema<ICompany, ICompanyModel>(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true,
        },
        ownerId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        description: {
            type: String,
            trim: true,
        },
        logo: {
            type: String,
        },
        website: {
            type: String,
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
    },
    { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

// plugins
companySchema.plugin(toJSON);
companySchema.plugin(paginate);

/**
 * Check if name is taken
 * @param {string} name - The company's name
 * @param {ObjectId} [excludeCompanyId] - The id of the company to be excluded
 * @returns {Promise<boolean>}
 */
companySchema.statics.isNameTaken = async function (
    name: string,
    excludeCompanyId?: mongoose.Types.ObjectId,
) {
    const company = await this.findOne({ name, _id: { $ne: excludeCompanyId } });
    return !!company;
};

const Company = mongoose.model<ICompany, ICompanyModel>("Company", companySchema);

export default Company;
