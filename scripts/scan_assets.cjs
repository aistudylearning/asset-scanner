const https = require('https'); 
const fs = require('fs');
const { execSync } = require('child_process');
const { RSI, BollingerBands, MACD, OBV, VWAP } = require('technicalindicators');

const EMAIL_TO = 'ai.study.learning@gmail.com';
const delay = ms => new Promise(res => setTimeout(res, ms));

const SCORE_EMAIL_THRESHOLD = 4;
const SCORE_LOG_THRESHOLD = 3;
const RSI_OVERSOLD = 25;

// Asset lists (commodities, US, China, India, Vietnam)
const commodities = [
  { name: 'Gold', symbol: 'GC=F', tvSymbol: 'COMEX:GC1!', isCommodity: true },
  { name: 'Silver', symbol: 'SI=F', tvSymbol: 'COMEX:SI1!', isCommodity: true },
  { name: 'Copper (Bronze proxy)', symbol: 'HG=F', tvSymbol: 'COMEX:HG1!', isCommodity: true },
  { name: 'Platinum', symbol: 'PL=F', tvSymbol: 'NYMEX:PL1!', isCommodity: true },
  { name: 'Palladium', symbol: 'PA=F', tvSymbol: 'NYMEX:PA1!', isCommodity: true },
  { name: 'Rare Earth ETF', symbol: 'REMX', tvSymbol: 'AMEX:REMX', isCommodity: true },
  { name: 'Uranium ETF', symbol: 'URA', tvSymbol: 'AMEX:URA', isCommodity: true },
];

const usTickers = [
  "AAPL","MSFT","NVDA","GOOGL","AMZN","META","BRK-B","LLY","AVGO","TSLA",
  "JPM","WMT","UNH","V","MA","JNJ","PG","ORCL","HD","COST",
  "ABBV","MRK","BAC","CRM","KO","NFLX","CVX","AMD","PEP","LIN",
  "TMO","WFC","CSCO","MCD","DIS","INTC","ABT","INTU","QCOM","AMGN",
  "IBM","TXN","PM","CAT","COP","NOW","BA","SPGI","GE","HON",
  "AMAT","RTX","ISRG","BKNG","SYK","LOW","GS","PLD","ELV","T",
  "BLK","MDT","TJX","PGR","LMT","AXP","VRTX","SYY","C","REGN",
  "ADP","CB","BMY","CVS","BSX","ADI","MMC","CI","GILD","PANW",
  "MDLZ","FI","DE","ZTS","LRCX","CME","SNPS","EQIX","SHW","MU",
  "CDNS","SO","BDX","ICE","ITW","CL","SLB","CSX","NKE","MO"
];

const cnTickers = [
  "0700.HK","9988.HK","1398.HK","0941.HK","0857.HK","1288.HK","0883.HK","3988.HK","3690.HK","0939.HK",
  "1211.HK","2318.HK","9618.HK","9888.HK","9999.HK","1810.HK","9633.HK","0386.HK","1658.HK","2020.HK",
  "0016.HK","0005.HK","2388.HK","1093.HK","2007.HK","0267.HK","0002.HK","1109.HK","1044.HK","0823.HK",
  "0688.HK","1928.HK","0001.HK","0011.HK","0003.HK","2269.HK","0066.HK","0288.HK","0012.HK","2319.HK",
  "1088.HK","1177.HK","0175.HK","2628.HK","0388.HK","0836.HK","3968.HK","0293.HK","1997.HK","0017.HK"
];

const inTickers = [
  "RELIANCE.NS","TCS.NS","HDFCBANK.NS","BHARTIARTL.NS","ICICIBANK.NS","SBIN.NS","INFY.NS","LICI.NS","ITC.NS","HINDUNILVR.NS",
  "LT.NS","BAJFINANCE.NS","MARUTI.NS","HCLTECH.NS","TATAMOTORS.NS","SUNPHARMA.NS","M&M.NS","NTPC.NS","KOTAKBANK.NS","AXISBANK.NS",
  "ONGC.NS","TITAN.NS","POWERGRID.NS","COALINDIA.NS","BAJAJFINSV.NS","ASIANPAINT.NS","ADANIENT.NS","ADANIPORTS.NS","ULTRACEMCO.NS","NESTLEIND.NS",
  "WIPRO.NS","JSWSTEEL.NS","TATASTEEL.NS","GRASIM.NS","TECHM.NS","HINDALCO.NS","CIPLA.NS","EICHERMOT.NS","DRREDDY.NS","INDUSINDBK.NS",
  "SBILIFE.NS","BRITANNIA.NS","DIVISLAB.NS","TATACONSUM.NS","APOLLOHOSP.NS","HEROMOTOCO.NS","HDFCLIFE.NS","BAJAJ-AUTO.NS","UPL.NS","BPCL.NS"
];

const vnTickers = [
  "VCB.HM","BID.HM","VHM.HM","VIC.HM","HPG.HM","CTG.HM","GAS.HM","TCB.HM","VNM.HM","VPB.HM",
  "MBB.HM","MSN.HM","FPT.HM","ACB.HM","SAB.HM","STB.HM","HDB.HM","MWG.HM","VRE.HM","VIB.HM",
  "SSB.HM","SHB.HM","TPB.HM","BVH.HM","POW.HM","GVR.HM","BCM.HM","VJC.HM","PLX.HM","SSI.HM"
];

const nyseStocks = new Set([
  "JPM","WMT","UNH","V","MA","JNJ","PG","HD","ABBV","MRK","BAC","KO","CVX","PEP","LIN",
  "TMO","WFC","MCD","DIS","ABT","IBM","TXN","PM","CAT","COP","BA","SPGI","GE","HON",
  "RTX","SYK","LOW","GS","PLD","T","BLK","MDT","TJX","PGR","LMT","AXP","VRTX","SYY","C",
  "CB","BMY","CVS","BSX","MMC","CI","FI","DE","ZTS","CME","EQIX","SHW","SO","BDX","ICE","ITW","CL","SLB","CSX","NKE","MO"
]);

function generateAssets() {
  const assets = [...commodities];
  usTickers.forEach(sym => {
    const exchange = nyseStocks.has(sym) ? 'NYSE' : 'NASDAQ';
    assets.push({ name: sym, symbol: sym, tvSymbol: `${exchange}:${sym}` });
  });
  cnTickers.forEach(sym => {
    const ticker = sym.replace('.HK', '').replace(/^0+/, '');
    assets.push({ name: sym.replace('.HK', ''), symbol: sym, tvSymbol: `HKEX:${ticker}` });
  });
  inTickers.forEach(sym => assets.push({ name: sym.replace('.NS', ''), symbol: sym, tvSymbol: `NSE:${sym.replace('.NS', '')}` }));
  vnTickers.forEach(sym => assets.push({ name: sym.replace('.HM', ''), symbol: sym, tvSymbol: `HOSE:${sym.replace('.HM', '')}` }));
  return assets;
}

const ALL_ASSETS = generateAssets();

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
    req.on('error', reject);
  });
}

let macroCache = null;

async function fetchMacroSignals() {
  if (macroCache) return macroCache;

  async function fetchSeries(series, limit = 3) {
    try {
      const url = `https://fred.stlouisfed.org/graph/fredgraph.json?id=${series}`;
      const data = await fetchJson(url);
      const obs = (data.observations || []).filter(o => o.value !== '.');
      return obs.slice(-limit).map(o => parseFloat(o.value));
    } catch (e) {
      console.error(`FRED fetch failed for ${series}:`, e.message);
      return [];
    }
  }

  const [dxy, cpi, rates] = await Promise.all([
    fetchSeries('DTWEXBGS', 5),
    fetchSeries('CPIAUCSL', 3),
    fetchSeries('FEDFUNDS', 3),
  ]);

  const dxyFalling = dxy.length >= 2 && dxy[dxy.length - 1] < dxy[0];
  const cpiRising = cpi.length >= 2 && cpi[cpi.length - 1] > cpi[0];
  const ratesFalling = rates.length >= 2 && rates[rates.length - 1] < rates[0];
  const macroBullishCommodities = cpiRising && ratesFalling;

  macroCache = { dxyFalling, macroBullishCommodities };
  console.log(`Macro signals — DXY falling: ${dxyFalling}, CPI↑+Rates↓: ${macroBullishCommodities}`);
  return macroCache;
}

// Technical indicators using technicalindicators library

function isOBVRising(closes, volumes, lookback = 5) {
  if (closes.length < lookback * 2 + 1 || volumes.length < lookback * 2 + 1) return false;
  
  const obvResult = OBV.calculate({ close: closes, volume: volumes });
  if (obvResult.length < lookback * 2) return false;
  
  const recent = obvResult.slice(-lookback).reduce((a, b) => a + b, 0) / lookback;
  const prior = obvResult.slice(-lookback * 2, -lookback).reduce((a, b) => a + b, 0) / lookback;
  return recent > prior;
}

function isPriceBelowVWAP(closes, highs, lows, volumes) {
  if (closes.length === 0) return false;
  
  const vwapResult = VWAP.calculate({ high: highs, low: lows, close: closes, volume: volumes });
  if (vwapResult.length === 0) return false;
  
  return closes[closes.length - 1] < vwapResult[vwapResult.length - 1];
}

function isBollingerSqueeze(closes, period = 14, lookback = 5) {
  if (closes.length < period + lookback) return false;

  function getBandWidth(slice) {
    const bbResult = BollingerBands.calculate({ period: period, values: slice, stdDev: 2 });
    if (bbResult.length === 0) return null;
    const lastBB = bbResult[bbResult.length - 1];
    return (lastBB.upper - lastBB.lower) / lastBB.middle;
  }

  const currentWidth = getBandWidth(closes.slice(-period));
  if (currentWidth === null) return false;
  
  for (let i = 1; i <= lookback; i++) {
    const prevWidth = getBandWidth(closes.slice(-period - i, -i));
    if (prevWidth === null || prevWidth <= currentWidth) return false;
  }
  return true;
}

function isMACDBullishCross(closes) {
  if (closes.length < 35) return false;
  
  const macdResult = MACD.calculate({
    values: closes,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false
  });
  
  if (macdResult.length < 2) return false;
  
  const prev = macdResult[macdResult.length - 2];
  const curr = macdResult[macdResult.length - 1];
  
  return prev.MACD < prev.signal && curr.MACD >= curr.signal;
}

function scoreAsset({ closes, highs, lows, volumes, isCommodity, macro }) {
  let score = 0;
  const signals = [];

  const rsiResult = RSI.calculate({ values: closes, period: 14 });
  const rsi = rsiResult.length > 0 ? rsiResult[rsiResult.length - 1] : 50;
  
  if (rsi < RSI_OVERSOLD) {
    score += 1;
    signals.push(`RSI ${rsi.toFixed(1)} — oversold`);
  }

  if (isBollingerSqueeze(closes)) {
    score += 1;
    signals.push('Bollinger squeeze — breakout imminent');
  }

  if (isMACDBullishCross(closes)) {
    score += 1;
    signals.push('MACD bullish crossover');
  }

  if (isOBVRising(closes, volumes)) {
    score += 2;
    signals.push('OBV rising — accumulation detected');
  }

  if (isPriceBelowVWAP(closes, highs, lows, volumes)) {
    score += 1;
    signals.push('Price below VWAP — below institutional fair value');
  }

  if (isCommodity && macro) {
    if (macro.dxyFalling) {
      score += 1;
      signals.push('DXY falling — tailwind for commodities');
    }
    if (macro.macroBullishCommodities) {
      score += 1;
      signals.push('CPI rising + Fed Funds falling — macro bullish for hard assets');
    }
  }

  return { score, rsi, signals };
}

async function run() {
  try {
    console.log(`Scanning ${ALL_ASSETS.length} global assets via Yahoo Finance...`);

    const macro = await fetchMacroSignals();
    const strongSignals = [];
    const weakSignals = [];

    for (let i = 0; i < ALL_ASSETS.length; i++) {
      const asset = ALL_ASSETS[i];
      try {
        const data = await fetchJson(
          `https://query1.finance.yahoo.com/v8/finance/chart/${asset.symbol}?interval=1h&range=7d`
        );
        const result = data.chart?.result?.[0];
        if (!result) continue;

        const rawCloses = result.indicators.quote[0].close || [];
        const rawHighs = result.indicators.quote[0].high || [];
        const rawLows = result.indicators.quote[0].low || [];
        const rawVolumes = result.indicators.quote[0].volume || [];

        const valid = rawCloses.map((c, idx) => ({
          c, h: rawHighs[idx], l: rawLows[idx], v: rawVolumes[idx]
        })).filter(x => x.c != null && x.h != null && x.l != null && x.v != null);

        if (valid.length < 35) continue;

        const closes = valid.map(x => x.c);
        const highs = valid.map(x => x.h);
        const lows = valid.map(x => x.l);
        const volumes = valid.map(x => x.v);

        const { score, rsi, signals } = scoreAsset({
          closes, highs, lows, volumes,
          isCommodity: !!asset.isCommodity,
          macro
        });

        const price = closes[closes.length - 1];

        if (score >= SCORE_EMAIL_THRESHOLD) {
          strongSignals.push({ ...asset, score, rsi: rsi.toFixed(2), price: price.toFixed(4), signals });
          console.log(`STRONG [${score}/10]: ${asset.name}  RSI=${rsi.toFixed(1)}`);
        } else if (score === SCORE_LOG_THRESHOLD) {
          weakSignals.push({ ...asset, score, rsi: rsi.toFixed(2), price: price.toFixed(4), signals });
          console.log(`Weak   [${score}/10]: ${asset.name}`);
        }
      } catch (e) {
        // Silently skip
      }

      await delay(50);
      if (i > 0 && i % 50 === 0) console.log(`Scanned ${i}/${ALL_ASSETS.length} assets...`);
    }

    console.log(`\nWeak signals (logged only): ${weakSignals.length}`);

    if (strongSignals.length > 0) {
      console.log(`Found ${strongSignals.length} strong signals. Formatting HTML...`);

      const htmlRows = strongSignals.map(asset => {
        const scoreColor = asset.score >= 7 ? '#d32f2f' : asset.score >= 5 ? '#f57c00' : '#555';
        const signalList = asset.signals.map(s => `<li style="margin:2px 0;">${s}</li>`).join('');
        return `<tr>
          <td style="padding:10px;border-bottom:1px solid #eee;">
            <a href="https://www.tradingview.com/chart/?symbol=${asset.tvSymbol}"
               target="_blank" style="color:#1976d2;text-decoration:none;">
              <strong>${asset.name} (${asset.symbol})</strong>
            </a>
          </td>
          <td style="padding:10px;border-bottom:1px solid #eee;color:${scoreColor};font-weight:bold;font-size:18px;">
            ${asset.score}/10
          </td>
          <td style="padding:10px;border-bottom:1px solid #eee;color:#f57c00;font-weight:bold;">
            ${asset.rsi}
          </td>
          <td style="padding:10px;border-bottom:1px solid #eee;">${asset.price}</td>
          <td style="padding:10px;border-bottom:1px solid #eee;font-size:12px;color:#555;">
            <ul style="margin:0;padding-left:16px;">${signalList}</ul>
          </td>
        </tr>`;
      }).join('');

      const htmlBody = `
        <div style="font-family:Arial,sans-serif;color:#333;max-width:800px;margin:0 auto;border:1px solid #ddd;padding:20px;border-radius:8px;">
          <h2 style="color:#d32f2f;margin-top:0;">📉 Global Asset Alert: ${strongSignals.length} Strong Signals (score ≥ ${SCORE_EMAIL_THRESHOLD}/10)</h2>
          <p style="font-size:13px;color:#555;">
            Multi-indicator composite scoring using technicalindicators library: RSI + OBV + VWAP + Bollinger squeeze + MACD crossover + macro (DXY/CPI/rates for commodities).<br>
            Max score: 10 for commodities, 7 for equities. Only assets scoring ≥ ${SCORE_EMAIL_THRESHOLD} are emailed.
          </p>
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead>
              <tr style="background:#f8f9fa;text-align:left;">
                <th style="padding:10px;border-bottom:2px solid #ddd;">Asset</th>
                <th style="padding:10px;border-bottom:2px solid #ddd;">Score</th>
                <th style="padding:10px;border-bottom:2px solid #ddd;">RSI (1h)</th>
                <th style="padding:10px;border-bottom:2px solid #ddd;">Price</th>
                <th style="padding:10px;border-bottom:2px solid #ddd;">Signals fired</th>
              </tr>
            </thead>
            <tbody>${htmlRows}</tbody>
          </table>
          <hr style="margin:24px 0;border:none;border-top:1px solid #eee;">
          <p style="font-size:12px;color:#777;margin:0;">
            <strong>Macro at scan time:</strong>
            DXY falling: ${macro.dxyFalling} &nbsp;|&nbsp;
            CPI↑ + Rates↓: ${macro.macroBullishCommodities}
          </p>
          <p style="font-size:11px;color:#999;margin-top:16px;text-align:center;">
            Generated by OpenClaw Trading Bot · Using technicalindicators library
          </p>
        </div>
      `.replace(/\n/g, ' ');

      console.log('Sending email alert...');
      const subjectTag = strongSignals.some(a => a.score >= 6) ? '🔴' : '🟠';
      const GOG_COMMAND = '/home/cuong/.local/bin/gog mail send';
      const tempBodyFile = '/tmp/cb.html';
      fs.writeFileSync(tempBodyFile, htmlBody);
      const cmd = `${GOG_COMMAND} --to "${EMAIL_TO}" --subject "${subjectTag} Asset Alert: ${strongSignals.length} Strong Signals (score ≥ ${SCORE_EMAIL_THRESHOLD}/10)" --body-file "${tempBodyFile}"`;
      try {
        execSync(cmd, { stdio: 'inherit' });
      } finally {
        if (fs.existsSync(tempBodyFile)) fs.unlinkSync(tempBodyFile);
      }
    } else {
      console.log('No strong signals this hour.');
    }
  } catch (e) {
    console.error('Fatal error:', e);
  }
}

run();
