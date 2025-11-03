# Cpazen Edge Function Verification (Windows PowerShell)
# Tests if track-click and postback functions are deployed and working

Write-Host "🔍 CPAZEN EDGE FUNCTION VERIFICATION" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$SUPABASE_URL = "https://rdajybqalmsdycxsruon.supabase.co"
$TRACK_CLICK_URL = "$SUPABASE_URL/functions/v1/track-click"
$POSTBACK_URL = "$SUPABASE_URL/functions/v1/postback"

# Test 1: Track-Click
Write-Host "📡 Test 1: Track-Click Function" -ForegroundColor Yellow
Write-Host "Testing: $TRACK_CLICK_URL"
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "$TRACK_CLICK_URL/00000000-0000-0000-0000-000000000000?sub=test" -Method GET -MaximumRedirection 0 -ErrorAction SilentlyContinue
    $statusCode = $response.StatusCode
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
}

if ($statusCode -eq 404) {
    Write-Host "❌ FAILED: Function NOT deployed (404)" -ForegroundColor Red
    $trackClickStatus = "FAILED"
} elseif ($statusCode -eq 302) {
    Write-Host "✅ PASSED: Function working (302 Redirect)" -ForegroundColor Green
    $trackClickStatus = "PASSED"
} elseif ($statusCode -eq 400) {
    Write-Host "✅ PASSED: Function deployed (400 validation)" -ForegroundColor Green
    $trackClickStatus = "PASSED"
} else {
    Write-Host "⚠️  HTTP $statusCode" -ForegroundColor Yellow
    $trackClickStatus = "UNKNOWN"
}
Write-Host ""

# Test 2: Postback
Write-Host "📨 Test 2: Postback Function" -ForegroundColor Yellow
Write-Host "Testing: $POSTBACK_URL"
Write-Host ""

$body = @{
    click_id = "00000000-0000-0000-0000-000000000000"
    payout = 10
    status = "approved"
    security_token = "test"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri $POSTBACK_URL -Method POST -Body $body -ContentType "application/json" -ErrorAction SilentlyContinue
    $statusCode = $response.StatusCode
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
}

if ($statusCode -eq 404) {
    Write-Host "❌ FAILED: Function NOT deployed (404)" -ForegroundColor Red
    $postbackStatus = "FAILED"
} elseif ($statusCode -in @(400, 401)) {
    Write-Host "✅ PASSED: Function deployed ($statusCode expected)" -ForegroundColor Green
    $postbackStatus = "PASSED"
} else {
    Write-Host "⚠️  HTTP $statusCode" -ForegroundColor Yellow
    $postbackStatus = "UNKNOWN"
}
Write-Host ""

# Summary
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "📊 SUMMARY" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Track-Click: $trackClickStatus"
Write-Host "Postback:    $postbackStatus"
Write-Host ""

if ($trackClickStatus -eq "PASSED" -and $postbackStatus -eq "PASSED") {
    Write-Host "🎉 All functions deployed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ Deployment needed!" -ForegroundColor Red
    exit 1
}
