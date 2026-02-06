
import Template from './src/models/template.model';
import Company from './src/models/company.model';
import User from './src/models/user.model';
import Screen from './src/models/screen.model';
import Token from './src/models/token.model';

async function testImports() {
    console.log('Testing model imports...');
    console.log('Template:', !!Template && typeof Template.create === 'function' ? 'OK' : 'FAILED');
    console.log('Company:', !!Company && typeof Company.create === 'function' ? 'OK' : 'FAILED');
    console.log('User:', !!User && typeof User.create === 'function' ? 'OK' : 'FAILED');
    console.log('Screen:', !!Screen && typeof Screen.create === 'function' ? 'OK' : 'FAILED');
    console.log('Token:', !!Token && typeof Token.create === 'function' ? 'OK' : 'FAILED');
    process.exit(0);
}

testImports().catch(err => {
    console.error('Import test failed:', err);
    process.exit(1);
});
