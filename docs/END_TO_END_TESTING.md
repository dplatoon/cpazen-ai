# 🎯 End-to-End Testing Guide for Cpazen

Complete testing checklist to verify your CPA tracking system works end-to-end.

---

## 🎯 TESTING PHASES

1. **Phase 1:** Authentication (5 minutes)
2. **Phase 2:** Campaign Management (10 minutes)
3. **Phase 3:** Click Tracking (15 minutes)
4. **Phase 4:** Conversion Tracking (10 minutes)
5. **Phase 5:** Data Verification (10 minutes)

**Total Time:** ~50 minutes

---

## 📋 PHASE 1: AUTHENTICATION TESTING

### Test 1.1: New User Signup

1. Open incognito/private browser
2. Navigate to: `https://your-domain.com/auth`
3. Click "Sign Up"
4. Enter email and password
5. Click "Sign Up"

**Expected Results:**
- ✅ Success message appears
- ✅ Redirects to dashboard
- ✅ User profile visible

### Test 1.2: Login

1. Log out
2. Navigate to auth page
3. Enter credentials
4. Click "Sign In"

**Expected Results:**
- ✅ "Welcome Back!" message
- ✅ Redirects to dashboard
- ✅ Navigation menu accessible

### Test 1.3: Protected Routes

1. Log out
2. Try to access: `/dashboard`

**Expected Results:**
- ✅ Redirects to `/auth`
- ✅ Cannot access without login

---

## 📋 PHASE 2: CAMPAIGN MANAGEMENT

### Test 2.1: Create Campaign

1. Navigate to `/campaigns`
2. Click "Create Campaign"
3. Fill in campaign details
4. Select an offer
5. Click "Create"

**Expected Results:**
- ✅ Campaign created
- ✅ Toast notification shows
- ✅ Campaign appears in list

### Test 2.2: View Campaign Details

1. Click on created campaign
2. Check tracking link is displayed
3. Copy tracking URL

**Expected Results:**
- ✅ Details load correctly
- ✅ Tracking URL format correct

---

## 📋 PHASE 3: CLICK TRACKING

### Test 3.1: Manual Click Test

```bash
curl -i "YOUR_TRACKING_URL?sub=test-001"
```

**Expected Results:**
- ✅ HTTP 302 redirect
- ✅ Redirects to offer URL
- ✅ Sub parameter passed through

### Test 3.2: Browser Click Test

1. Open tracking URL in browser
2. Verify redirect works

**Expected Results:**
- ✅ Redirects quickly
- ✅ Lands on correct page

### Test 3.3: Database Verification

Check clicks table in backend:

**Expected Data:**
- ✅ Click record exists
- ✅ IP address populated
- ✅ User agent populated
- ✅ Timestamp correct

---

## 📋 PHASE 4: CONVERSION TRACKING

### Test 4.1: Get Security Token

1. Go to `/profile`
2. Find API Security section
3. Copy security token

### Test 4.2: Trigger Conversion

```bash
curl -X POST "YOUR_POSTBACK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "click_id": "YOUR_CLICK_ID",
    "payout": 25.00,
    "status": "approved",
    "security_token": "YOUR_TOKEN"
  }'
```

**Expected Results:**
- ✅ HTTP 200 response
- ✅ Success message returned

### Test 4.3: Database Verification

Check conversions table:

**Expected Data:**
- ✅ Conversion record exists
- ✅ Payout amount correct
- ✅ Status set properly

---

## 📋 PHASE 5: DATA VERIFICATION

### Test 5.1: Analytics Page

1. Navigate to `/analytics`
2. Verify data displays

**Expected Results:**
- ✅ Click count correct
- ✅ Conversion count correct
- ✅ Revenue calculated
- ✅ Charts render

### Test 5.2: Dashboard Update

1. Go to `/dashboard`
2. Check campaign statistics

**Expected Results:**
- ✅ Stats updated
- ✅ Real-time or near real-time

---

## ✅ SUCCESS CRITERIA

All phases must pass:

- [ ] Phase 1: Authentication ✅
- [ ] Phase 2: Campaign Management ✅
- [ ] Phase 3: Click Tracking ✅
- [ ] Phase 4: Conversion Tracking ✅
- [ ] Phase 5: Data Verification ✅

---

## 🔧 TROUBLESHOOTING

### Click not recorded

**Possible causes:**
1. Edge function not deployed
2. RLS policies blocking
3. Schema mismatch

**Solutions:**
1. Run verification script
2. Check function logs
3. Verify table schema

### Conversion not recorded

**Possible causes:**
1. Invalid click_id
2. Wrong security token
3. Duplicate conversion

**Solutions:**
1. Verify click exists
2. Regenerate token
3. Check for existing conversion

---

## 🚀 READY FOR PRODUCTION?

If all tests pass:
1. ✅ Enable fraud detection
2. ✅ Set up monitoring
3. ✅ Invite beta users
4. ✅ Launch publicly

---

**Status:** Ready to use
**Time:** 50 minutes
**Difficulty:** Beginner-friendly
