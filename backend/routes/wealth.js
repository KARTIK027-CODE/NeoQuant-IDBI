/*
 * Wealth Routes — /api/v1/wealth
 * Mock Finacle-compatible portfolio and market data endpoints.
 *
 * Security measures:
 *  - JWT required on all endpoints (verifyToken)
 *  - userId sourced from JWT only — body/query userId is ignored
 *  - SIP inputs validated (validateSipRequest) before processing
 *  - SIP amount range enforced: ₹100 – ₹1,00,000
 *  - Fund name character-whitelisted to prevent injection
 */

const express = require('express');
const router  = express.Router();

const { portfolios }                    = require('../data/mockPortfolio');
const { getAllNavs }                     = require('../services/marketData');
const { verifyToken }                   = require('../middleware/auth');
const { validateSipRequest }            = require('../middleware/validators');

/**
 * GET /api/v1/wealth/portfolio-summary
 * Returns the authenticated user's full portfolio with live NAV enrichment.
 * Mirrors the schema expected from IDBI's Finacle wealth module.
 */
router.get('/portfolio-summary', verifyToken, async (req, res) => {
  // Small network-latency simulation (realistic for core banking round-trip)
  await new Promise(r => setTimeout(r, 150 + Math.floor(Math.random() * 200)));

  // Pull identity from JWT — ignore any userId in query params
  const { userId } = req.user;
  const user = portfolios[userId] || portfolios['retail'];

  const navData = getAllNavs();

  // Enrich each holding with the latest simulated NAV
  const enrichedHoldings = user.holdings.map(holding => {
    const liveNav    = navData.find(n => n.fundName === holding.fundName);
    const currentNav = liveNav ? liveNav.nav : holding.currentNav;
    const navChange  = liveNav?.changePct ?? 0;

    return {
      id:             holding.id,
      fundName:       holding.fundName,
      fundType:       holding.fundType,
      units:          holding.units,
      currentNav,
      navChange,
      investedAmount: holding.investedAmount,
      currentValue:   holding.currentValue,
      absoluteReturn: holding.absoluteReturn,
      sipAmount:      holding.sipAmount,
      sipDate:        holding.sipDate,
    };
  });

  const totalGain    = user.currentValue - user.totalInvested;
  const totalGainPct = parseFloat(((totalGain / user.totalInvested) * 100).toFixed(2));

  return res.json({
    success: true,
    data: {
      userId:           user.userId,
      name:             user.name,
      riskProfile:      user.riskProfile,
      monthlySipBudget: user.monthlySipBudget,
      summary: {
        totalInvested:  user.totalInvested,
        currentValue:   parseFloat(user.currentValue.toFixed(2)),
        totalGain:      parseFloat(totalGain.toFixed(2)),
        totalGainPct,
        xirr:           user.xirr,
        lastUpdated:    new Date().toISOString(),
      },
      assetAllocation:    user.assetAllocation,
      holdings:           enrichedHoldings,
      recentTransactions: user.recentTransactions,
    },
  });
});

/**
 * GET /api/v1/wealth/nav-data
 * Returns simulated real-time NAV for all tracked Indian mutual funds.
 * NAVs update every 5 seconds via the Brownian motion simulator in marketData.js.
 */
router.get('/nav-data', verifyToken, async (_req, res) => {
  const navs = getAllNavs();

  return res.json({
    success:   true,
    count:     navs.length,
    data:      navs,
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /api/v1/wealth/initiate-sip
 * Mock SIP registration. In production, this triggers an IDBI Finacle transaction.
 * Amount and fund name are validated before any processing.
 */
router.post('/initiate-sip', verifyToken, validateSipRequest, async (req, res) => {
  const { fundName, amount, sipDate } = req.body;
  const { userId, name } = req.user;

  // Simulate Finacle round-trip latency
  await new Promise(r => setTimeout(r, 800 + Math.floor(Math.random() * 400)));

  const referenceId = `SIP-${Date.now()}-${userId.slice(-4)}`;

  return res.json({
    success: true,
    transaction: {
      referenceId,
      userId,
      investorName:  name,
      fundName,
      amount,
      sipDate,
      status:        'REGISTERED',
      firstDebitDate: nextSipDate(sipDate),
      registeredAt:  new Date().toISOString(),
      message:       `SIP of ₹${amount.toLocaleString('en-IN')} in ${fundName} registered successfully.`,
    },
  });
});

function nextSipDate(day) {
  const now  = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, day);
  return next.toISOString().split('T')[0];
}

module.exports = router;
