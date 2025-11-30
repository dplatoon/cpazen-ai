# 📚 CPAzen Integration Guide

## Quick Start

CPAzen tracks your affiliate campaigns in 3 simple steps:

### 1. Create a Campaign

1. Go to **Campaigns** → **New Campaign**
2. Fill in campaign details:
   - Campaign Name: "My First Campaign"
   - Select an offer from your offers library
   - Set tracking domain (default: track.cpazen.com)
   - Configure redirect mode (302 or meta refresh)

### 2. Get Your Tracking URL

After creating a campaign, you'll receive a tracking URL like:

```
https://track.cpazen.com/t/abc123def456
```

Use this URL in your traffic sources (Facebook Ads, Google Ads, TikTok Ads, etc.)

### 3. Set Up Postback

Configure your affiliate network to send conversion postbacks using either method:

#### Method 1: GET Request (Recommended for MaxBounty, ClickDealer)

**Postback URL Format:**
```
https://rdajybqalmsdycxsruon.supabase.co/functions/v1/postback?cid={CLICK_ID}&payout={PAYOUT}
```

**Parameters:**
- `cid` - Click identifier token from your network
- `payout` - Commission amount
- `status` - Optional (approved, pending, rejected) - defaults to "approved"

**MaxBounty Setup:**
```
https://rdajybqalmsdycxsruon.supabase.co/functions/v1/postback?cid=#S2#&payout=#RATE#
```
*Use #S2# for click ID and #RATE# for payout in MaxBounty's Global Postback settings*

**ClickDealer:**
```
https://rdajybqalmsdycxsruon.supabase.co/functions/v1/postback?cid={clickid}&payout={payout}
```

#### Method 2: JSON POST (Custom Integrations)

**Postback URL:**
```
https://rdajybqalmsdycxsruon.supabase.co/functions/v1/postback
```

**Request Body:**
```json
{
  "click_id": "uuid-from-click",
  "payout": 25.50,
  "status": "approved",
  "security_token": "optional_secret_key"
}
```

**Note:** Security tokens are optional but recommended for custom integrations.

---

## Advanced Features

### Sub IDs for Traffic Sources

Add sub-parameters to track specific ad campaigns, ad sets, or keywords:

```
https://track.cpazen.com/t/abc123def456?sub_id=facebook_campaign_123
```

This allows you to segment performance by traffic source within a single campaign.

### Custom Tracking Domains

1. Go to **Settings** → **Tracking Domains**
2. Add your custom domain (e.g., `go.yourdomain.com`)
3. Point your DNS to the provided CNAME
4. Select the custom domain when creating campaigns

Benefits:
- Improved brand trust
- Better click-through rates
- Professional appearance

### Bot Detection

CPAzen automatically filters suspicious traffic:
- Known bot user agents
- Data center IP addresses
- Suspicious click patterns
- Unusual request headers

View bot-flagged traffic in **Analytics** → **Click Details** with the "Show Bots" filter.

---

## API Reference

### Track Click (GET)
```
GET /t/{campaign_id}
Query Parameters:
  - sub_id (optional): Custom tracking parameter
  - source (optional): Traffic source identifier
```

**Response:**
- 302 redirect to offer URL (or meta refresh based on settings)
- Sets click_id for conversion tracking

### Track Conversion

**GET Method (Networks):**
```
GET /functions/v1/postback
Query Parameters:
  - cid: Click ID (required)
  - payout: Conversion amount (required)
  - status: approved|pending|rejected (optional, default: approved)
```

**POST Method (Custom):**
```
POST /functions/v1/postback
Content-Type: application/json

Body:
{
  "click_id": "uuid",
  "payout": 25.50,
  "status": "approved|pending|rejected",
  "security_token": "optional_secret_key"
}
```

**Response:**
```json
{
  "success": true,
  "conversion_id": "uuid",
  "message": "Conversion recorded"
}
```

**Error Responses:**
- `400` - Invalid request (missing required fields)
- `401` - Invalid security token
- `404` - Click ID not found
- `500` - Server error

---

## Testing Your Integration

### 1. Test Click Tracking

```bash
# Click your tracking URL
curl -L "https://track.cpazen.com/t/YOUR_CAMPAIGN_ID?sub_id=test"

# Check if click was recorded in Analytics
```

### 2. Test Conversion Tracking

**Using GET (MaxBounty style):**
```bash
# Get a valid click_id from your clicks table first
curl "https://rdajybqalmsdycxsruon.supabase.co/functions/v1/postback?cid=YOUR_CLICK_ID&payout=25.00&status=approved"
```

**Using POST (Custom integration):**
```bash
curl -X POST "https://rdajybqalmsdycxsruon.supabase.co/functions/v1/postback" \
  -H "Content-Type: application/json" \
  -d '{
    "click_id": "YOUR_CLICK_ID",
    "payout": 25.00,
    "status": "approved"
  }'
```

Expected Response:
```json
{
  "success": true,
  "conversion_id": "...",
  "message": "Conversion recorded successfully"
}
```

### 3. Verify in Dashboard

After testing:
1. Go to **Dashboard** to see updated revenue
2. Check **Analytics** → **Conversions** for the test conversion
3. View **Campaign Details** for click and conversion data

---

## Troubleshooting

### Clicks Not Tracking

**Possible Causes:**
- Invalid campaign ID in tracking URL
- Campaign is paused or archived
- Rate limiting (too many clicks from same IP)

**Solution:**
1. Verify campaign status in Campaigns page
2. Check campaign ID in tracking URL matches
3. Test from different IP address

### Conversions Not Tracking

**Checklist:**
✅ Postback URL is correct  
✅ Using correct method (GET for MaxBounty, POST for custom)  
✅ Click ID parameter matches network format (cid for GET, click_id for POST)  
✅ Click ID exists and was generated by a valid click  
✅ Network is sending proper parameters

**Debug Steps:**
1. Check Edge Function logs in backend
2. Test postback manually with curl (see Testing section)
3. Verify click_id exists in clicks table
4. For MaxBounty: Ensure you're using `cid=#S2#` not `click_id=`
5. Check network's postback testing tool if available

### Low Conversion Rate

**Optimization Steps:**
1. Run **AI Campaign Optimizer** for recommendations
2. Check offer page quality and loading speed
3. Verify geo-targeting matches offer availability
4. Review bot-flagged traffic percentage
5. Test different traffic sources

### Rate Limiting Issues

Default limits:
- 100 clicks per IP per minute
- Automatically cleaned after 1 hour

If legitimate traffic is being rate-limited:
1. Contact support to adjust limits
2. Use multiple tracking domains
3. Implement IP whitelisting

---

## Best Practices

### Campaign Naming
Use descriptive names that include:
- Vertical (e.g., "Finance", "Gaming")
- Geo target (e.g., "US", "Global")
- Offer name

Example: `Finance - Credit Card - US - Facebook`

### Security
- Never share your security token publicly
- Rotate security token monthly (Settings → Profile)
- Use HTTPS for all postback URLs
- Whitelist affiliate network IPs when possible

### Performance
- Monitor bot traffic percentage (should be < 10%)
- Set up separate campaigns for different geos
- Use sub_ids to track ad-level performance
- Review AI recommendations weekly

### Scaling
- Start with 2-3 offers per vertical
- Test multiple traffic sources
- Implement custom tracking domains
- Use AI tools for optimization insights

---

## Support

- 📧 **Email:** support@cpazen.com
- 💬 **Live Chat:** Available in app (bottom right)
- 📖 **Documentation:** https://docs.cpazen.com
- 🎥 **Video Tutorials:** Coming soon

---

## Changelog

**v1.0.0** - Initial Release
- Core click tracking
- Conversion postback system
- AI-powered optimization tools
- Analytics dashboard
- Bot detection
- Multi-geo support
