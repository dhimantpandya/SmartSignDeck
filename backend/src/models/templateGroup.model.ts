import mongoose, { Schema, type Document, type FilterQuery, type Model } from "mongoose";
import { paginate, toJSON } from "./plugins";
import {
    type CustomPaginateOptions,
    type CustomPaginateResult,
} from "./plugins/paginate.plugin";

export interface ITemplateGroup extends Document {
    name: string;
    description?: string;
    companyId: mongoose.Schema.Types.ObjectId;
    createdBy: mongoose.Schema.Types.ObjectId;
    templates: mongoose.Schema.Types.ObjectId[];
    created_at: Date;
    updated_at: Date;
    deletedAt?: Date | null;
}

export interface ITemplateGroupModel extends Model<ITemplateGroup> {
    paginate: (
        filter: FilterQuery<ITemplateGroup>,
        options: CustomPaginateOptions,
    ) => Promise<CustomPaginateResult<ITemplateGroup>>;
}

const templateGroupSchema = new Schema<ITemplateGroup, ITemplateGroupModel>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        companyId: {
            type: Schema.Types.ObjectId,
            ref: "Company",
            required: true,
            index: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        templates: [
            {
                type: Schema.Types.ObjectId,
                ref: "Template",
            },
        ],
        deletedAt: {
            type: Date,
            default: null,
            index: true,
        },
    },
    { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

// add plugin that converts mongoose to json
templateGroupSchema.plugin(toJSON);
templateGroupSchema.plugin(paginate);

const TemplateGroup = mongoose.model<ITemplateGroup, ITemplateGroupModel>(
    "TemplateGroup",
    templateGroupSchema,
);

export default TemplateGroup;
