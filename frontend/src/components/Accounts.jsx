import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import './Accounts.css';

const Accounts = () => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
  const [accounts, setAccounts] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);

  const [accountForm, setAccountForm] = useState({
    id: null,
    name: '',
    type: '',
    currency: 'USD',
    starting_balance: '',
  });

  const [transferForm, setTransferForm] = useState({
    from_account_id: '',
    to_account_id: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    title: 'Transfer',
  });

  const [reconciliationForm, setReconciliationForm] = useState({
    account_id: '',
    statement_balance: '',
    statement_date: new Date().toISOString().split('T')[0],
  });
  const [reconciliations, setReconciliations] = useState([]);
  const [reconcileLoading, setReconcileLoading] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvLoading, setCsvLoading] = useState(false);

  const [statementForm, setStatementForm] = useState(() => {
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - 30);
    return {
      account_id: '',
      start_date: start.toISOString().split('T')[0],
      end_date: today.toISOString().split('T')[0],
    };
  });
  const [statementLoading, setStatementLoading] = useState(false);

  useEffect(() => {
    fetchAccounts();
    fetchTransfers();
  }, []);

  useEffect(() => {
    if (accounts.length && !reconciliationForm.account_id) {
      setReconciliationForm((prev) => ({ ...prev, account_id: accounts[0].id }));
    }
  }, [accounts, reconciliationForm.account_id]);

  useEffect(() => {
    if (accounts.length && !statementForm.account_id) {
      setStatementForm((prev) => ({ ...prev, account_id: accounts[0].id }));
    }
  }, [accounts, statementForm.account_id]);

  useEffect(() => {
    if (reconciliationForm.account_id) {
      fetchReconciliations(reconciliationForm.account_id);
    } else {
      setReconciliations([]);
    }
  }, [reconciliationForm.account_id]);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/accounts`, {
        credentials: 'include',
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to fetch accounts');
      }
      const data = await response.json();
      setAccounts(data);
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: error.message });
    } finally {
      setLoading(false);
    }
  };


  const fetchReconciliations = async (accountId) => {
    try {
      const response = await fetch(`${API_URL}/api/accounts/${accountId}/reconciliations`, {
        credentials: 'include',
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to fetch reconciliations');
      }
      const data = await response.json();
      setReconciliations(data);
    } catch (error) {
      console.error('Error fetching reconciliations:', error);
      setReconciliations([]);
    }
  };

  const fetchTransfers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/transfers?limit=20`, {
        credentials: 'include',
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to fetch transfers');
      }
      const data = await response.json();
      setTransfers(data);
    } catch (error) {
      console.error('Error fetching transfers:', error);
    }
  };

  const handleAccountChange = (e) => {
    const { name, value } = e.target;
    setAccountForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleTransferChange = (e) => {
    const { name, value } = e.target;
    setTransferForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleReconciliationChange = (e) => {
    const { name, value } = e.target;
    setReconciliationForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCsvChange = (e) => {
    setCsvFile(e.target.files[0] || null);
  };


  const handleStatementChange = (e) => {
    const { name, value } = e.target;
    setStatementForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleStatementDownload = async (e) => {
    e.preventDefault();

    if (!statementForm.account_id) {
      Swal.fire({ icon: 'error', title: 'Validation Error', text: 'Select an account' });
      return;
    }
    if (!statementForm.start_date || !statementForm.end_date) {
      Swal.fire({ icon: 'error', title: 'Validation Error', text: 'Select a date range' });
      return;
    }

    setStatementLoading(true);
    try {
      const params = new URLSearchParams({
        start_date: statementForm.start_date,
        end_date: statementForm.end_date,
      });
      const response = await fetch(
        `${API_URL}/api/accounts/${statementForm.account_id}/statement_pdf?${params.toString()}`,
        { credentials: 'include' }
      );
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to download statement');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `statement_${statementForm.start_date}_${statementForm.end_date}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: error.message });
    } finally {
      setStatementLoading(false);
    }
  };

  const resetAccountForm = () => {
    setAccountForm({
      id: null,
      name: '',
      type: '',
      currency: 'USD',
      starting_balance: '',
    });
  };

  const handleAccountSubmit = async (e) => {
    e.preventDefault();

    if (!accountForm.name.trim()) {
      Swal.fire({ icon: 'error', title: 'Validation Error', text: 'Account name is required' });
      return;
    }
    if (!accountForm.type.trim()) {
      Swal.fire({ icon: 'error', title: 'Validation Error', text: 'Account type is required' });
      return;
    }

    setFormLoading(true);
    try {
      const method = accountForm.id ? 'PUT' : 'POST';
      const url = accountForm.id
        ? `${API_URL}/api/accounts/${accountForm.id}`
        : `${API_URL}/api/accounts`;

      const payload = {
        name: accountForm.name.trim(),
        type: accountForm.type.trim(),
        currency: accountForm.currency.trim() || 'USD',
        starting_balance: accountForm.starting_balance ? parseFloat(accountForm.starting_balance) : 0,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to save account');
      }

      const saved = await response.json();
      if (accountForm.id) {
        setAccounts((prev) => prev.map((item) => (item.id === saved.id ? { ...item, ...saved } : item)));
      } else {
        setAccounts((prev) => [...prev, saved]);
      }
      Swal.fire({ icon: 'success', title: 'Saved', text: 'Account saved successfully.' });
      resetAccountForm();
      fetchAccounts();
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: error.message });
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditAccount = (account) => {
    setAccountForm({
      id: account.id,
      name: account.name,
      type: account.type,
      currency: account.currency,
      starting_balance: account.starting_balance,
    });
  };

  const handleDeleteAccount = async (accountId) => {
    const result = await Swal.fire({
      title: 'Delete account?',
      text: 'This cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`${API_URL}/api/accounts/${accountId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to delete account');
      }
      setAccounts((prev) => prev.filter((item) => item.id !== accountId));
      Swal.fire({ icon: 'success', title: 'Deleted' });
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: error.message });
    }
  };


  const handleReconciliationSubmit = async (e) => {
    e.preventDefault();

    if (!reconciliationForm.account_id) {
      Swal.fire({ icon: 'error', title: 'Validation Error', text: 'Select an account' });
      return;
    }
    if (!reconciliationForm.statement_balance) {
      Swal.fire({ icon: 'error', title: 'Validation Error', text: 'Statement balance is required' });
      return;
    }

    setReconcileLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/accounts/${reconciliationForm.account_id}/reconciliations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          statement_date: reconciliationForm.statement_date,
          statement_balance: parseFloat(reconciliationForm.statement_balance),
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to reconcile account');
      }

      Swal.fire({ icon: 'success', title: 'Reconciled', text: 'Statement saved.' });
      setReconciliationForm((prev) => ({
        ...prev,
        statement_balance: '',
        statement_date: new Date().toISOString().split('T')[0],
      }));
      fetchReconciliations(reconciliationForm.account_id);
      fetchAccounts();
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: error.message });
    } finally {
      setReconcileLoading(false);
    }
  };

  const handleCsvUpload = async (e) => {
    e.preventDefault();

    if (!reconciliationForm.account_id) {
      Swal.fire({ icon: 'error', title: 'Validation Error', text: 'Select an account' });
      return;
    }
    if (!csvFile) {
      Swal.fire({ icon: 'error', title: 'Validation Error', text: 'Select a CSV file' });
      return;
    }

    const formData = new FormData();
    formData.append('file', csvFile);

    setCsvLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/accounts/${reconciliationForm.account_id}/statement_import`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to import statement');
      }

      Swal.fire({
        icon: 'success',
        title: 'Import complete',
        text: `Imported ${data.created} transactions. Skipped ${data.skipped}.`,
      });
      setCsvFile(null);
      fetchAccounts();
      fetchReconciliations(reconciliationForm.account_id);
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: error.message });
    } finally {
      setCsvLoading(false);
    }
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();

    if (!transferForm.from_account_id || !transferForm.to_account_id) {
      Swal.fire({ icon: 'error', title: 'Validation Error', text: 'Choose both accounts' });
      return;
    }
    if (transferForm.from_account_id === transferForm.to_account_id) {
      Swal.fire({ icon: 'error', title: 'Validation Error', text: 'Accounts must differ' });
      return;
    }
    if (!transferForm.amount || Number(transferForm.amount) <= 0) {
      Swal.fire({ icon: 'error', title: 'Validation Error', text: 'Amount must be positive' });
      return;
    }

    setTransferLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/transfers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          from_account_id: parseInt(transferForm.from_account_id, 10),
          to_account_id: parseInt(transferForm.to_account_id, 10),
          amount: parseFloat(transferForm.amount),
          date: transferForm.date,
          title: transferForm.title || 'Transfer',
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to create transfer');
      }

      Swal.fire({ icon: 'success', title: 'Transfer complete' });
      setTransferForm({
        from_account_id: '',
        to_account_id: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        title: 'Transfer',
      });
      fetchAccounts();
      fetchTransfers();
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: error.message });
    } finally {
      setTransferLoading(false);
    }
  };

  return (
    <section className="accounts-page" aria-labelledby="accounts-heading">
      <h2 id="accounts-heading">Accounts</h2>

      <div className="accounts-grid">
        <div className="accounts-card">
          <h3>{accountForm.id ? 'Edit Account' : 'Create Account'}</h3>
          <form onSubmit={handleAccountSubmit} className="accounts-form">
            <label htmlFor="name">Name</label>
            <input id="name" name="name" value={accountForm.name} onChange={handleAccountChange} />

            <label htmlFor="type">Type</label>
            <input id="type" name="type" value={accountForm.type} onChange={handleAccountChange} placeholder="Checking, Savings" />

            <label htmlFor="currency">Currency</label>
            <input id="currency" name="currency" value={accountForm.currency} onChange={handleAccountChange} />

            <label htmlFor="starting_balance">Starting Balance</label>
            <input
              id="starting_balance"
              name="starting_balance"
              type="number"
              step="0.01"
              value={accountForm.starting_balance}
              onChange={handleAccountChange}
            />

            <div className="form-actions">
              <button type="submit" disabled={formLoading}>
                {formLoading ? 'Saving...' : accountForm.id ? 'Update' : 'Create'}
              </button>
              {accountForm.id && (
                <button type="button" className="secondary" onClick={resetAccountForm}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="accounts-card">
          <h3>Transfer Between Accounts</h3>
          <form onSubmit={handleTransferSubmit} className="accounts-form">
            <label htmlFor="from_account_id">From</label>
            <select id="from_account_id" name="from_account_id" value={transferForm.from_account_id} onChange={handleTransferChange}>
              <option value="">Select account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
            </select>

            <label htmlFor="to_account_id">To</label>
            <select id="to_account_id" name="to_account_id" value={transferForm.to_account_id} onChange={handleTransferChange}>
              <option value="">Select account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
            </select>

            <label htmlFor="amount">Amount</label>
            <input id="amount" name="amount" type="number" step="0.01" value={transferForm.amount} onChange={handleTransferChange} />

            <label htmlFor="date">Date</label>
            <input id="date" name="date" type="date" value={transferForm.date} onChange={handleTransferChange} />

            <label htmlFor="title">Title</label>
            <input id="title" name="title" value={transferForm.title} onChange={handleTransferChange} />

            <div className="form-actions">
              <button type="submit" disabled={transferLoading}>
                {transferLoading ? 'Transferring...' : 'Transfer'}
              </button>
            </div>
          </form>
        </div>


        <div className="accounts-card statement-card">
          <h3>Statement PDF</h3>
          <form onSubmit={handleStatementDownload} className="accounts-form">
            <label htmlFor="statement_account_id">Account</label>
            <select
              id="statement_account_id"
              name="account_id"
              value={statementForm.account_id}
              onChange={handleStatementChange}
            >
              <option value="">Select account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
            </select>

            <label htmlFor="statement_start_date">Start Date</label>
            <input
              id="statement_start_date"
              name="start_date"
              type="date"
              value={statementForm.start_date}
              onChange={handleStatementChange}
            />

            <label htmlFor="statement_end_date">End Date</label>
            <input
              id="statement_end_date"
              name="end_date"
              type="date"
              value={statementForm.end_date}
              onChange={handleStatementChange}
            />

            <div className="form-actions">
              <button type="submit" disabled={statementLoading}>
                {statementLoading ? 'Generating...' : 'Download PDF'}
              </button>
            </div>
          </form>
        </div>

        <div className="accounts-card reconcile-card">
          <h3>Reconcile Account</h3>
          <form onSubmit={handleReconciliationSubmit} className="accounts-form">
            <label htmlFor="reconcile_account_id">Account</label>
            <select
              id="reconcile_account_id"
              name="account_id"
              value={reconciliationForm.account_id}
              onChange={handleReconciliationChange}
            >
              <option value="">Select account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
            </select>

            <label htmlFor="statement_balance">Statement Balance</label>
            <input
              id="statement_balance"
              name="statement_balance"
              type="number"
              step="0.01"
              value={reconciliationForm.statement_balance}
              onChange={handleReconciliationChange}
            />

            <label htmlFor="statement_date">Statement End Date</label>
            <input
              id="statement_date"
              name="statement_date"
              type="date"
              value={reconciliationForm.statement_date}
              onChange={handleReconciliationChange}
            />

            <div className="form-actions">
              <button type="submit" disabled={reconcileLoading}>
                {reconcileLoading ? 'Reconciling...' : 'Save Statement'}
              </button>
            </div>
          </form>

          <form className="accounts-form csv-form" onSubmit={handleCsvUpload}>
            <label htmlFor="csv_upload">CSV Import</label>
            <input
              id="csv_upload"
              type="file"
              accept=".csv"
              onChange={handleCsvChange}
            />
            <div className="form-actions">
              <button type="submit" disabled={csvLoading}>
                {csvLoading ? 'Uploading...' : 'Upload CSV'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="accounts-list">
        <h3>Account Balances</h3>
        {loading ? (
          <p className="loading">Loading...</p>
        ) : accounts.length === 0 ? (
          <p className="empty">No accounts yet.</p>
        ) : (
          accounts.map((account) => (
            <div key={account.id} className="account-row">
              <div>
                <h4>{account.name}</h4>
                <p className="meta">{account.type} • {account.currency}</p>
              </div>
              <div className="balance">
                <span>Start: {account.starting_balance}</span>
                <strong>Current: {Number(account.current_balance).toFixed(2)}</strong>
              </div>
              <div className="actions">
                <button onClick={() => handleEditAccount(account)}>Edit</button>
                <button className="danger" onClick={() => handleDeleteAccount(account.id)}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>


      <div className="accounts-list reconcile-list">
        <h3>Reconciliation History</h3>
        {!reconciliationForm.account_id ? (
          <p className="empty">Select an account to view statements.</p>
        ) : reconciliations.length === 0 ? (
          <p className="empty">No statements yet.</p>
        ) : (
          reconciliations.map((statement) => (
            <div key={statement.id} className="reconcile-row">
              <div>
                <h4>{statement.statement_date}</h4>
                <p className="meta">Statement balance: {Number(statement.statement_balance).toFixed(2)}</p>
              </div>
              <div className="balance">
                <span>Cleared: {Number(statement.cleared_balance).toFixed(2)}</span>
                <strong>Difference: {Number(statement.difference).toFixed(2)}</strong>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="accounts-list transfer-list">
        <h3>Transfer History</h3>
        {transfers.length === 0 ? (
          <p className="empty">No transfers yet.</p>
        ) : (
          transfers.map((transfer) => (
            <div key={transfer.transfer_group_id} className="transfer-row">
              <div>
                <h4>{transfer.from_account} → {transfer.to_account}</h4>
                <p className="meta">{transfer.date}</p>
              </div>
              <div className="balance">
                <strong>{Number(transfer.amount).toFixed(2)}</strong>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default Accounts;
