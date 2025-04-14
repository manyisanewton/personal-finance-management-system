import React from "react";
import './BalanceSummaryCard.css';

const BalanceSummaryCard = ({ totalBalance, totalExpenses}) => {
    return (
        <div className="balance-card">
            <h2 className="balance-title">Balance Overview</h2>

            <div className="balance-content">
                <div className="balance-row">
                    <span className="label">Total Balane</span>
                    <span className="value balance">${totalBalance.toLocaleString()}</span>
                </div>

                <div className="balance-row">
                    <span className="label">Total Expenses</span>
                    <span className="value expense">${totalExpenses.toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
};

export default BalanceSummaryCard;