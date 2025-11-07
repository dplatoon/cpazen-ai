/**
 * CPAzen Load Testing Script
 * 
 * Tests the click tracking system under load
 * Run with: node load-test.js
 */

const https = require('https');
const http = require('http');

const CONFIG = {
  // Replace with your actual tracking URL
  trackingUrl: 'https://track.cpazen.com/t/YOUR_CAMPAIGN_ID',
  
  // Test parameters
  concurrentRequests: 50,
  totalRequests: 500,
  delayBetweenBatches: 2000, // ms
  
  // Request timeout
  timeout: 10000 // ms
};

// Track results
const results = {
  success: 0,
  failed: 0,
  timeout: 0,
  total: 0,
  responseTimes: [],
  errors: []
};

async function simulateClick(clickId) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const url = new URL(CONFIG.trackingUrl);
    url.searchParams.append('sub_id', clickId);
    url.searchParams.append('source', 'load-test');
    
    const protocol = url.protocol === 'https:' ? https : http;
    
    const req = protocol.get(url.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    }, (res) => {
      const responseTime = Date.now() - startTime;
      results.responseTimes.push(responseTime);
      
      // Consider 2xx, 3xx as success
      if (res.statusCode >= 200 && res.statusCode < 400) {
        results.success++;
        resolve({ 
          status: 'success', 
          statusCode: res.statusCode, 
          responseTime,
          clickId 
        });
      } else {
        results.failed++;
        results.errors.push({
          clickId,
          statusCode: res.statusCode,
          responseTime
        });
        resolve({ 
          status: 'failed', 
          statusCode: res.statusCode, 
          responseTime,
          clickId 
        });
      }
      
      // Consume response data to free up memory
      res.resume();
    });
    
    req.on('error', (error) => {
      const responseTime = Date.now() - startTime;
      results.failed++;
      results.errors.push({
        clickId,
        error: error.message,
        responseTime
      });
      resolve({ 
        status: 'error', 
        error: error.message, 
        responseTime,
        clickId 
      });
    });
    
    req.setTimeout(CONFIG.timeout, () => {
      req.destroy();
      const responseTime = Date.now() - startTime;
      results.timeout++;
      results.failed++;
      results.errors.push({
        clickId,
        error: 'Timeout',
        responseTime
      });
      resolve({ 
        status: 'timeout', 
        responseTime,
        clickId 
      });
    });
  });
}

function calculateStats() {
  if (results.responseTimes.length === 0) {
    return { avg: 0, min: 0, max: 0, p95: 0, p99: 0 };
  }
  
  const sorted = results.responseTimes.sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  
  return {
    avg: Math.round(sum / sorted.length),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)]
  };
}

async function runLoadTest() {
  console.log('🚀 Starting CPAzen Load Test...');
  console.log('================================\n');
  console.log(`Configuration:`);
  console.log(`  Total requests: ${CONFIG.totalRequests}`);
  console.log(`  Concurrent: ${CONFIG.concurrentRequests}`);
  console.log(`  Tracking URL: ${CONFIG.trackingUrl}`);
  console.log(`  Timeout: ${CONFIG.timeout}ms\n`);
  
  const startTime = Date.now();
  const batchCount = Math.ceil(CONFIG.totalRequests / CONFIG.concurrentRequests);
  
  for (let batch = 0; batch < batchCount; batch++) {
    const batchStart = Date.now();
    const promises = [];
    const batchSize = Math.min(
      CONFIG.concurrentRequests,
      CONFIG.totalRequests - results.total
    );
    
    for (let i = 0; i < batchSize; i++) {
      const clickId = `load_test_${Date.now()}_${results.total}_${Math.random().toString(36).substr(2, 9)}`;
      promises.push(simulateClick(clickId));
      results.total++;
    }
    
    await Promise.all(promises);
    
    const batchTime = Date.now() - batchStart;
    const progress = ((results.total / CONFIG.totalRequests) * 100).toFixed(1);
    
    console.log(`Batch ${batch + 1}/${batchCount}: ${batchSize} requests in ${batchTime}ms (${progress}% complete)`);
    
    // Delay between batches (except for the last one)
    if (results.total < CONFIG.totalRequests) {
      await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenBatches));
    }
  }
  
  const totalTime = Date.now() - startTime;
  const stats = calculateStats();
  
  console.log('\n📊 Load Test Results:');
  console.log('=====================\n');
  console.log(`Total time: ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`);
  console.log(`\nRequests:`);
  console.log(`  Total: ${results.total}`);
  console.log(`  Success: ${results.success} (${(results.success/results.total*100).toFixed(1)}%)`);
  console.log(`  Failed: ${results.failed} (${(results.failed/results.total*100).toFixed(1)}%)`);
  console.log(`  Timeout: ${results.timeout} (${(results.timeout/results.total*100).toFixed(1)}%)`);
  console.log(`\nPerformance:`);
  console.log(`  Requests/sec: ${(results.total / (totalTime / 1000)).toFixed(2)}`);
  console.log(`  Avg response time: ${stats.avg}ms`);
  console.log(`  Min response time: ${stats.min}ms`);
  console.log(`  Max response time: ${stats.max}ms`);
  console.log(`  95th percentile: ${stats.p95}ms`);
  console.log(`  99th percentile: ${stats.p99}ms`);
  
  if (results.errors.length > 0) {
    console.log(`\n⚠️  Errors (showing first 10):`);
    results.errors.slice(0, 10).forEach((err, idx) => {
      console.log(`  ${idx + 1}. ${err.clickId}: ${err.error || `HTTP ${err.statusCode}`}`);
    });
  }
  
  console.log('\n✅ Load test complete!');
  console.log('\nNext steps:');
  console.log('1. Check Analytics dashboard for recorded clicks');
  console.log('2. Review edge function logs for any errors');
  console.log('3. Verify rate limiting is working correctly');
  console.log('4. Check database for data consistency');
}

// Validate configuration before running
if (CONFIG.trackingUrl.includes('YOUR_CAMPAIGN_ID')) {
  console.error('❌ Error: Please update CONFIG.trackingUrl with your actual campaign ID');
  console.error('   Find your campaign ID in the Campaigns page');
  process.exit(1);
}

runLoadTest().catch(error => {
  console.error('❌ Load test failed:', error);
  process.exit(1);
});
