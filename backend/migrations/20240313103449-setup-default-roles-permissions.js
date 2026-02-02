"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
module.exports = {
    up(db) {
        return __awaiter(this, void 0, void 0, function* () {
            const rolesData = [
                {
                    _id: new mongodb_1.ObjectId(),
                    name: 'super_admin',
                    description: 'super_admin of the whole system',
                    permissions: [
                        new mongodb_1.ObjectId('649037633deb738e54d85b77'),
                        new mongodb_1.ObjectId('649037633deb738e54d85b78'),
                        new mongodb_1.ObjectId('649037633deb738e54d85b79'),
                        new mongodb_1.ObjectId('649037633deb738e54d85b80'),
                        new mongodb_1.ObjectId('649037633deb738e54d85b81'),
                    ],
                    status: 'active',
                    created_at: new Date('1687174306802'),
                    updated_at: new Date('1687174306802'),
                    __v: 0,
                },
                {
                    _id: new mongodb_1.ObjectId(),
                    name: 'user',
                    description: 'user of the whole system',
                    permissions: [],
                    status: 'active',
                    created_at: new Date('1687279973387'),
                    updated_at: new Date('1687279973387'),
                    __v: 0,
                },
            ];
            const permissionsData = [
                {
                    _id: new mongodb_1.ObjectId('649037633deb738e54d85b77'),
                    name: 'create user',
                    description: 'can create the new user',
                    resource: 'User',
                    action: 'create',
                    status: 'active',
                    created_at: new Date('1687172963295'),
                    updated_at: new Date('1687172963295'),
                    __v: 0,
                },
                {
                    _id: new mongodb_1.ObjectId('649037633deb738e54d85b78'),
                    name: 'update user',
                    description: 'can update the user',
                    resource: 'User',
                    action: 'update',
                    status: 'active',
                    created_at: new Date('1687172963295'),
                    updated_at: new Date('1687172963295'),
                    __v: 0,
                },
                {
                    _id: new mongodb_1.ObjectId('649037633deb738e54d85b79'),
                    name: 'delete user',
                    description: 'can delete the user',
                    resource: 'User',
                    action: 'delete',
                    status: 'active',
                    created_at: new Date('1687172963295'),
                    updated_at: new Date('1687172963295'),
                    __v: 0,
                },
                {
                    _id: new mongodb_1.ObjectId('649037633deb738e54d85b80'),
                    name: 'get user',
                    description: 'can get the user details by id',
                    resource: 'User',
                    action: 'get',
                    status: 'active',
                    created_at: new Date('1687172963295'),
                    updated_at: new Date('1687172963295'),
                    __v: 0,
                },
                {
                    _id: new mongodb_1.ObjectId('649037633deb738e54d85b81'),
                    name: 'get all users',
                    description: 'Can get the list of the users',
                    resource: 'User',
                    action: 'get_all',
                    status: 'active',
                    created_at: new Date('1687172963295'),
                    updated_at: new Date('1687172963295'),
                    __v: 0,
                },
            ];
            // Insert the roles into the MongoDB collection
            yield db.collection('roles').insertMany(rolesData);
            // Insert the permissions into the MongoDB collection
            yield db.collection('permissions').insertMany(permissionsData);
        });
    },
};
