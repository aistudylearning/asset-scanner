const https = require('https');

// Copy the FIXED RSI calculation
function calculateRSI(closes) {
  if (closes.length < 15) return 50;
  
  // Use the LAST 15 closes (not the first!)
  const recentCloses = closes.slice(-15);
  
  let gains = 0, losses = 0;
  for (let i = 1; i < recentCloses.length; i++) {
    const diff = recentCloses[i] - recentCloses[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  
  const avgGain = gains / 14;
  const avgLoss = losses / 14;
  
  // Handle edge cases
  if (avgLoss === 0) return avgGain === 0 ? 50 : 100;
  if (avgGain === 0) return 0;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

// Test with known RSI values
function testKnownRSI() {
  console.log('🧪 Testing RSI Calculation with Known Values\n');
  
  // Test case 1: Trending up (should have high RSI)
  const uptrend = [100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114];
  const rsiUp = calculateRSI(uptrend);
  console.log(`Test 1 - Uptrend: RSI = ${rsiUp.toFixed(2)} (expected: >70)`);
  
  // Test case 2: Trending down (should have low RSI)
  const downtrend = [114, 113, 112, 111, 110, 109, 108, 107, 106, 105, 104, 103, 102, 101, 100];
  const rsiDown = calculateRSI(downtrend);
  console.log(`Test 2 - Downtrend: RSI = ${rsiDown.toFixed(2)} (expected: <30)`);
  
  // Test case 3: Flat (should be around 50)
  const flat = [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100];
  const rsiFlat = calculateRSI(flat);
  console.log(`Test 3 - Flat: RSI = ${rsiFlat.toFixed(2)} (expected: ~50)`);
  
  // Test case 4: Known calculation from Investopedia example
  // Price changes: +1, +0.5, -0.5, +1, +0.5, -1, +0.5, +1, -0.5, +0.5, +1, -0.5, +1, +0.5
  const known = [44, 45, 45.5, 45, 46, 46.5, 45.5, 46, 47, 46.5, 47, 48, 47.5, 48.5, 49];
  const rsiKnown = calculateRSI(known);
  console.log(`Test 4 - Known example: RSI = ${rsiKnown.toFixed(2)} (expected: ~66-70)`);
  
  console.log('\n' + '='.repeat(60));
}

// Fetch real JNJ data and calculate RSI
function testRealJNJ() {
  return new Promise((resolve, reject) => {
    console.log('\n🔍 Fetching Real JNJ Data from Yahoo Finance...\n');
    
    https.get('https://query1.finance.yahoo.com/v8/finance/chart/JNJ?interval=1h&range=7d', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const result = json.chart.result[0];
          const rawCloses = result.indicators.quote[0].close || [];
          
          // Filter out null values
          const closes = rawCloses.filter(c => c != null);
          
          if (closes.length < 15) {
            console.log('❌ Not enough data points');
            resolve();
            return;
          }
          
          // Calculate RSI on the full dataset
          const currentRSI = calculateRSI(closes.slice(-15));
          
          console.log(`JNJ Data Points: ${closes.length} candles`);
          console.log(`Last 15 closes: ${closes.slice(-15).map(c => c.toFixed(2)).join(', ')}`);
          console.log(`\nCalculated RSI (last 14 periods): ${currentRSI.toFixed(2)}`);
          
          // Show price changes
          console.log('\nPrice changes (last 14 periods):');
          for (let i = closes.length - 14; i < closes.length; i++) {
            const change = closes[i] - closes[i - 1];
            const arrow = change > 0 ? '↑' : change < 0 ? '↓' : '→';
            console.log(`  ${arrow} ${change.toFixed(2)} (${closes[i].toFixed(2)})`);
          }
          
          // Manual verification
          let gains = 0, losses = 0;
          for (let i = closes.length - 14; i < closes.length; i++) {
            const diff = closes[i] - closes[i - 1];
            if (diff > 0) gains += diff;
            else losses -= diff;
          }
          const avgGain = gains / 14;
          const avgLoss = losses / 14;
          const rs = avgGain / avgLoss;
          
          console.log(`\nManual Calculation:`);
          console.log(`  Total Gains: ${gains.toFixed(4)}`);
          console.log(`  Total Losses: ${losses.toFixed(4)}`);
          console.log(`  Avg Gain: ${avgGain.toFixed(4)}`);
          console.log(`  Avg Loss: ${avgLoss.toFixed(4)}`);
          console.log(`  RS: ${rs.toFixed(4)}`);
          console.log(`  RSI: ${(100 - (100 / (1 + rs))).toFixed(2)}`);
          
          resolve();
        } catch (e) {
          console.error('Error parsing data:', e.message);
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  testKnownRSI();
  
  try {
    await testRealJNJ();
  } catch (err) {
    console.error('\n❌ Error fetching JNJ data:', err.message);
  }
  
  console.log('\n✅ RSI calculation tests complete');
}

runTests();
