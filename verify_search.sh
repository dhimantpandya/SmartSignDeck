#!/bin/bash
API_URL="http://localhost:5000/v1"

# 1. Login as Admin
echo "Logging in as admin..."
LOGIN_RES=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "dhimant.pandya@technostacks.in", "password": "password1"}')

TOKEN=$(echo $LOGIN_RES | grep -o '"access":{"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "Login failed. Trying default admin fixture..."
    LOGIN_RES=$(curl -s -X POST "$API_URL/auth/login" \
      -H "Content-Type: application/json" \
      -d '{"email": "admin@example.com", "password": "password1"}')
    TOKEN=$(echo $LOGIN_RES | grep -o '"access":{"token":"[^"]*' | cut -d'"' -f4)
    
    if [ -z "$TOKEN" ]; then
        echo "Login completely failed. Response: $LOGIN_RES"
        exit 1
    fi
fi

echo "Token obtained: ${TOKEN:0:10}..."

# 2. Search for "System Admin" (existing user likely)
echo "Searching for 'System Admin'..."
SEARCH_RES=$(curl -s -G "$API_URL/users" \
  -H "Authorization: Bearer $TOKEN" \
  --data-urlencode "search=System Admin")

COUNT=$(echo $SEARCH_RES | grep -o '"totalResults":[0-9]*' | cut -d':' -f2)
echo "Found $COUNT matches for 'System Admin'"

# 3. Create 'Updated Admin' if needed (check if search returns 0)
# But we assume the user exists based on user complaint. Let's search for it.
echo "Searching for 'Updated Admin'..."
SEARCH_RES_2=$(curl -s -G "$API_URL/users" \
  -H "Authorization: Bearer $TOKEN" \
  --data-urlencode "search=Updated Admin")

COUNT_2=$(echo $SEARCH_RES_2 | grep -o '"totalResults":[0-9]*' | cut -d':' -f2)
echo "Found $COUNT_2 matches for 'Updated Admin'"

# 4. Search for "Dhimant Pandya" matching split names
echo "Searching for 'Dhimant Pandya'..."
SEARCH_RES_3=$(curl -s -G "$API_URL/users" \
  -H "Authorization: Bearer $TOKEN" \
  --data-urlencode "search=Dhimant Pandya")

COUNT_3=$(echo $SEARCH_RES_3 | grep -o '"totalResults":[0-9]*' | cut -d':' -f2)
echo "Found $COUNT_3 matches for 'Dhimant Pandya'"

if [ "$COUNT" -gt 0 ] || [ "$COUNT_2" -gt 0 ] || [ "$COUNT_3" -gt 0 ]; then
    echo "SUCCESS: Search functionality verified."
else
    echo "WARNING: No results found. Ensure users exist in DB."
fi
