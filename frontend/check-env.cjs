/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env');
const envExamplePath = path.resolve(__dirname, '.env.example');
const envTsPath = path.resolve(__dirname, 'env.ts');

const getEnvVariables = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf-8');
  return content
    .split('\n')
    .filter(line => line && !line.startsWith('#'))
    .map(line => line.split('=')[0].trim());
};

const loadSchema = () => {
  const content = fs.readFileSync(envTsPath, 'utf-8');
  const schemaMatch = content.match(/const schema\s*=\s*({[^]*});\s*export default/);
  if (!schemaMatch) {
    throw new Error('No schema found in env.ts');
  }

  const schemaString = schemaMatch[1];
  // Use eval to parse the schema string into a JavaScript object
  

  return schemaString;
};

const validateEnv = () => {
  const envVariables = getEnvVariables(envPath);
  const envExampleVariables = getEnvVariables(envExamplePath);
  const schema = loadSchema();

  const variableRegex = /\b(VITE_\w+)\b/g;
  const validatedVariables = [];
  let match;

  while ((match = variableRegex.exec(schema)) !== null) {
    validatedVariables.push(match[1]);
  }
  const missingInExample = envVariables.filter(varName => !envExampleVariables.includes(varName));
  const missingInValidation = envVariables.filter(varName => !validatedVariables.includes(varName));

  if (missingInExample.length > 0) {
    console.error('The following variables are missing in .env.example:');
    console.error(missingInExample.join('\n'));
    process.exit(1);
  }

  if (missingInValidation.length > 0) {
    console.error('The following variables are missing in env.ts validation:');
    console.error(missingInValidation.join('\n'));
    process.exit(1);
  }

  console.log('All environment variables are correctly listed and validated.');
};

validateEnv();
