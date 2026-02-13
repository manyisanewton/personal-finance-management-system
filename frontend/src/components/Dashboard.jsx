import React, {useEffect, useState} from 'react';

import BalanceSummaryCard from './DashboardWidgets/BalanceSummaryCard';
import MonthlySpendingChart from './DashboardWidgets/MonthlySpendingChart';
import CategorySpendingChart from './DashboardWidgets/CategorySpendingChart';
import RecentTransactionsList from './DashboardWidgets/RecentTransactionsList';
import IncomeVsExpenseChart from './DashboardWidgets/IncomeVsExpenseChart';
import SpendingSummary from './DashboardWidgets/SpendingSummary';
import './Dashboard.css';

const Dashboard = () => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [balanceSummary, setBalanceSummary] = useState({
    total_income: 0,
    total_expense: 0,
    balance: 0,
  });
  const [username, setUsername] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/api/accounts`, { credentials: "include" })
      .then((response) => response.json())
      .then((data) => setAccounts(data))
      .catch((error) => console.error("Error fetching accounts:", error));
  }, [API_URL]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedAccount) {
      params.append('account_id', selectedAccount);
    }

    fetch(`${API_URL}/api/transactions?${params.toString()}`, {
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data) => setTransactions(data));

    fetch(`${API_URL}/api/category_spending_summary?${params.toString()}`, {
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data) => setCategories(data));

    fetch(`${API_URL}/api/balance_summary?${params.toString()}`, {
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data) => setBalanceSummary(data))
      .catch((error) =>
        console.error("Error fetching balance summary:", error)
      );

    fetch(`${API_URL}/api/username`, {
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data) => setUsername(data.username))
      .catch((error) => console.error("Error fetching user:", error));
  }, [API_URL, selectedAccount]);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Hello {username}, welcome</h1>
        <div className="account-filter">
          <label htmlFor="account-filter">Account</label>
          <select
            id="account-filter"
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
          >
            <option value="">All Accounts</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="top-summary">
        <BalanceSummaryCard
          label="Total Balance"
          value={balanceSummary.balance}
        />
        <BalanceSummaryCard
          label="Total Expenses"
          value={balanceSummary.total_expense}
        />
      </div>

      <div className='upper-widgets'>
        <MonthlySpendingChart transactions={transactions.transactions} />
        <CategorySpendingChart accountId={selectedAccount} />
      </div>

      <div className='bottom-widgets'>
        <RecentTransactionsList accountId={selectedAccount} />
        <IncomeVsExpenseChart accountId={selectedAccount} />
        <SpendingSummary accountId={selectedAccount} />
      </div>
    </div>
  );
};

export default Dashboard;
