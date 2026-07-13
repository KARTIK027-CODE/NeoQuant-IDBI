// Mock portfolio data for 3 demo customer segments
// Ramesh Kumar — Retail
// Priya Mehta — Mass Affluent
// Arvind Subramanian — HNI

const portfolios = {
  'retail': {
    userId: 'retail',
    name: 'Ramesh Kumar',
    mobile: '9876543210',
    riskProfile: 'conservative',
    monthlySipBudget: 3600,
    totalInvested: 100000,
    currentValue: 120000,
    xirr: 8.2,
    holdings: [
      {
        id: 'H001',
        fundName: 'SBI Bluechip Fund - Direct Growth',
        fundType: 'Equity - Large Cap',
        units: 84.50,
        currentNav: 142.00,
        investedAmount: 10000,
        currentValue: 12000.00,
        absoluteReturn: 14.2,
        sipAmount: 1000,
        sipDate: 5
      },
      {
        id: 'H002',
        fundName: 'IDBI Liquid Fund - Direct Growth',
        fundType: 'Debt - Liquid',
        units: 1488.00,
        currentNav: 40.32,
        investedAmount: 55000,
        currentValue: 60000.00,
        absoluteReturn: 6.8,
        sipAmount: 2000,
        sipDate: 10
      },
      {
        id: 'H003',
        fundName: 'HDFC Gold Fund - Direct Growth',
        fundType: 'Commodity - Gold',
        units: 120.00,
        currentNav: 300.00,
        investedAmount: 35000,
        currentValue: 36000.00,
        absoluteReturn: 11.5,
        sipAmount: 600,
        sipDate: 15
      }
    ],
    assetAllocation: {
      equity: 10,
      debt: 60,
      gold: 30,
      cash: 0
    }
  },

  'mass': {
    userId: 'mass',
    name: 'Priya Mehta',
    mobile: '8765432109',
    riskProfile: 'moderate',
    monthlySipBudget: 14250,
    totalInvested: 430000,
    currentValue: 480000,
    xirr: 11.4,
    holdings: [
      {
        id: 'H004',
        fundName: 'Axis Balanced Advantage - Direct Growth',
        fundType: 'Hybrid',
        units: 800.00,
        currentNav: 120.00,
        investedAmount: 90000,
        currentValue: 96000.00,
        absoluteReturn: 13.8,
        sipAmount: 3000,
        sipDate: 5
      },
      {
        id: 'H005',
        fundName: 'IDBI Equity Savings Fund - Direct Growth',
        fundType: 'Hybrid',
        units: 1000.00,
        currentNav: 96.00,
        investedAmount: 90000,
        currentValue: 96000.00,
        absoluteReturn: 10.4,
        sipAmount: 2000,
        sipDate: 7
      },
      {
        id: 'H006',
        fundName: 'SGB Series III',
        fundType: 'Sovereign Gold',
        units: 16.00,
        currentNav: 6000.00,
        investedAmount: 90000,
        currentValue: 96000.00,
        absoluteReturn: 12.0,
        sipAmount: 0,
        sipDate: null
      },
      {
        id: 'H007',
        fundName: 'IDBI Bank Fixed Deposit',
        fundType: 'Debt - FD',
        units: 1.00,
        currentNav: 192000.00,
        investedAmount: 160000,
        currentValue: 192000.00,
        absoluteReturn: 7.2,
        sipAmount: 5000,
        sipDate: 1
      }
    ],
    assetAllocation: {
      equity: 40,
      debt: 40,
      gold: 20,
      cash: 0
    }
  },

  'hni': {
    userId: 'hni',
    name: 'Arvind Subramanian',
    mobile: '7654321098',
    riskProfile: 'aggressive',
    monthlySipBudget: 122500,
    totalInvested: 2120000,
    currentValue: 2450000,
    xirr: 15.6,
    holdings: [
      {
        id: 'H008',
        fundName: 'Parag Parikh Flexi Cap - Direct Growth',
        fundType: 'Equity - Global',
        units: 14000.00,
        currentNav: 70.00,
        investedAmount: 850000,
        currentValue: 980000.00,
        absoluteReturn: 18.2,
        sipAmount: 15000,
        sipDate: 5
      },
      {
        id: 'H009',
        fundName: 'Quant Small Cap Fund - Direct Growth',
        fundType: 'Equity - Small Cap',
        units: 2450.00,
        currentNav: 200.00,
        investedAmount: 400000,
        currentValue: 490000.00,
        absoluteReturn: 24.5,
        sipAmount: 10000,
        sipDate: 10
      },
      {
        id: 'H010',
        fundName: 'Reliance Industries (Direct)',
        fundType: 'Direct Equity',
        units: 200.00,
        currentNav: 2450.00,
        investedAmount: 420000,
        currentValue: 490000.00,
        absoluteReturn: 15.8,
        sipAmount: 0,
        sipDate: null
      },
      {
        id: 'H011',
        fundName: 'IDBI Short Term Bond Fund',
        fundType: 'Debt',
        units: 16333.33,
        currentNav: 15.00,
        investedAmount: 220000,
        currentValue: 245000.00,
        absoluteReturn: 7.5,
        sipAmount: 5000,
        sipDate: 15
      },
      {
        id: 'H012',
        fundName: 'Physical Gold / Coins',
        fundType: 'Gold',
        units: 35.00,
        currentNav: 7000.00,
        investedAmount: 230000,
        currentValue: 245000.00,
        absoluteReturn: 10.9,
        sipAmount: 0,
        sipDate: null
      }
    ],
    assetAllocation: {
      equity: 80,
      debt: 10,
      gold: 10,
      cash: 0
    }
  }
};

const DEMO_USER_ID = 'retail';

module.exports = { portfolios, DEMO_USER_ID };
