#!/bin/bash
API_URL="http://localhost:5000/v1"
BACKEND_LOG="backend/logs/app.log" # Assuming file logging or using command output? 
# We can't easily grep command output from here. 
# But we can grep 'backend.log' if standard logging writes there.
# Let's assume we can't grep dynamic internal buffer easily.
# But I added console.log. Does it go to a file? 
# The logging config says 'backend.log' is a thing.
# Let's try reading from there.

EMAIL="verif_$(date +%s)@example.com"
PASSWORD="Password@123"

# 1. Register
echo "Registering user: $EMAIL"
curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"first_name\": \"Std\",
    \"last_name\": \"User\",
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"confirmPassword\": \"$PASSWORD\",
    \"companyName\": \"Test Company\"
  }" > /dev/null

echo "Waiting for OTP log..."
sleep 5

# 2. Get OTP from backend log (assuming output to stdout/stderr is captured in my tool context, 
# asking the agent to verify. But as a script, I can't access that. 
# I will make the script print 'Please verify OTP manually' or try to verify via API if I can find it.
# Actually, I (the agent) will run the registration command separately, check status, then run verification.)

echo "Please check logs for [EMAIL OTP] for $EMAIL"
