import React, { useState } from 'react';
import Select from 'react-select';
import './CurrencyConverter.css';

const currencyOptions = [
  { value: 'USD', label: 'United States Dollar (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'GBP', label: 'British Pound Sterling (GBP)' },
  { value: 'JPY', label: 'Japanese Yen (JPY)' },
  { value: 'CAD', label: 'Canadian Dollar (CAD)' },
  { value: 'AUD', label: 'Australian Dollar (AUD)' },
  { value: 'CHF', label: 'Swiss Franc (CHF)' },
  { value: 'CNY', label: 'Chinese Yuan (CNY)' },
  { value: 'SEK', label: 'Swedish Krona (SEK)' },
  { value: 'NZD', label: 'New Zealand Dollar (NZD)' },
  { value: 'KES', label: 'Kenyan Shilling (KES)' },
  { value: 'TZS', label: 'Tanzanian Shilling (TZS)' },
  { value: 'UGX', label: 'Ugandan Shilling (UGX)' },
  { value: 'RWF', label: 'Rwandan Franc (RWF)' },
  { value: 'BIF', label: 'Burundian Franc (BIF)' },
  { value: 'ETB', label: 'Ethiopian Birr (ETB)' },
  { value: 'NGN', label: 'Nigerian Naira (NGN)' },
  { value: 'GHS', label: 'Ghanaian Cedi (GHS)' },
  { value: 'SLL', label: 'Sierra Leonean Leone (SLL)' },
  { value: 'LRD', label: 'Liberian Dollar (LRD)' },
  { value: 'XOF', label: 'West African CFA Franc (XOF)' },
];

const CurrencyConverter = () => {
  const [amount, setAmount] = useState('');
  const [fromCurrency, setFromCurrency] = useState(currencyOptions.find(opt => opt.value === 'USD'));
  const [toCurrency, setToCurrency] = useState(currencyOptions.find(opt => opt.value === 'EUR'));
  const [conversionResult, setConversionResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const convertCurrency = async () => {
    setLoading(true);
    setError(null);
    setConversionResult(null);
    try {
      const response = await fetch(
        `http://127.0.0.1:5001/api/convert?amount=${amount}&from=${fromCurrency.value}&to=${toCurrency.value}`
      );
      if (!response.ok) throw new Error('Conversion failed');
      const data = await response.json();
      setConversionResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="converter-container">
      <h2>Currency Converter</h2>
      <div className="form-group">
        <label>Amount:</label>
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="Enter amount"
        />
      </div>
      <div className="form-group">
        <label>From:</label>
        <Select
          value={fromCurrency}
          onChange={setFromCurrency}
          options={currencyOptions}
          placeholder="Select currency"
        />
      </div>
      <div className="form-group">
        <label>To:</label>
        <Select
          value={toCurrency}
          onChange={setToCurrency}
          options={currencyOptions}
          placeholder="Select currency"
        />
      </div>
      <button onClick={convertCurrency} disabled={loading}>
        {loading ? 'Converting...' : 'Convert'}
      </button>

      {error && <p className="error-text">Error: {error}</p>}

      {conversionResult && (
        <div className="result-container">
          <h3>Conversion Result:</h3>
          <p>
            {conversionResult.original_amount} {conversionResult.from_currency} ={' '}
            {conversionResult.converted_amount.toFixed(2)} {conversionResult.to_currency}
          </p>
          <p>Exchange Rate: {conversionResult.rate}</p>
        </div>
      )}
    </div>
  );
};

export default CurrencyConverter;
