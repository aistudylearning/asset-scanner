const https = require('https');

// Import the asset generation logic
const { execSync } = require('child_process');

// Test configuration
const TIMEOUT = 5000;
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

// Sample assets from each category
const testAssets = [
  // Commodities
  { name: 'Gold', tvSymbol: 'COMEX:GC1!' },
  { name: 'Silver', tvSymbol: 'COMEX:SI1!' },
  
  // US - NASDAQ
  { name: 'AAPL', tvSymbol: 'NASDAQ:AAPL' },
  { name: 'MSFT', tvSymbol: 'NASDAQ:MSFT' },
  { name: 'NVDA', tvSymbol: 'NASDAQ:NVDA' },
  
  // US - NYSE
  { name: 'JPM', tvSymbol: 'NYSE:JPM' },
  { name: 'WMT', tvSymbol: 'NYSE:WMT' },
  { name: 'MCD', tvSymbol: 'NYSE:MCD' },
  
  // Hong Kong (with leading zeros stripped)
  { name: '0700', tvSymbol: 'HKEX:700' },
  { name: '9988', tvSymbol: 'HKEX:9988' },
  { name: '1398', tvSymbol: 'HKEX:1398' },
  
  // India
  { name: 'RELIANCE', tvSymbol: 'NSE:RELIANCE' },
  { name: 'TCS', tvSymbol: 'NSE:TCS' },
  
  // Vietnam
  { name: 'VCB', tvSymbol: 'HOSE:VCB' },
  { name: 'VNM', tvSymbol: 'HOSE:VNM' }
];

function checkTradingViewLink(tvSymbol) {
  return new Promise((resolve, reject) => {
    const url = `https://www.tradingview.com/chart/?symbol=${tvSymbol}`;
    
    const req = https.get(url, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: TIMEOUT
    }, (res) => {
      const success = res.statusCode === 200;
      resolve({
        symbol: tvSymbol,
        url: url,
        status: res.statusCode,
        success: success
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timeout for ${tvSymbol}`));
    });
    
    req.on('error', (err) => {
      reject(err);
    });
  });
}

async function runTests() {
  console.log('🧪 Testing TradingView Links for Asset Scanner\n');
  console.log(`Testing ${testAssets.length} sample assets...\n`);
  
  let passed = 0;
  let failed = 0;
  const failures = [];
  
  for (const asset of testAssets) {
    try {
      const result = await checkTradingViewLink(asset.tvSymbol);
      
      if (result.success) {
        console.log(`✅ ${asset.name.padEnd(15)} ${result.symbol.padEnd(20)} → ${result.status}`);
        passed++;
      } else {
        console.log(`❌ ${asset.name.padEnd(15)} ${result.symbol.padEnd(20)} → ${result.status}`);
        failed++;
        failures.push(result);
      }
      
      // Rate limiting: 100ms delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (err) {
      console.log(`❌ ${asset.name.padEnd(15)} ${asset.tvSymbol.padEnd(20)} → ERROR: ${err.message}`);
      failed++;
      failures.push({ symbol: asset.tvSymbol, error: err.message });
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Test Results:`);
  console.log(`   Passed: ${passed}/${testAssets.length}`);
  console.log(`   Failed: ${failed}/${testAssets.length}`);
  
  if (failures.length > 0) {
    console.log('\n❌ Failed Links:');
    failures.forEach(f => {
      console.log(`   - ${f.symbol}: ${f.status || f.error}`);
    });
    process.exit(1);
  } else {
    console.log('\n✅ All TradingView links are valid!');
    process.exit(0);
  }
}

// Run tests
runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
