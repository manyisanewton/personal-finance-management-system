import React, { useEffect, useState } from "react";
import './RecentTransactionsList.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBurger, faCar, faHome, faMoneyBill, faGamepad, faQuestionCircle, faMinusCircle, faPlusCircle, faUtensils } from '@fortawesome/free-solid-svg-icons';

const categoryIcons = {
    'Food': faBurger,
    'Transport': faCar,
    'Rent': faHome,
    'Salary': faPlusCircle,
    'Entertainment': faGamepad,
    'Bills': faMoneyBill,
    'Other': faQuestionCircle

}

const RecentTransactionsList = ({ accountId }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true)
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

    useEffect(() => {
        const params = new URLSearchParams();
        if (accountId) {
            params.append('account_id', accountId);
        }
        fetch(`${API_URL}/api/recent_transactions?${params.toString()}`, {
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
    }, [API_URL, accountId]);

    return (
        <div className="transactions-card">
            <div className="transactions-header">
                <h2 className="transactions-title">Recent Transactions</h2>
            </div>
            {loading ? (
                <p className="loading-text">Loading...</p>
            ) : transactions.length === 0 ? (
                <p className="empty-text"> No recent transactions found.</p>
            ) : (
                <ul className="transactions-list">
                    {transactions.slice(0, 5).map((t) => (
                        <li key={t.id} className={`t-item ${t.type.toLowerCase()}`}>
                            <div className="t-details">
                                <FontAwesomeIcon icon={categoryIcons[t.category] || categoryIcons['Other']}
                                    className="t-icon" />

                                <div className="t-info">
                                    <span className="t-description">{t.title}</span>
                                    <span className="t-date">{new Date(t.date).toLocaleDateString(undefined, {year: 'numeric', month: 'short', day: 'numeric'})}</span>
                                </div>
                            </div>
                            <span className={`t-amount ${t.type.toLowerCase()}`}>
                                {t.type === "Expense" ? "-" : "+"}Ksh.{t.amount.toFixed(2)}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

export default RecentTransactionsList;
