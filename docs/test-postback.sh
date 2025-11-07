#!/bin/bash

echo "🧪 Testing CPAzen Postback Endpoint"
echo "=================================="
echo ""

# Configuration - Replace these values with your actual data
BASE_URL="https://rdajybqalmsdycxsruon.supabase.co/functions/v1"
CLICK_ID="test_click_$(date +%s)"
SECRET_KEY="your_secret_key_here"

echo "Using BASE_URL: $BASE_URL"
echo "Using CLICK_ID: $CLICK_ID"
echo ""

# Test 1: Valid Conversion
echo "Test 1: Valid conversion with all parameters"
echo "----------------------------------------------"
curl -X POST "$BASE_URL/postback" \
  -H "Content-Type: application/json" \
  -d "{
    \"click_id\": \"$CLICK_ID\",
    \"payout\": 25.50,
    \"status\": \"approved\",
    \"security_token\": \"$SECRET_KEY\"
  }"
echo -e "\n"

# Test 2: Missing click_id
echo "Test 2: Missing click_id (should fail with 400)"
echo "------------------------------------------------"
curl -X POST "$BASE_URL/postback" \
  -H "Content-Type: application/json" \
  -d "{
    \"payout\": 25.50,
    \"status\": \"approved\",
    \"security_token\": \"$SECRET_KEY\"
  }"
echo -e "\n"

# Test 3: Invalid secret key
echo "Test 3: Invalid security token (should fail with 401)"
echo "------------------------------------------------------"
curl -X POST "$BASE_URL/postback" \
  -H "Content-Type: application/json" \
  -d "{
    \"click_id\": \"$CLICK_ID\",
    \"payout\": 25.50,
    \"status\": \"approved\",
    \"security_token\": \"wrong_secret\"
  }"
echo -e "\n"

# Test 4: Duplicate conversion (idempotency test)
echo "Test 4: Duplicate conversion (should be idempotent)"
echo "----------------------------------------------------"
curl -X POST "$BASE_URL/postback" \
  -H "Content-Type: application/json" \
  -d "{
    \"click_id\": \"$CLICK_ID\",
    \"payout\": 25.50,
    \"status\": \"approved\",
    \"security_token\": \"$SECRET_KEY\"
  }"
echo -e "\n"

# Test 5: Different statuses
echo "Test 5: Pending conversion"
echo "---------------------------"
curl -X POST "$BASE_URL/postback" \
  -H "Content-Type: application/json" \
  -d "{
    \"click_id\": \"test_pending_$(date +%s)\",
    \"payout\": 30.00,
    \"status\": \"pending\",
    \"security_token\": \"$SECRET_KEY\"
  }"
echo -e "\n"

echo "Test 6: Rejected conversion"
echo "----------------------------"
curl -X POST "$BASE_URL/postback" \
  -H "Content-Type: application/json" \
  -d "{
    \"click_id\": \"test_rejected_$(date +%s)\",
    \"payout\": 0.00,
    \"status\": \"rejected\",
    \"security_token\": \"$SECRET_KEY\"
  }"
echo -e "\n"

echo "✅ Postback tests complete!"
echo ""
echo "Next steps:"
echo "1. Check your database for the test conversions"
echo "2. Verify conversions appear in Analytics dashboard"
echo "3. Test with real click IDs from your campaigns"
