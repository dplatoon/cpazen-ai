#!/bin/bash

# Cpazen Edge Function Verification Script
# Tests if track-click and postback functions are deployed and working

echo "🔍 CPAZEN EDGE FUNCTION VERIFICATION"
echo "====================================="
echo ""

SUPABASE_URL="https://rdajybqalmsdycxsruon.supabase.co"
TRACK_CLICK_URL="${SUPABASE_URL}/functions/v1/track-click"
POSTBACK_URL="${SUPABASE_URL}/functions/v1/postback"

# Test 1: Track-Click Function
echo "📡 Test 1: Track-Click Function Deployment"
echo "-------------------------------------------"
echo "Testing: ${TRACK_CLICK_URL}"
echo ""

RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
  "${TRACK_CLICK_URL}/00000000-0000-0000-0000-000000000000?sub=test" \
  2>&1)

if [ "$RESPONSE" == "404" ]; then
  echo "❌ FAILED: Function NOT deployed (404 Not Found)"
  echo ""
  TRACK_CLICK_STATUS="FAILED"
elif [ "$RESPONSE" == "302" ]; then
  echo "✅ PASSED: Function deployed and working (302 Redirect)"
  echo ""
  TRACK_CLICK_STATUS="PASSED"
elif [ "$RESPONSE" == "400" ]; then
  echo "✅ PASSED: Function deployed (400 validation error is expected)"
  echo ""
  TRACK_CLICK_STATUS="PASSED"
elif [ "$RESPONSE" == "500" ]; then
  echo "⚠️  WARNING: Function deployed but has internal error (500)"
  echo ""
  TRACK_CLICK_STATUS="ERROR"
else
  echo "⚠️  UNEXPECTED: HTTP $RESPONSE"
  echo ""
  TRACK_CLICK_STATUS="UNKNOWN"
fi

# Test 2: Postback Function
echo "📨 Test 2: Postback Function Deployment"
echo "----------------------------------------"
echo "Testing: ${POSTBACK_URL}"
echo ""

RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "${POSTBACK_URL}" \
  -H "Content-Type: application/json" \
  -d '{"click_id":"00000000-0000-0000-0000-000000000000","payout":10,"status":"approved","security_token":"test"}' \
  2>&1)

if [ "$RESPONSE" == "404" ]; then
  echo "❌ FAILED: Function NOT deployed (404 Not Found)"
  echo ""
  POSTBACK_STATUS="FAILED"
elif [ "$RESPONSE" == "401" ]; then
  echo "✅ PASSED: Function deployed (401 auth error is expected)"
  echo ""
  POSTBACK_STATUS="PASSED"
elif [ "$RESPONSE" == "400" ]; then
  echo "✅ PASSED: Function deployed (400 validation error is expected)"
  echo ""
  POSTBACK_STATUS="PASSED"
elif [ "$RESPONSE" == "500" ]; then
  echo "⚠️  WARNING: Function deployed but has internal error (500)"
  echo ""
  POSTBACK_STATUS="ERROR"
else
  echo "⚠️  UNEXPECTED: HTTP $RESPONSE"
  echo ""
  POSTBACK_STATUS="UNKNOWN"
fi

# Summary
echo "================================================"
echo "📊 SUMMARY"
echo "================================================"
echo ""
echo "Track-Click Function:    $TRACK_CLICK_STATUS"
echo "Postback Function:       $POSTBACK_STATUS"
echo ""

if [ "$TRACK_CLICK_STATUS" == "PASSED" ] && [ "$POSTBACK_STATUS" == "PASSED" ]; then
  echo "🎉 All critical functions are deployed!"
  echo ""
  echo "📋 Next Steps:"
  echo "1. Create a test campaign in dashboard"
  echo "2. Generate a tracking link"
  echo "3. Click the link and verify data appears in analytics"
  echo "4. Send test postback and verify conversion recorded"
  echo ""
  exit 0
elif [ "$TRACK_CLICK_STATUS" == "FAILED" ] || [ "$POSTBACK_STATUS" == "FAILED" ]; then
  echo "❌ Critical functions NOT deployed!"
  echo ""
  echo "Edge functions deploy automatically with your code."
  echo "Check the deployment logs in Lovable for any errors."
  echo ""
  exit 1
else
  echo "⚠️  Some tests returned errors or unexpected results"
  echo ""
  echo "Check function logs for more details."
  echo ""
  exit 2
fi
