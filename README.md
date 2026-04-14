# Asset Scanner - OpenClaw Skill

An automated global asset scanner that monitors stocks, commodities, and international markets via Yahoo Finance, sending email alerts when assets meet specific technical and macro criteria.

## Features

- **Multi-indicator scoring system** (max 10 points):
  - RSI < 25 (+1 point) - Oversold detection
  - Bollinger Band squeeze (+1) - Breakout imminent
  - MACD bullish crossover (+1) - Momentum shift
  - OBV rising (+2) - Accumulation detected
  - Price below VWAP (+1) - Below institutional fair value
  - DXY falling (+1, commodities only) - Dollar weakness
  - CPI rising + Fed Funds falling (+1, commodities only) - Macro bullish

- **Global market coverage**:
  - **Commodities**: Gold, Silver, Copper, Platinum, Palladium, Rare Earth ETF, Uranium ETF
  - **US Stocks**: Top 100 by market cap (NASDAQ & NYSE)
  - **China/Hong Kong**: Top 50 stocks (HKEX)
  - **India**: Top 50 stocks (NSE)
  - **Vietnam**: Top 30 stocks (HOSE)

- **Smart alerting**: Only sends emails when score ≥ 4/10
- **HTML email reports** with clickable TradingView chart links
- **Macro data integration** via FRED API (DXY, CPI, Fed Funds)
- **Automated scheduling** via cron (every 60 minutes)

## Requirements

- Node.js v14+
- `msmtp` configured for email sending
- `gog` CLI shim (included in setup)

## Installation

1. Copy the skill to your OpenClaw skills directory:
```bash
cp -r asset-scanner ~/.npm-global/lib/node_modules/openclaw/skills/
```

2. Configure email recipient in `scripts/scan_assets.cjs`:
```javascript
const EMAIL_TO = 'your-email@example.com';
```

3. Set up the `gog` email shim at `~/.local/bin/gog` (same as crypto-scanner):
```bash
#!/bin/bash
# Shim to redirect gog mail send calls to msmtp for OpenClaw
if [[ "$1" == "mail" && "$2" == "send" ]]; then
    shift 2
    SUBJECT=""
    BODY=""
    BODY_FILE=""
    TO=""
    while [[ "$#" -gt 0 ]]; do
        case $1 in
            --subject) SUBJECT="$2"; shift ;;
            --body) BODY="$2"; shift ;;
            --body-file) BODY_FILE="$2"; shift ;;
            --to) TO="$2"; shift ;;
        esac
        shift
    done
    
    if [[ -n "$BODY_FILE" && -f "$BODY_FILE" ]]; then
        BODY=$(cat "$BODY_FILE")
    fi
    
    echo -e "Subject: $SUBJECT\nContent-Type: text/html; charset=UTF-8\n\n$BODY" | msmtp -a default "$TO"
else
    echo "gog shim: Only 'mail send' is implemented."
    exit 1
fi
```

4. Make it executable:
```bash
chmod +x ~/.local/bin/gog
```

5. Add to crontab:
```bash
crontab -e
# Add this line:
0 * * * * /usr/bin/node /path/to/asset-scanner/scripts/scan_assets.cjs >> /path/to/logs/asset-scanner.log 2>&1
```

## Usage

Manual run:
```bash
node scripts/scan_assets.cjs
```

Check logs:
```bash
tail -f ~/.openclaw/workspace/logs/asset-scanner.log
```

## Email Format

Alerts include:
- Asset name and symbol with TradingView link
- Composite score (out of 10)
- Current RSI value (1h timeframe)
- Current price
- List of triggered signals
- Macro conditions at scan time

## Scoring Thresholds

- **Score ≥ 4**: Email alert sent
- **Score = 3**: Logged only
- **Score < 3**: Skipped

## Exchange Mapping

The scanner automatically maps US stocks to the correct exchange:
- **NYSE**: JPM, WMT, UNH, V, MA, JNJ, PG, HD, MCD, DIS, etc.
- **NASDAQ**: AAPL, MSFT, NVDA, GOOGL, AMZN, META, TSLA, etc.

## Data Sources

- **Price data**: Yahoo Finance API (free, no key required)
- **Macro data**: FRED API (Federal Reserve Economic Data)
  - DXY: Trade Weighted USD Index (DTWEXBGS)
  - CPI: Consumer Price Index (CPIAUCSL)
  - Fed Funds Rate: FEDFUNDS

## Performance

- Scans 237 assets in ~60-90 seconds
- 50ms delay between API calls to respect rate limits
- Handles delisted/unavailable assets gracefully

## License

MIT

## Author

Created for OpenClaw AI assistant framework
