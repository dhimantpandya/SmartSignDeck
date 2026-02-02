/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env');
const envExamplePath = path.resolve(__dirname, '.env.example');

const getEnvVariables = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf-8');
  return content
    .split('\n')
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => line.split('=')[0].trim());
};

const validateEnv = () => {
  const envVariables = getEnvVariables(envPath);
  const envExampleVariables = getEnvVariables(envExamplePath);

  const missingInExample = envVariables.filter((varName) => !envExampleVariables.includes(varName));

  if (missingInExample.length > 0) {
    console.error('The following variables are missing in .env.example:');
    console.error(missingInExample.join('\n'));
    process.exit(1);
  }

  console.log('All environment variables are correctly listed and validated.');
};

validateEnv();
