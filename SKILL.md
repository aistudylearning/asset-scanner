---
name: asset-scanner
description: A scanner that checks Yahoo Finance for non-crypto assets (Stocks, Gold, Silver) across global markets (NASDAQ, China, India, Vietnam) and alerts via email if they are oversold.
---

# Asset Scanner

This skill runs a Node.js script that connects to the public Yahoo Finance API, fetches recent hourly price data for a curated list of global assets and commodities, calculates the RSI, and alerts `family.denhaag@gmail.com` if any asset is oversold (RSI < 30).

## Supported Markets
- **Commodities:** Gold, Silver
- **US (NASDAQ):** AAPL, MSFT, NVDA, etc.
- **China / HK:** Tencent, SSE Composite
- **India:** Reliance, TCS
- **Vietnam:** VNM, VCB

## Usage
Run the following script:

```bash
node D:\dev\OpenClaw\config\.openclaw\workspace\skills\asset-scanner\scripts\scan_global.js
```
