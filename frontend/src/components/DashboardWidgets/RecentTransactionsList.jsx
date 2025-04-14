import React, { useEffect, useState } from "react";
import './RecentTransactionsList.css';

const RecentTransactionsList = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch("http://localhost:5001/api/recent_transactions", {
            credentials: "include",
        })
            .then((response) => {
                if (!response.ok) throw new Error("Failed to fetch transactions");
                return response.json();                
            })
            .then((data) => {
                console.log("Recent transactions:", data);
                setTransactions(data);
            })
            .catch((err) => console.error(err))
            .finally(() => setLoading(false))
    }, []);

    return (
        <div className="transactions-card">
            <h2 className="transactions-title">Recent Transactions</h2>
            {loading ? (
                <p>Loading...</p>
            ) : transactions.length === 0 ? (
                <p>No recent transactions found.</p>
            ) : (
                <ul className="transactions-list">
                    {transactions.map((t) => (
                        <li key={t.id} className={`t-item ${t.type.toLowerCase()}`}>
                            <span className="t-date">{t.date}</span>
                            <span className="t-category">{t.category}</span>
                            <span className="t-amount">
                                {t.type === "Expense" ? "-" : "+"}${t.amount.toFixed(2)}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

export default RecentTransactionsList;