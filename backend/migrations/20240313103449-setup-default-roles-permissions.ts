const { ObjectId } = require('mongodb');

module.exports = {
  async up(db) {
    const rolesData = [
      {
        _id: new ObjectId(),
        name: 'super_admin',
        description: 'super_admin of the whole system',
        permissions: [
          new ObjectId('649037633deb738e54d85b77'),
          new ObjectId('649037633deb738e54d85b78'),
          new ObjectId('649037633deb738e54d85b79'),
          new ObjectId('649037633deb738e54d85b80'),
          new ObjectId('649037633deb738e54d85b81'),
        ],
        status: 'active',
        created_at: new Date('1687174306802'),
        updated_at: new Date('1687174306802'),
        __v: 0,
      },
      {
        _id: new ObjectId(),
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
        _id: new ObjectId('649037633deb738e54d85b77'),
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
        _id: new ObjectId('649037633deb738e54d85b78'),
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
        _id: new ObjectId('649037633deb738e54d85b79'),
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
        _id: new ObjectId('649037633deb738e54d85b80'),
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
        _id: new ObjectId('649037633deb738e54d85b81'),
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
    await db.collection('roles').insertMany(rolesData);

    // Insert the permissions into the MongoDB collection
    await db.collection('permissions').insertMany(permissionsData);
  },
};
