import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './App.css';

function App() {
  // STATE MANAGEMENT
  const [expenses, setExpenses] = useState([]);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [view, setView] = useState('add');
  const [aiInsights, setAiInsights] = useState(null);
  const [predictions, setPredictions] = useState(null);

  // CATEGORIES WITH BUDGETS
  const categories = [
    { value: 'food', label: '🍔 Food & Dining', color: '#FF6B6B', budget: 500 },
    { value: 'rent', label: '🏠 Rent & Bills', color: '#4ECDC4', budget: 1200 },
    { value: 'travel', label: '✈️ Travel', color: '#45B7D1', budget: 300 },
    { value: 'entertainment', label: '🎮 Entertainment', color: '#FFA07A', budget: 200 },
    { value: 'shopping', label: '🛍️ Shopping', color: '#98D8C8', budget: 400 },
    { value: 'healthcare', label: '💊 Healthcare', color: '#F7DC6F', budget: 150 },
    { value: 'education', label: '📚 Education', color: '#BB8FCE', budget: 250 },
    { value: 'other', label: '📦 Other', color: '#85929E', budget: 200 }
  ];

  // AUTO-GENERATE AI INSIGHTS WHEN EXPENSES CHANGE
  useEffect(() => {
    if (expenses.length > 0) {
      generateAIInsights();
      generatePredictions();
    }
  }, [expenses]);

  // ADD EXPENSE FUNCTION
  const addExpense = () => {
    if (amount && category && date) {
      const newExpense = {
        id: Date.now(),
        amount: parseFloat(amount),
        category,
        description,
        date: new Date(date),
        timestamp: Date.now()
      };
      setExpenses([...expenses, newExpense]);
      setAmount('');
      setDescription('');
    }
  };

  // DELETE EXPENSE FUNCTION
  const deleteExpense = (id) => {
    setExpenses(expenses.filter(exp => exp.id !== id));
  };

  // GET DATA FOR PIE CHART
  const getCategoryData = () => {
    const categoryTotals = {};
    categories.forEach(cat => {
      categoryTotals[cat.value] = 0;
    });
    
    expenses.forEach(exp => {
      categoryTotals[exp.category] += exp.amount;
    });

    return categories.map(cat => ({
      name: cat.label,
      value: categoryTotals[cat.value],
      color: cat.color
    })).filter(item => item.value > 0);
  };

  // GET DATA FOR LINE CHART (MONTHLY TREND)
  const getMonthlyTrend = () => {
    const monthlyData = {};
    expenses.forEach(exp => {
      const month = exp.date.toLocaleString('default', { month: 'short' });
      if (!monthlyData[month]) {
        monthlyData[month] = 0;
      }
      monthlyData[month] += exp.amount;
    });

    return Object.entries(monthlyData).map(([month, total]) => ({
      month,
      total: Math.round(total)
    }));
  };

  // GET DATA FOR BAR CHART (LAST 7 DAYS)
  const getDailySpending = () => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString();
      const dayTotal = expenses
        .filter(exp => exp.date.toLocaleDateString() === dateStr)
        .reduce((sum, exp) => sum + exp.amount, 0);
      
      last7Days.push({
        day: date.toLocaleDateString('default', { weekday: 'short' }),
        amount: Math.round(dayTotal)
      });
    }
    return last7Days;
  };

  // AI INSIGHTS GENERATION
  const generateAIInsights = () => {
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const categoryTotals = {};
    
    categories.forEach(cat => {
      categoryTotals[cat.value] = {
        spent: 0,
        budget: cat.budget,
        label: cat.label
      };
    });

    expenses.forEach(exp => {
      categoryTotals[exp.category].spent += exp.amount;
    });

    const overspending = [];
    const goodSpending = [];
    const warnings = [];

    Object.entries(categoryTotals).forEach(([key, data]) => {
      if (data.spent > 0) {
        const percentOfBudget = (data.spent / data.budget) * 100;
        if (percentOfBudget > 90) {
          overspending.push({
            category: data.label,
            spent: data.spent,
            budget: data.budget,
            percent: percentOfBudget
          });
        } else if (percentOfBudget < 50) {
          goodSpending.push({
            category: data.label,
            percent: percentOfBudget
          });
        }
        if (percentOfBudget > 100) {
          warnings.push(data.label);
        }
      }
    });

    const savingsTips = [];
    if (categoryTotals.food.spent > categoryTotals.food.budget * 0.8) {
      savingsTips.push({
        icon: '🍔',
        category: 'Food',
        tip: 'Meal prep on weekends to save 30-40% on food expenses',
        potential: Math.round(categoryTotals.food.spent * 0.35)
      });
    }
    if (categoryTotals.entertainment.spent > categoryTotals.entertainment.budget * 0.7) {
      savingsTips.push({
        icon: '🎮',
        category: 'Entertainment',
        tip: 'Try free alternatives like community events',
        potential: Math.round(categoryTotals.entertainment.spent * 0.25)
      });
    }
    if (categoryTotals.shopping.spent > categoryTotals.shopping.budget * 0.8) {
      savingsTips.push({
        icon: '🛍️',
        category: 'Shopping',
        tip: 'Wait 24 hours before non-essential purchases',
        potential: Math.round(categoryTotals.shopping.spent * 0.3)
      });
    }

    setAiInsights({
      totalSpent,
      overspending,
      goodSpending,
      warnings,
      savingsTips
    });
  };

  // AI PREDICTIONS GENERATION
  const generatePredictions = () => {
    if (expenses.length < 5) {
      setPredictions({
        nextMonthTotal: 0,
        confidence: 'low',
        message: 'Need at least 5 expenses for predictions'
      });
      return;
    }

    const categoryAverages = {};
    const categoryFrequency = {};

    categories.forEach(cat => {
      const categoryExpenses = expenses.filter(e => e.category === cat.value);
      if (categoryExpenses.length > 0) {
        const total = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
        categoryAverages[cat.value] = total / categoryExpenses.length;
        categoryFrequency[cat.value] = categoryExpenses.length;
      }
    });

    const recentExpenses = expenses.slice(-30);
    const recentTotal = recentExpenses.reduce((sum, e) => sum + e.amount, 0);
    const daysWithExpenses = new Set(recentExpenses.map(e => e.date.toDateString())).size;
    const avgDailyRecent = recentTotal / Math.max(1, daysWithExpenses);

    const trendMultiplier = expenses.length > 10 ? 1.05 : 1.02;
    const predictedTotal = avgDailyRecent * 30 * trendMultiplier;

    const categoryPredictions = categories.map(cat => {
      if (categoryAverages[cat.value]) {
        const frequency = categoryFrequency[cat.value];
        const projectedSpending = categoryAverages[cat.value] * Math.ceil(frequency * 1.1);
        return {
          category: cat.label,
          predicted: Math.round(projectedSpending),
          color: cat.color
        };
      }
      return null;
    }).filter(Boolean);

    setPredictions({
      nextMonthTotal: Math.round(predictedTotal),
      categoryPredictions,
      confidence: expenses.length > 20 ? 'high' : expenses.length > 10 ? 'medium' : 'low',
      trend: trendMultiplier > 1.03 ? 'increasing' : 'stable'
    });
  };

  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="app">
      {/* HEADER */}
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <div className="header-icon">🧠</div>
            <div>
              <h1>AI Expense Tracker</h1>
              <p className="header-subtitle">Smart Financial Management</p>
            </div>
          </div>
          <div className="header-right">
            <p className="total-label">Total Spent</p>
            <p className="total-amount">${totalSpent.toFixed(2)}</p>
          </div>
        </div>
      </header>

      {/* NAVIGATION */}
      <div className="container">
        <nav className="nav-tabs">
          <button 
            className={`nav-tab ${view === 'add' ? 'active' : ''}`}
            onClick={() => setView('add')}
          >
            ➕ Add Expense
          </button>
          <button 
            className={`nav-tab ${view === 'dashboard' ? 'active' : ''}`}
            onClick={() => setView('dashboard')}
          >
            📊 Dashboard
          </button>
          <button 
            className={`nav-tab ${view === 'insights' ? 'active' : ''}`}
            onClick={() => setView('insights')}
          >
            💡 AI Insights
          </button>
          <button 
            className={`nav-tab ${view === 'predictions' ? 'active' : ''}`}
            onClick={() => setView('predictions')}
          >
            🔮 Predictions
          </button>
        </nav>

        {/* ADD EXPENSE VIEW */}
        {view === 'add' && (
          <div className="grid-2">
            <div className="card">
              <h2 className="card-title">➕ Add New Expense</h2>
              
              <div className="form-group">
                <label>Amount ($)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="input"
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What did you spend on?"
                  className="input"
                />
              </div>

              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="input"
                />
              </div>

              <button onClick={addExpense} className="btn-primary">
                Add Expense
              </button>
            </div>

            <div className="card">
              <h2 className="card-title">📅 Recent Expenses</h2>
              <div className="expense-list">
                {expenses.length === 0 ? (
                  <p className="empty-state">No expenses yet. Add your first one!</p>
                ) : (
                  expenses.slice().reverse().map(exp => {
                    const cat = categories.find(c => c.value === exp.category);
                    return (
                      <div key={exp.id} className="expense-item">
                        <div>
                          <div className="expense-desc">{exp.description || cat.label}</div>
                          <div className="expense-date">{exp.date.toLocaleDateString()}</div>
                        </div>
                        <div className="expense-right">
                          <span className="expense-amount" style={{ color: cat.color }}>
                            ${exp.amount.toFixed(2)}
                          </span>
                          <button onClick={() => deleteExpense(exp.id)} className="btn-delete">
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* DASHBOARD VIEW */}
        {view === 'dashboard' && expenses.length > 0 && (
          <div>
            <div className="stats-grid">
              <div className="stat-card purple">
                <div className="stat-content">
                  <p className="stat-label">Total Expenses</p>
                  <p className="stat-value">${totalSpent.toFixed(2)}</p>
                </div>
                <div className="stat-icon">💰</div>
              </div>
              
              <div className="stat-card blue">
                <div className="stat-content">
                  <p className="stat-label">Transactions</p>
                  <p className="stat-value">{expenses.length}</p>
                </div>
                <div className="stat-icon">📝</div>
              </div>
              
              <div className="stat-card pink">
                <div className="stat-content">
                  <p className="stat-label">Avg per Day</p>
                  <p className="stat-value">
                    ${(totalSpent / Math.max(1, new Set(expenses.map(e => e.date.toDateString())).size)).toFixed(2)}
                  </p>
                </div>
                <div className="stat-icon">📈</div>
              </div>
            </div>

            <div className="grid-2">
              <div className="card">
                <h3 className="chart-title">Spending by Category</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getCategoryData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      dataKey="value"
                    >
                      {getCategoryData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="card">
                <h3 className="chart-title">Daily Spending (Last 7 Days)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getDailySpending()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="amount" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <h3 className="chart-title">Monthly Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getMonthlyTrend()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* AI INSIGHTS VIEW */}
        {view === 'insights' && aiInsights && (
          <div>
            {aiInsights.warnings.length > 0 && (
              <div className="alert alert-danger">
                <strong>⚠️ Budget Warnings:</strong> You've exceeded budget in {aiInsights.warnings.join(', ')}
              </div>
            )}

            <div className="grid-2">
              <div className="card">
                <h3 className="card-title">📉 Areas of Concern</h3>
                {aiInsights.overspending.length === 0 ? (
                  <p className="success-text">✅ Great job! No overspending detected.</p>
                ) : (
                  <div className="insights-list">
                    {aiInsights.overspending.map((item, idx) => (
                      <div key={idx} className="insight-item warning">
                        <div className="insight-header">
                          <span className="insight-category">{item.category}</span>
                          <span className="insight-percent">{item.percent.toFixed(0)}%</span>
                        </div>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill warning"
                            style={{ width: `${Math.min(100, item.percent)}%` }}
                          />
                        </div>
                        <p className="insight-text">
                          ${item.spent.toFixed(2)} of ${item.budget} budget
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="card">
                <h3 className="card-title">📈 Good Spending Habits</h3>
                {aiInsights.goodSpending.length === 0 ? (
                  <p className="muted-text">Keep tracking to see progress!</p>
                ) : (
                  <div className="insights-list">
                    {aiInsights.goodSpending.map((item, idx) => (
                      <div key={idx} className="insight-item success">
                        <div className="insight-header">
                          <span className="insight-category">{item.category}</span>
                          <span className="insight-percent success">{item.percent.toFixed(0)}%</span>
                        </div>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill success"
                            style={{ width: `${item.percent}%` }}
                          />
                        </div>
                        <p className="insight-text success">Well within budget! 👍</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="card savings-card">
              <h3 className="card-title">💰 AI Savings Suggestions</h3>
              {aiInsights.savingsTips.length === 0 ? (
                <p>Your spending looks good! Keep it up!</p>
              ) : (
                <div>
                  {aiInsights.savingsTips.map((tip, idx) => (
                    <div key={idx} className="savings-tip">
                      <div className="tip-icon">{tip.icon}</div>
                      <div className="tip-content">
                        <h4>{tip.category}</h4>
                        <p>{tip.tip}</p>
                        <div className="tip-savings">
                          ➡️ Potential savings: <strong>${tip.potential}/month</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="total-savings">
                    <p className="total-savings-text">
                      <strong>Total Potential Savings: ${aiInsights.savingsTips.reduce((sum, tip) => sum + tip.potential, 0)}/month</strong>
                    </p>
                    <p className="yearly-savings">
                      That's ${(aiInsights.savingsTips.reduce((sum, tip) => sum + tip.potential, 0) * 12).toLocaleString()} per year! 🎉
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PREDICTIONS VIEW */}
        {view === 'predictions' && predictions && (
          <div>
            <div className="prediction-header">
              <div className="prediction-icon">🧠</div>
              <div>
                <h2>Next Month Prediction</h2>
                <p>AI-powered financial forecast</p>
              </div>
            </div>

            {predictions.confidence === 'low' ? (
              <div className="alert alert-info">
                <p>{predictions.message}</p>
                <p>Add more expenses to get accurate predictions!</p>
              </div>
            ) : (
              <div>
                <div className="stats-grid">
                  <div className="stat-card gradient">
                    <p className="stat-label">Predicted Total</p>
                    <p className="stat-value">${predictions.nextMonthTotal}</p>
                  </div>
                  <div className="stat-card gradient">
                    <p className="stat-label">Confidence Level</p>
                    <p className="stat-value">{predictions.confidence.toUpperCase()}</p>
                  </div>
                  <div className="stat-card gradient">
                    <p className="stat-label">Trend</p>
                    <p className="stat-value">{predictions.trend === 'increasing' ? '📈 UP' : '📊 STABLE'}</p>
                  </div>
                </div>

                {predictions.categoryPredictions && (
                  <div className="card">
                    <h3 className="chart-title">Predicted Category Breakdown</h3>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={predictions.categoryPredictions}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="predicted" fill="#8b5cf6" radius={[8, 8, 0, 0]}>
                          {predictions.categoryPredictions.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div className="card">
                  <h3 className="card-title">💡 AI Recommendations</h3>
                  <div className="recommendations">
                    <div className="recommendation-item">
                      <p><strong>Budget Alert:</strong> Based on patterns, budget ${predictions.nextMonthTotal} for next month.</p>
                    </div>
                    {predictions.trend === 'increasing' && (
                      <div className="recommendation-item">
                        <p><strong>Trend Notice:</strong> Your spending is trending upward. Review expenses!</p>
                      </div>
                    )}
                    <div className="recommendation-item">
                      <p><strong>Planning Tip:</strong> Set aside ${(predictions.nextMonthTotal * 1.1).toFixed(2)} (10% buffer) for unexpected expenses.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {view !== 'add' && expenses.length === 0 && (
          <div className="card empty-state-card">
            <div className="empty-icon">📊</div>
            <h3>No Data Yet</h3>
            <p>Start adding expenses to see insights and predictions</p>
            <button onClick={() => setView('add')} className="btn-primary">
              Add Your First Expense
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;