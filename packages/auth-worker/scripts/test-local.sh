#!/bin/bash

# Simple test script for local auth service
# Usage: ./scripts/test-local.sh

set -e

AUTH_URL="http://localhost:8788"
TIMESTAMP=$(date +%s)
TEST_EMAIL="test-${TIMESTAMP}@example.com"
TEST_PASSWORD="SecureTestPass123!"

echo "🧪 Testing Local Auth Service"
echo "============================="
echo "📍 Service URL: $AUTH_URL"
echo "📧 Test Email: $TEST_EMAIL"
echo ""

# Test health check
echo "1️⃣ Testing health endpoint..."
curl -s "$AUTH_URL/health" | jq .
echo ""

# Test signup
echo "2️⃣ Testing user signup..."
SIGNUP_RESPONSE=$(curl -s -X POST "$AUTH_URL/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$TEST_EMAIL\", \"password\": \"$TEST_PASSWORD\"}")

echo "$SIGNUP_RESPONSE" | jq .

# Extract tokens from signup response
ACCESS_TOKEN=$(echo "$SIGNUP_RESPONSE" | jq -r '.accessToken // empty')
REFRESH_TOKEN=$(echo "$SIGNUP_RESPONSE" | jq -r '.refreshToken // empty')

if [ -z "$ACCESS_TOKEN" ] || [ "$ACCESS_TOKEN" = "null" ]; then
  echo "❌ Signup failed - no access token received"
  exit 1
fi

echo ""
echo "3️⃣ Testing user login..."
LOGIN_RESPONSE=$(curl -s -X POST "$AUTH_URL/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$TEST_EMAIL\", \"password\": \"$TEST_PASSWORD\"}")

echo "$LOGIN_RESPONSE" | jq .

# Test token refresh
if [ -n "$REFRESH_TOKEN" ] && [ "$REFRESH_TOKEN" != "null" ]; then
  echo ""
  echo "4️⃣ Testing token refresh..."
  curl -s -X POST "$AUTH_URL/refresh" \
    -H "Content-Type: application/json" \
    -d "{\"refreshToken\": \"$REFRESH_TOKEN\"}" | jq .
fi

echo ""
echo "5️⃣ Testing invalid credentials..."
curl -s -X POST "$AUTH_URL/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$TEST_EMAIL\", \"password\": \"WrongPassword123!\"}" | jq .

echo ""
echo "✅ Local testing complete!"