import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import './Portfolio.css';

const DATA_MAP = {
  retail: {
    name: 'Ramesh Kumar',
    segment: 'Retail',
    age: 34,
    income: 45000,
    savingsRate: 8,
    healthScore: 58,
    totalPortfolio: 120000,
    xirr: 8.2,
    goal: 'Child Education',
    horizon: 10,
    currentAllocation: [
      { name: 'Fixed Deposit', value: 50, color: '#00836C' },
      { name: 'PPF', value: 10, color: '#F58220' },
      { name: 'Debt Funds', value: 10, color: '#3b82f6' },
      { name: 'Gold', value: 30, color: '#eab308' }
    ],
    recommendedAllocation: [
      { name: 'Fixed Deposit', value: 30, color: '#00836C' },
      { name: 'PPF', value: 25, color: '#F58220' },
      { name: 'Debt Funds', value: 30, color: '#3b82f6' },
      { name: 'Gold', value: 15, color: '#eab308' }
    ],
    goals: [
      { name: "Child's Education", target: 1500000, current: 300000, progress: 20 },
      { name: 'Emergency Fund', target: 200000, current: 100000, progress: 50 },
      { name: 'Retirement Fund', target: 10000000, current: 500000, progress: 5 }
    ],
    holdings: [
      { fundName: 'SBI Bluechip Fund', type: 'Equity · Large Cap', value: 12000, returns: 14.2 },
      { fundName: 'IDBI Liquid Fund', type: 'Debt · Liquid', value: 60000, returns: 6.8 },
      { fundName: 'HDFC Gold Fund', type: 'Commodity · Gold', value: 36000, returns: 11.5 },
      { fundName: 'PPF Account', type: 'Govt Debt', value: 12000, returns: 7.1 }
    ],
    healthInsights: [
      'Low savings rate (8% vs recommended 20%). Try to increase monthly savings.',
      'High FD drag (50% of portfolio earning 6.5% vs inflation). Reallocate to debt mutual funds for tax efficiency.',
      'No active health insurance policy found. A medical emergency could exhaust your current savings.'
    ]
  },
  mass: {
    name: 'Priya Mehta',
    segment: 'Mass Affluent',
    age: 42,
    income: 95000,
    savingsRate: 15,
    healthScore: 74,
    totalPortfolio: 480000,
    xirr: 11.4,
    goal: 'Retirement',
    horizon: 15,
    currentAllocation: [
      { name: 'Fixed Deposit', value: 60, color: '#00836C' },
      { name: 'Hybrid Funds', value: 20, color: '#F58220' },
      { name: 'Gold', value: 20, color: '#eab308' }
    ],
    recommendedAllocation: [
      { name: 'Hybrid Funds', value: 40, color: '#F58220' },
      { name: 'Sovereign Gold Bonds', value: 30, color: '#00836C' },
      { name: 'Balanced Funds', value: 30, color: '#3b82f6' }
    ],
    goals: [
      { name: 'Retirement corpus', target: 25000000, current: 4000000, progress: 16 },
      { name: 'New Home Downpayment', target: 6000000, current: 3000000, progress: 50 },
      { name: "Child's College Fund", target: 2500000, current: 800000, progress: 32 }
    ],
    holdings: [
      { fundName: 'Axis Balanced Advantage', type: 'Hybrid', value: 96000, returns: 13.8 },
      { fundName: 'IDBI Equity Savings Fund', type: 'Hybrid', value: 96000, returns: 10.4 },
      { fundName: 'SGB Series III', type: 'Sovereign Gold', value: 96000, returns: 12.0 },
      { fundName: 'IDBI Bank Fixed Deposit', type: 'Debt · FD', value: 192000, returns: 7.2 }
    ],
    healthInsights: [
      'Healthy savings rate (15%). Good potential to hit retirement target early.',
      'FD concentration (60%) limits long-term growth. Hybrid funds are recommended for inflation-beating yields.',
      'Adequate term insurance of ₹1.5 Cr is in place.'
    ]
  },
  hni: {
    name: 'Arvind Subramanian',
    segment: 'High Net Worth (HNI)',
    age: 51,
    income: 350000,
    savingsRate: 35,
    healthScore: 89,
    totalPortfolio: 2450000,
    xirr: 15.6,
    goal: 'Wealth Creation',
    horizon: 5,
    currentAllocation: [
      { name: 'Fixed Deposit', value: 10, color: '#00836C' },
      { name: 'Equity Mutual Funds', value: 40, color: '#F58220' },
      { name: 'Direct Equity', value: 40, color: '#3b82f6' },
      { name: 'Gold', value: 10, color: '#eab308' }
    ],
    recommendedAllocation: [
      { name: 'Equity Mutual Funds', value: 70, color: '#F58220' },
      { name: 'Direct Equity', value: 20, color: '#3b82f6' },
      { name: 'Gold/SGB', value: 10, color: '#00836C' }
    ],
    goals: [
      { name: 'Wealth Accumulation', target: 100000000, current: 45000000, progress: 45 },
      { name: 'Retirement corpus', target: 80000000, current: 56000000, progress: 70 },
      { name: 'Overseas Travel Fund', target: 3000000, current: 2400000, progress: 80 }
    ],
    holdings: [
      { fundName: 'Parag Parikh Flexi Cap', type: 'Equity · Global', value: 980000, returns: 18.2 },
      { fundName: 'Quant Small Cap Fund', type: 'Equity · Small Cap', value: 490000, returns: 24.5 },
      { fundName: 'Reliance Industries (Direct)', type: 'Direct Equity', value: 490000, returns: 15.8 },
      { fundName: 'IDBI Short Term Bond Fund', type: 'Debt', value: 245000, returns: 7.5 },
      { fundName: 'Physical Gold / Coins', type: 'Gold', value: 245000, returns: 10.9 }
    ],
    healthInsights: [
      'Excellent savings rate (35%). High compounding power.',
      'Direct stock allocation is concentrated. Consider outsourcing to a Portfolio Manager (PMS) or AIF.',
      'Significant tax drag on high-income bracket. We recommend immediate tax harvesting execution.'
    ]
  }
};

export default function PortfolioScreen({ onOpenChat, profileId }) {
  const data = DATA_MAP[profileId] || DATA_MAP.retail;
  const [allocTab, setAllocTab] = useState('current'); // 'current' | 'recommended'

  const activeAllocation = allocTab === 'current' ? data.currentAllocation : data.recommendedAllocation;

  return (
    <div className="portfolio-screen">
      {/* Header */}
      <div className="portfolio-header">
        <div>
          <div className="portfolio-greeting">IDBI Digital Wealth</div>
          <div className="portfolio-user-name">{data.name}</div>
          <div className="portfolio-segment-badge">{data.segment}</div>
        </div>
        <div className="health-score-ring">
          <div className="health-score-value">{data.healthScore}</div>
          <div className="health-score-lbl">Health</div>
        </div>
      </div>

      {/* Main Stats Card */}
      <div className="portfolio-value-card">
        <div className="pvc-label">Net Asset Value</div>
        <div className="pvc-value">₹{data.totalPortfolio.toLocaleString('en-IN')}</div>
        <div className="pvc-gain">
          <span className="pvc-gain-pct">XIRR: {data.xirr}%</span>
          <span className="pvc-gain-sub">Age: {data.age} · Savings Rate: {data.savingsRate}%</span>
        </div>
      </div>

      {/* Allocation Donut Chart using Recharts */}
      <div className="portfolio-section">
        <div className="section-header-row">
          <span className="section-title">Asset Allocation</span>
          <div className="alloc-tabs">
            <button 
              className={`alloc-tab-btn ${allocTab === 'current' ? 'active' : ''}`}
              onClick={() => setAllocTab('current')}
            >
              Current
            </button>
            <button 
              className={`alloc-tab-btn ${allocTab === 'recommended' ? 'active' : ''}`}
              onClick={() => setAllocTab('recommended')}
            >
              Recommended
            </button>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie
                  data={activeAllocation}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={55}
                  dataKey="value"
                  strokeWidth={1}
                  stroke="#ffffff"
                >
                  {activeAllocation.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="chart-center-text">
              <span className="chart-center-num">{allocTab === 'current' ? 'Current' : 'Target'}</span>
            </div>
          </div>

          <div className="chart-legend-grid">
            {activeAllocation.map((item, idx) => (
              <div key={idx} className="legend-row">
                <span className="legend-dot" style={{ backgroundColor: item.color }} />
                <span className="legend-name">{item.name}</span>
                <span className="legend-val">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Goal Progress Bars */}
      <div className="portfolio-section">
        <span className="section-title">Goal Progress</span>
        <div className="goals-card">
          {data.goals.map((goal, idx) => (
            <div key={idx} className="goal-row">
              <div className="goal-meta">
                <span className="goal-name">{goal.name}</span>
                <span className="goal-progress-text">₹{(goal.current/100000).toFixed(1)}L / ₹{(goal.target/100000).toFixed(1)}L ({goal.progress}%)</span>
              </div>
              <div className="goal-bar-bg">
                <div className="goal-bar-fill" style={{ width: `${goal.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Talk to ARIA Callout */}
      <div className="talk-aria-callout" onClick={onOpenChat}>
        <div className="aria-callout-content">
          <span className="aria-callout-title">Let ARIA Optimize Your Assets</span>
          <span className="aria-callout-desc">Get a personalized asset rebalancing plan in 2 minutes.</span>
        </div>
        <div className="aria-callout-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="aria-callout-arrow">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </div>

      {/* Health Insights */}
      <div className="portfolio-section">
        <span className="section-title">Wealth Health Insights</span>
        <div className="insights-card">
          {data.healthInsights.map((insight, idx) => (
            <div key={idx} className="insight-row">
              <span className="insight-bullet">▪</span>
              <span className="insight-text">{insight}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Holdings List */}
      <div className="portfolio-section">
        <span className="section-title">My Holdings</span>
        <div className="holdings-card">
          {data.holdings.map((hold, idx) => (
            <div key={idx} className="holdings-row">
              <div className="holdings-meta">
                <span className="holdings-name">{hold.fundName}</span>
                <span className="holdings-type">{hold.type}</span>
              </div>
              <div className="holdings-values">
                <span className="holdings-val">₹{hold.value.toLocaleString('en-IN')}</span>
                <span className="holdings-ret">+{hold.returns}% YTD</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: '80px' }} />
    </div>
  );
}
