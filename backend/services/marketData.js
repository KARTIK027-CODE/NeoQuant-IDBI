// =============================================================
// Market Data Service — Simulated Indian MF NAV Engine
// Generates realistic price variations every 5 seconds
// =============================================================

const BASE_NAVS = {
  'Axis Midcap Fund - Direct Growth':                { nav: 112.45, volatility: 0.008, trend: 0.0002 },
  'HDFC Top 100 Fund - Direct Growth':               { nav: 98.23,  volatility: 0.005, trend: 0.0001 },
  'SBI Bluechip Fund - Direct Growth':               { nav: 75.14,  volatility: 0.004, trend: 0.0001 },
  'Mirae Asset Emerging Bluechip - Direct Growth':   { nav: 132.67, volatility: 0.009, trend: 0.0003 },
  'IDBI Liquid Fund - Direct Growth':                { nav: 40.28,  volatility: 0.0002, trend: 0.00005 },
  'IDBI Flexi Bond Fund - Direct Growth':            { nav: 42.18,  volatility: 0.002, trend: 0.00008 },
  'HDFC Balanced Advantage Fund - Direct Growth':    { nav: 88.34,  volatility: 0.004, trend: 0.00015 },
  'SBI Conservative Hybrid Fund - Direct Growth':    { nav: 53.46,  volatility: 0.003, trend: 0.0001  },
  'Parag Parikh Flexi Cap Fund - Direct Growth':     { nav: 68.92,  volatility: 0.007, trend: 0.00025 },
  'Quant Small Cap Fund - Direct Growth':            { nav: 215.34, volatility: 0.015, trend: 0.0005  },
};

// Current simulated NAVs (mutated over time)
const currentNavs = {};
Object.entries(BASE_NAVS).forEach(([name, data]) => {
  currentNavs[name] = { ...data, currentNav: data.nav, change: 0, changePct: 0 };
});

let tickCount = 0;

/**
 * Simulate a market tick — Brownian motion with slight upward drift
 */
function tickMarket() {
  tickCount++;
  Object.entries(currentNavs).forEach(([name, data]) => {
    const randomShock = (Math.random() - 0.495) * data.volatility; // slightly bearish on tick
    const drift = data.trend;
    const newNav = data.currentNav * (1 + randomShock + drift);
    const change = newNav - BASE_NAVS[name].nav;
    const changePct = (change / BASE_NAVS[name].nav) * 100;

    currentNavs[name] = {
      ...data,
      currentNav: parseFloat(newNav.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePct: parseFloat(changePct.toFixed(3))
    };
  });
}

/**
 * Get current NAV snapshot for all tracked funds
 */
function getAllNavs() {
  return Object.entries(currentNavs).map(([fundName, data]) => ({
    fundName,
    nav: data.currentNav,
    change: data.change,
    changePct: data.changePct,
    isPositive: data.changePct >= 0,
    timestamp: new Date().toISOString()
  }));
}

/**
 * Get NAV for a specific fund
 */
function getNav(fundName) {
  return currentNavs[fundName] || null;
}

// Start ticking every 5 seconds
setInterval(tickMarket, 5000);
tickMarket(); // Initial tick

module.exports = { getAllNavs, getNav, tickMarket };
