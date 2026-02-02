import * as fs from 'fs';
import * as yaml from 'js-yaml';

// YAML to JSON
const doc = yaml.load(fs.readFileSync('./src/docs/components.yml', 'utf8'));
const json: string = JSON.stringify(doc);

const jsonObj = JSON.parse(json);
const ARG: string = process.argv[2];

jsonObj.components.schemas[ARG] = JSON.parse(JSON.stringify(jsonObj.components.schemas.Todos));
const yamlStr: string = yaml.dump(jsonObj);
fs.writeFileSync('./src/docs/components.yml', yamlStr);
