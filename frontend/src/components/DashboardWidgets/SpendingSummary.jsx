import React, { useEffect, useState } from "react";
import "./SpendingSummary.css";
import { sum } from "lodash";

const SpendingSummary = ({ accountId }) => {
    const [summary, setSummary] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

    useEffect(() => {
        const fetchSpendingSummary = async () => {
            try {
                const params = new URLSearchParams();
                if (accountId) {
                    params.append('account_id', accountId);
                }
                const response = await fetch(`${API_URL}/api/spending_summary?${params.toString()}`, {
                    credentials: "include",
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch spendinf summary');
                }
                const data = await response.json();
                setSummary(data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching spending summary:", error);
                setError(error);
                setLoading(false);
            }
        };

        fetchSpendingSummary();

    }, [API_URL, accountId]);

    if (loading) {
        return (
            <div className="spending-summary-card">
                <h2 className="spending-summary-title">Spending Summary</h2>
                <p className="loading-text">Loading...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="spending-summary-card">
                <h2 className="spending-summary-title">Spending Summary</h2>
                <p className="error-text">Error: {error.message}</p>
            </div>
        )
    }

    const percentageSpent = summary?.total_budget > 0 ? (summary.total_spent / summary.total_budget) * 100 : 0;
    const remaining = summary?.remaining >= 0 ? `Ksh.${summary.remaining.toFixed(2)}` : `Ksh.${Math.abs(summary.remaining).toFixed(2)} (Overspent)`;
    const remainingClass = summary?.remaining >= 0 ? 'remaining' : 'overspent';
    
    return (
        <div className="spending-summary-card progress-bar-card">
            <h2 className="spending-summary-title">Spending Summary</h2>
            <div className="spending-summary-content">
                <div className="summary-item">
                    <span className="label">Total Budget:</span>
                    <span className="value budget">Ksh.{summary?.total_budget?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="progress-bar-container">
                    <div className="progress-bar" style={{width: `${percentageSpent}%`, backgroundColor: percentageSpent > 100 ? '#FF4D4D' : '#E668EA',}}></div>
                </div>
                <div className="summary-item">
                    <span className="label">Remaining:</span>
                    <span className={`value ${remainingClass}`}>{remaining}</span>
                </div>
            </div>
        </div>
    )
} 

export default SpendingSummary;
