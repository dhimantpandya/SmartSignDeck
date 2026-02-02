"use strict";
/* eslint-disable @typescript-eslint/restrict-template-expressions */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
/* eslint-disable @typescript-eslint/explicit-function-return-type */
const toJSON = (schema) => {
    schema.set('toJSON', {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        transform: (doc, ret) => {
            delete ret.__v;
            delete ret.created_at;
            delete ret.updated_at;
            delete ret.private;
        },
    });
};
describe('toJSON plugin', () => {
    let connection;
    let Model;
    beforeEach(() => {
        connection = mongoose_1.default.createConnection();
    });
    it('should remove __v', () => {
        const schema = new mongoose_1.Schema({});
        toJSON(schema);
        Model = connection.model('Model', schema);
        const doc = new Model();
        expect(doc.toJSON()).not.toHaveProperty('__v');
    });
    it('should remove created_at and updated_at', () => {
        const schema = new mongoose_1.Schema({}, { timestamps: true });
        toJSON(schema);
        Model = connection.model('Model', schema);
        const doc = new Model();
        expect(doc.toJSON()).not.toHaveProperty('created_at');
        expect(doc.toJSON()).not.toHaveProperty('updated_at');
    });
    it('should remove any path set as private', () => {
        const schema = new mongoose_1.Schema({
            public: { type: String },
            private: { type: String, private: true },
        });
        toJSON(schema);
        Model = connection.model('Model', schema);
        const doc = new Model({ public: 'some public value', private: 'some private value' });
        expect(doc.toJSON()).not.toHaveProperty('private');
        expect(doc.toJSON()).toHaveProperty('public');
    });
    // it('should remove any nested paths set as private', () => {
    //   const schema = new Schema({
    //     public: { type: String },
    //     nested: {
    //       private: { type: String, private: true },
    //     },
    //   });
    //   toJSON(schema);
    //   Model = connection.model<PublicDocument>('Model', schema);
    //   const doc = new Model({
    //     public: 'some public value',
    //     nested: {
    //       private: 'some nested private value',
    //     },
    //   });
    //   expect(doc.toJSON()).not.toHaveProperty('nested.private');
    //   expect(doc.toJSON()).toHaveProperty('public');
    // });
    it('should also call the schema toJSON transform function', () => {
        const schema = new mongoose_1.Schema({
            public: { type: String },
            private: { type: String },
        }, {
            toJSON: {
                /* eslint-disable @typescript-eslint/no-explicit-any */
                transform: (doc, ret) => {
                    delete ret.private;
                },
            },
        });
        toJSON(schema);
        Model = connection.model('Model', schema);
        const doc = new Model({ public: 'some public value', private: 'some private value' });
        expect(doc.toJSON()).not.toHaveProperty('private');
        expect(doc.toJSON()).toHaveProperty('public');
    });
});
