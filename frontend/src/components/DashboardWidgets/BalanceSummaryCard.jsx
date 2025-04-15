import React from "react";
import './BalanceSummaryCard.css';

const BalanceSummaryCard = ({ label, value }) => {
    const isNegative = Number(value) <= 0;
    const valueClassName = `value ${label.toLowerCase().includes('balance') ? 'balance' : 'expenses'} ${isNegative ? 'negative' : ''}`;
    
    return (
        <div className="balance-card">
            <h2 className="balance-title">{ label }</h2>

            <div className="balance-content">
                <div className="balance-row">
                    <span className="label">{label}</span>
                    <span className={valueClassName}>
                        ${(Number(value) || 0).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default BalanceSummaryCard;