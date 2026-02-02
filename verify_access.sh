#!/bin/bash
API_URL="http://localhost:5000/v1"

# 1. Register a new standard user
EMAIL="stduser_$(date +%s)@example.com"
echo "Registering user: $EMAIL"

REG_RES=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"first_name\": \"Std\",
    \"last_name\": \"User\",
    \"email\": \"$EMAIL\",
    \"password\": \"Password@123\",
    \"confirmPassword\": \"Password@123\",
    \"companyName\": \"Test Company\"
  }")

TOKEN=$(echo $REG_RES | grep -o '"access":{"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "Registration failed. Response: $REG_RES"
    exit 1
fi
echo "User registered. Token: ${TOKEN:0:10}..."

# 2. Access Users Endpoint
echo "Accessing /v1/users with standard user token..."
USERS_RES=$(curl -s -o /dev/null -w "%{http_code}" -G "$API_URL/users" \
  -H "Authorization: Bearer $TOKEN")

echo "Response Code: $USERS_RES"

if [ "$USERS_RES" -eq 200 ]; then
    echo "SUCCESS: Standard user can access /v1/users"
else
    echo "FAILURE: Access denied with code $USERS_RES"
    exit 1
fi
