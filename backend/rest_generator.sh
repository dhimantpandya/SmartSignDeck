#!/bin/bash

# Get the argument passed to the script
argument=$1

# Trim the argument
module_name="$(echo -e "${argument}" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"

# Check if the trimmed argument is blank
if [ -z "$module_name" ]; then
  echo "Error: Blank argument passed to the script. Please provide a valid argument."
  exit 1
fi

# tsc  scripts/name-generator.ts $argument
output=$(node scripts/name-generator.js "$argument")

# {
#   singular: 'productCategory',
#   plural: 'productCategories',
#   singularDashed: 'product-category',
#   pluralDashed: 'product-categories',
#   singularCapitalizedDashed: 'PRODUCT-CATEGORY',
#   pluralCapitalizedDashed: 'PRODUCT-CATEGORIES',
#   singularUnderscored: 'product_category',
#   pluralUnderscored: 'product_categories',
#   singularCapitalizedUnderscored: 'PRODUCT_CATEGORY',
#   pluralCapitalizedUnderscored: 'PRODUCT_CATEGORIES',
#   singularCapitalized: 'ProductCategory',
#   pluralCapitalized: 'ProductCategories',
#   singularSpaceSeparated: 'Product category',
#   pluralSpaceSeparated: 'Product categories',
#   singularSpaceSeparatedLowerCase: 'product category',
#   pluralSpaceSeparatedLowerCase: 'product categories'
# }

# Use jq to parse the JSON string and access its keys
singular=$(echo "$output" | jq -r '.singular')
plural=$(echo "$output" | jq -r '.plural')
singularDashed=$(echo "$output" | jq -r '.singularDashed')
pluralDashed=$(echo "$output" | jq -r '.pluralDashed')
singularCapitalizedDashed=$(echo "$output" | jq -r '.singularCapitalizedDashed')
pluralCapitalizedDashed=$(echo "$output" | jq -r '.pluralCapitalizedDashed')
singularUnderscored=$(echo "$output" | jq -r '.singularUnderscored')
pluralUnderscored=$(echo "$output" | jq -r '.pluralUnderscored')
singularCapitalizedUnderscored=$(echo "$output" | jq -r '.singularCapitalizedUnderscored')
pluralCapitalizedUnderscored=$(echo "$output" | jq -r '.pluralCapitalizedUnderscored')
singularCapitalized=$(echo "$output" | jq -r '.singularCapitalized')
pluralCapitalized=$(echo "$output" | jq -r '.pluralCapitalized')
singularSpaceSeparated=$(echo "$output" | jq -r '.singularSpaceSeparated')
pluralSpaceSeparated=$(echo "$output" | jq -r '.pluralSpaceSeparated')
singularSpaceSeparatedLowerCase=$(echo "$output" | jq -r '.singularSpaceSeparatedLowerCase')
pluralSpaceSeparatedLowerCase=$(echo "$output" | jq -r '.pluralSpaceSeparatedLowerCase')

clone(){

  if [[ 'constant' == $1 ]]; then
      # Set the file location and names
      file_location="./.templates/$1.ts"
      new_file_location="./src/utils/$1s/"$singularUnderscored".constants.ts"
  elif [[ 'route' == $1 ]]; then
      # Set the file location and names
      file_location="./.templates/$1.ts"
      new_file_location="./src/$1s/v1/$singularUnderscored.$1.ts"
  elif [[ 'test' == $1 ]]; then
      # Set the file location and names
      file_location="./.templates/_test.ts"
      new_file_location="./tests/integration/$singularUnderscored.$1.ts"
  elif [[ 'fixture' == $1 ]]; then
      # Set the file location and names
      file_location="./.templates/$1.ts"
      new_file_location="./tests/fixtures/$singularUnderscored.$1.ts"
  else
      # Set the file location and names
      file_location="./.templates/$1.ts"
      new_file_location="./src/$1s/$singularUnderscored.$1.ts"
  fi
  # Replace the words in the file and store it in a new location
  sed "s/{{singular}}/$singular/g;s/{{plural}}/$plural/g;s/{{singularDashed}}/$singularDashed/g;s/{{pluralDashed}}/$pluralDashed/g;s/{{singularCapitalizedDashed}}/$singularCapitalizedDashed/g;s/{{pluralCapitalizedDashed}}/$pluralCapitalizedDashed/g;s/{{singularUnderscored}}/$singularUnderscored/g;s/{{pluralUnderscored}}/$pluralUnderscored/g;s/{{singularCapitalizedUnderscored}}/$singularCapitalizedUnderscored/g;s/{{pluralCapitalizedUnderscored}}/$pluralCapitalizedUnderscored/g;s/{{singularCapitalized}}/$singularCapitalized/g;s/{{pluralCapitalized}}/$pluralCapitalized/g;s/{{singularSpaceSeparated}}/$singularSpaceSeparated/g;s/{{pluralSpaceSeparated}}/$pluralSpaceSeparated/g;s/{{singularSpaceSeparatedLowerCase}}/$singularSpaceSeparatedLowerCase/g;s/{{pluralSpaceSeparatedLowerCase}}/$pluralSpaceSeparatedLowerCase/g;" "$file_location" > "$new_file_location"
}

import_files_to_index(){
# Controller
# Export export * as todoController from './todo.controller';
echo -n "export * as "$singular"Controller from'./$singularUnderscored.controller';

" >> ./src/controllers/index.ts

# Models
# Example: export { default as Todo } from './todo.model';
echo -n "export { default as $singularCapitalized } from './$singularUnderscored.model';
" >> ./src/models/index.ts

# Services
# Example: export * as todoService from './todo.service';
echo -n "export * as "$singular"Service from './$singularUnderscored.service';
" >> ./src/services/index.ts

# Validations
# Example: export * as todoValidation from './todo.validation';
echo -n "export * as "$singular"Validation from './$singularUnderscored.validation';
" >> ./src/validations/index.ts

#Routes
#Example: import todoRoute from './todo.route';
# Replace the words in the file and store it in a new location
import_statement="import ${singular}Route from './${singularUnderscored}.route';"
sed -i "/\/\/ IMPORT ROUTE HERE/c\\${import_statement}\n\/\/ IMPORT ROUTE HERE" "./src/routes/v1/index.ts"
sed -i "/ ROUTE DECLARATION/c\  { path: '/$pluralDashed', route: "$singular"Route },\n  // ROUTE DECLARATION" "./src/routes/v1/index.ts"

# components.yml => add the schema for new module
# Replace the words in the file and add new schema dynamically
# sed -i "$componentsSchema" "./src/docs/components.yml"
tsc  ./scripts/js-to-yml.ts $pluralCapitalized

# Execute the generated JavaScript file using Node.js
node ./scripts/js-to-yml.js $pluralCapitalized

# Remove the generated JavaScript file
rm ./scripts/js-to-yml.js
}

# Declare arrays to store the generated IDs and objects
declare -a permission_ids
declare -a permission_objects

generate_permission_object_ids() {
  for ((i = 0; i < 5; i++)); do
    permission_ids+=("new mongoose.Types.ObjectId('$(openssl rand -hex 12)'),")
  done
}
generate_permission_object_ids

# Function to generate objects using the generated IDs
generate_permission_objects() {
  actions=("create" "update" "get" "get_all" "delete")

  for ((i = 0; i < 5; i++)); do
    permission_objects+=(
      "  {"
      "    _id: ${permission_ids[i]}"
      "    name: '${actions[i]} ${singularSpaceSeparatedLowerCase}',"
      "    description: 'can ${actions[i]} ${pluralSpaceSeparatedLowerCase}',"
      "    resource: '${singularCapitalizedUnderscored}',"
      "    action: '${actions[i]}',"
      "    status: 'active',"
      "  },"
    )
  done
   # Return the generated objects array	
  echo "${permission_objects[@]}"
}

# Call the function and store the result in a variable
permission_objects=$(generate_permission_objects)
permission_objects+="// ADD_NEW_PERMISSION_OBJECTS"

file_path="./tests/fixtures/role.fixture.ts"
escaped_permission_objects=$(printf "%s\n" "${permission_objects[@]}" | sed 's/[\/&]/\\&/g')
sed -i "s|\/\/ ADD_NEW_PERMISSION_OBJECTS|$escaped_permission_objects|g" $file_path

# escaped_permission_ids=$(printf "%s\n" "${permission_ids[@]}" | sed 's/[\/&]/\\&/g')
sed -i "s|// ADD_NEW_PERMISSION_IDS|${permission_ids[*]} // ADD_NEW_PERMISSION_IDS|g" $file_path

# Call the functions to create the files
echo `clone constant | clone controller | clone model | clone route | clone service | clone validation | clone test | clone fixture` 
echo `import_files_to_index`

yarn run prettier:fix

echo "$pluralSpaceSeparated module successfully created.."
