#!/bin/bash
API_URL="http://localhost:5000/v1"
EMAIL="verif_1769772492@example.com"
OTP="212466"

# 1. Login
echo "Logging in as $EMAIL..."
LOGIN_RES=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"Password@123\"
  }")

TOKEN=$(echo $LOGIN_RES | grep -o '"access":{"token":"[^"]*' | cut -d'"' -f6)

if [ -z "$TOKEN" ]; then
    echo "Verification failed. Response: $VERIFY_RES"
    exit 1
fi
echo "User verified. Token: ${TOKEN:0:10}..."

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

# 3. Search for "System Admin"
echo "Searching for 'System Admin'..."
SEARCH_RES=$(curl -s -G "$API_URL/users" \
  -H "Authorization: Bearer $TOKEN" \
  --data-urlencode "search=System Admin")

COUNT=$(echo $SEARCH_RES | grep -o '"totalResults":[0-9]*' | cut -d':' -f2)
echo "Found $COUNT matches for 'System Admin'"
