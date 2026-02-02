#!/bin/bash

# Base URL
API_URL="http://localhost:5000/v1"

# 1. Create a Mixed Template
echo "Creating Mixed Template..."
TEMPLATE_RESPONSE=$(curl -s -X POST "$API_URL/templates" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mixed Logic Test Template",
    "resolution": "1920x1080",
    "zones": [
      {
        "id": "zone-1",
        "type": "mixed",
        "x": 0,
        "y": 0,
        "width": 960,
        "height": 1080
      },
      {
        "id": "zone-2",
        "type": "image",
        "x": 960,
        "y": 0,
        "width": 960,
        "height": 1080
      }
    ]


  }')

echo "Template Response: $TEMPLATE_RESPONSE"
TEMPLATE_ID=$(echo $TEMPLATE_RESPONSE | grep -o '"id":"[0-9a-f]\{24\}"' | head -1 | cut -d'"' -f4)

if [ -z "$TEMPLATE_ID" ]; then
  echo "Failed to create template"
  exit 1
fi

echo "Created Template ID: $TEMPLATE_ID"

# 2. Create a Screen with Playlist
echo "Creating Screen with Playlist..."
SCREEN_RESPONSE=$(curl -s -X POST "$API_URL/screens" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Visual Logic Screen\",
    \"templateId\": \"$TEMPLATE_ID\",
    \"defaultContent\": {
      \"zone-1\": {
        \"type\": \"mixed\",
        \"playlist\": [
          {
            \"url\": \"http://example.com/video.mp4\",
            \"duration\": 15,
            \"type\": \"video\"
          },
          {
            \"url\": \"http://example.com/image.jpg\",
            \"duration\": 10,
            \"type\": \"image\"
          }
        ]
      },
      \"zone-2\": {
        \"type\": \"image\",
        \"playlist\": [
          {
            \"url\": \"http://example.com/image2.jpg\",
            \"duration\": 20,
            \"type\": \"image\"
          }
        ]
      }
    },
    \"status\": \"offline\"
  }")

echo "Screen Response: $SCREEN_RESPONSE"

if echo "$SCREEN_RESPONSE" | grep -q '"id"'; then
  echo "SUCCESS: Screen created with playlist logic."
else
  echo "FAILURE: Screen creation failed."
  exit 1
fi
