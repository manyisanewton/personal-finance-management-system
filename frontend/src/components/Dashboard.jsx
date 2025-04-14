import React, {useEffect, useState} from 'react';

import BalanceSummaryCard from './DashboardWidgets/BalanceSummaryCard';
import MonthlySpendingChart from './DashboardWidgets/MonthlySpendingChart';
import CategorySpendingChart from './DashboardWidgets/CategorySpendingChart';
import RecentTransactionsList from './DashboardWidgets/RecentTransactionsList';
import IncomeVsExpenseChart from './DashboardWidgets/IncomeVsExpenseChart';
import './Dashboard.css';

const Dashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [balanceSummary, setBalanceSummary] = useState({
    total_income: 0,
    total_expense: 0,
    balance: 0,
  });

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
  }, []);

  return (
    <div className="dashboard-container p-10 min-h-screen bg-[#11121E] text-white">
    <h1 className="text-2xl mb-6">Hello from Dashboard</h1>

    <div className="top-summary mb-6">
      <BalanceSummaryCard 
        totalBalance={balanceSummary.balance}
        totalExpenses={balanceSummary.total_expense}
      />
        {/* ... */}
      </div>

      <div className='charts-row'>
        <MonthlySpendingChart transactions={transactions.transactions} />
        <CategorySpendingChart  /> 
      </div>

      <div className='bottom-widgets'>
        <RecentTransactionsList />
        <IncomeVsExpenseChart />
      </div>  
    </div>
  );      
};

export default Dashboard;