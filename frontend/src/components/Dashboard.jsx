import React, {useEffect, useState} from 'react';

//Importing the necessary widgets for the dashboard
import BalanceSummaryCard from './DashboardWidgets/BalanceSummaryCard';
import MonthlySpendingChart from './DashboardWidgets/MonthlySpendingChart';
import CategorySpendingChart from './DashboardWidgets/CategorySpendingChart';
import RecentTransactionsList from './DashboardWidgets/RecentTransactionsList';
import IncomeVsExpenseChart from './DashboardWidgets/IncomeVsExpenseChart';
import SpendingSummary from './DashboardWidgets/SpendingSummary';
import './Dashboard.css';

const Dashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [balanceSummary, setBalanceSummary] = useState({
    total_income: 0,
    total_expense: 0,
    balance: 0,
  });
  const [username, setUsername] = useState("");

  useEffect(() => {
    fetch("http://localhost:5001/api/transactions", {
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data) => setTransactions(data));

    fetch("http://localhost:5001/api/category_spending_summary", {
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data) => setCategories(data));

    fetch("http://localhost:5001/api/balance_summary", {
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data) => setBalanceSummary(data))
      .catch((error) => 
        console.error("Error fetching balance summary:", error)
      );

      fetch("http://localhost:5001/api/username", {
        credentials: "include",
      })
        .then((response) => response.json())
        .then((data) => setUsername(data.username))
        .catch((error) => console.error("Error fetching user:", error));
  }, []);

  return (
    <div className="dashboard-container">
    <h1 className="dashboard-title">Hello {username}, welcome back</h1>

    <div className="top-summary">
      <BalanceSummaryCard 
        label="Total Balance"
        value={balanceSummary.balance}
      />
      <BalanceSummaryCard
        label="Total Expenses"
        value={balanceSummary.total_expense}
      />
        {/* ... */}
      </div>

      <div className='upper-widgets'>
        <MonthlySpendingChart transactions={transactions.transactions} />
        <CategorySpendingChart  /> 
      </div>

      <div className='bottom-widgets'>
        <RecentTransactionsList />
        <IncomeVsExpenseChart />
        <SpendingSummary />
      </div>  
    </div>
  );      
};

export default Dashboard;