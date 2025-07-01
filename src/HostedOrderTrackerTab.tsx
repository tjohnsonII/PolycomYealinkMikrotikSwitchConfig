import React, { useState, useRef } from 'react';
import * as Papa from 'papaparse';

// All fields as rows, columns are customers
const DEFAULT_FIELDS = [
  'CUSTOMER ABBREV', 'CUSTOMER NAME', 'LOCATION', 'DEPLOY FROM (SF/GR)', 'PROJECT MANAGER',
  'SURVEY DATE', 'KICKOFF DATE', 'INSTALL DATE', 'ON-NET or OTT', 'ORDER ID', 'PON',
  'LINK TO CONTRACT', '# SEATS MINIMUM', 'PBX TYPE', 'PBX IP ADDRESS', 'PHONE MODEL / QTY',
  'SWITCH / ASSET #', 'UPS / ASSET #', 'SIDECAR / ASSET #', 'MIKROTIK / ASSET #', 'MIKROTIK IP',
  'ATA / ASSET #', 'ALGO / ASSET #', 'Wall Mount | QTY', 'NOTES', 'ORDER TASKS',
  'HOSTED JOBVIEWER', 'CONFIRM INVENTORY', 'CHANGE VPBX PAGE TO PROVISIONING',
  'INCREASE PARKING LOT TIMING TO 300 (OPTIONAL)', 'PROVISION SWITCH', 'SAVED CONFIG ON SWITCH',
  'UPDATED SWITCH ASSET PAGE WITH CONFIG', 'CONFIGURED TIK (OTT)', 'CREATE SOFTPHONES',
  'PROVISION PHONES AND TEST', 'PROGRAM ATA', 'ASSET LABEL ON ATA', 'UPLOAD ATA CONFIG TO ASSET PAGE',
  'LABEL AND PLACE EQUIPMENT ON RACK', 'VERIFY ALL  EQUIPMENT ON ASSET PAGE',
  'NOTIFY TECHS OF EQUIPMENT LOCATION', 'TURN UP DAY TASKS', 'ATA TESTED', 'ALGO TESTED',
  'CONFIGURED TIK', 'INCREASE UDP TIMEOUT', 'WHITELISTED TIK AND DIA CIRCUIT',
  'EXPORT FINAL TIK CONFIG AND UPLOAD TO ASSET PAGE', 'EXPORT FINAL SWITCH CONFIG / UPLOAD TO ASSET PAGE',
  'ALL PHONES ONLINE', 'TN ORDERS', 'CHANGE VPBX PAGE TO PRODUCTION', 'CREATE TURNUP TICKET',
  'SEND TRAINING MATERIALS', 'UPDATE TASKS IN ORDER WEB ADMIN', 'UPDATE SITE NOTES',
  'UPDATE HOSTED JOB TRACKER',
];

const DEFAULT_CUSTOMERS = [''];

const CHECKBOX_FIELDS = new Set([
  'HOSTED JOBVIEWER', 'CONFIRM INVENTORY', 'CHANGE VPBX PAGE TO PROVISIONING',
  'INCREASE PARKING LOT TIMING TO 300 (OPTIONAL)', 'PROVISION SWITCH', 'SAVED CONFIG ON SWITCH',
  'UPDATED SWITCH ASSET PAGE WITH CONFIG', 'CONFIGURED TIK (OTT)', 'CREATE SOFTPHONES',
  'PROVISION PHONES AND TEST', 'PROGRAM ATA', 'ASSET LABEL ON ATA', 'UPLOAD ATA CONFIG TO ASSET PAGE',
  'LABEL AND PLACE EQUIPMENT ON RACK', 'VERIFY ALL  EQUIPMENT ON ASSET PAGE',
  'NOTIFY TECHS OF EQUIPMENT LOCATION', 'TURN UP DAY TASKS', 'ATA TESTED', 'ALGO TESTED',
  'CONFIGURED TIK', 'INCREASE UDP TIMEOUT', 'WHITELISTED TIK AND DIA CIRCUIT',
  'EXPORT FINAL TIK CONFIG AND UPLOAD TO ASSET PAGE', 'EXPORT FINAL SWITCH CONFIG / UPLOAD TO ASSET PAGE',
  'ALL PHONES ONLINE', 'TN ORDERS', 'CHANGE VPBX PAGE TO PRODUCTION', 'CREATE TURNUP TICKET',
  'SEND TRAINING MATERIALS', 'UPDATE TASKS IN ORDER WEB ADMIN', 'UPDATE SITE NOTES',
  'UPDATE HOSTED JOB TRACKER',
]);

const HostedOrderTrackerTab: React.FC = () => {
  const [fields, setFields] = useState([...DEFAULT_FIELDS]);
  const [customers, setCustomers] = useState([...DEFAULT_CUSTOMERS]);
  const [data, setData] = useState<{ [field: string]: { [customer: string]: string } }>(
    Object.fromEntries(DEFAULT_FIELDS.map(f => [f, { '': '' }]))
  );
  const downloadRef = useRef<HTMLAnchorElement>(null);

  // CSV Import
  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: Papa.ParseResult<Record<string, string>>) => {
        const csvData = results.data as Record<string, string>[];
        if (!csvData.length) return;
        // First column is field, rest are customers
        const csvFields = csvData.map(row => row['Field'] || row['field'] || Object.values(row)[0]);
        const csvCustomers = Object.keys(csvData[0]).filter(k => k !== 'Field' && k !== 'field');
        const newData: { [field: string]: { [customer: string]: string } } = {};
        csvFields.forEach((f, i) => {
          newData[f] = {};
          csvCustomers.forEach(c => {
            newData[f][c] = csvData[i][c] || '';
          });
        });
        setFields(csvFields);
        setCustomers(csvCustomers);
        setData(newData);
      },
    });
  }

  // CSV Export
  function handleExport() {
    const csvHeader = ['Field', ...customers].join(',') + '\n';
    const csvRows = fields.map(f => [f, ...customers.map(c => data[f]?.[c] || '')].map(v => `"${(v || '').replace(/"/g, '""')}"`).join(',')).join('\n') + '\n';
    const csv = csvHeader + csvRows;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    if (downloadRef.current) {
      downloadRef.current.href = url;
      downloadRef.current.download = 'order_tracker.csv';
      downloadRef.current.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }

  function handleCellChange(field: string, customer: string, value: string) {
    setData(d => ({ ...d, [field]: { ...d[field], [customer]: value } }));
  }
  function handleCheckboxChange(field: string, customer: string, checked: boolean) {
    setData(d => ({ ...d, [field]: { ...d[field], [customer]: checked ? 'TRUE' : 'FALSE' } }));
  }
  function handleAddField() {
    const newField = prompt('Enter new field name:') || '';
    if (!newField || fields.includes(newField)) return;
    setFields(f => [...f, newField]);
    setData(d => ({ ...d, [newField]: Object.fromEntries(customers.map(c => [c, ''])) }));
  }
  function handleDeleteField(idx: number) {
    const field = fields[idx];
    setFields(f => f.filter((_, i) => i !== idx));
    setData(d => {
      const { [field]: _, ...rest } = d;
      return rest;
    });
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <h2>Hosted Order Tracker</h2>
      <div style={{ marginBottom: 12 }}>
        <input type="file" accept=".csv" onChange={handleImport} />
        <button type="button" onClick={handleExport} style={{ marginLeft: 8 }}>Export as CSV</button>
        <a ref={downloadRef} style={{ display: 'none' }}>Download</a>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ccc', padding: 4, background: '#f4f4f4' }}>Field</th>
              {customers.map((c, i) => (
                <th key={c} style={{ border: '1px solid #ccc', padding: 4, background: '#f4f4f4', position: 'relative' }}>
                  {c || 'Customer'}
                  {customers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomer(i)}
                      style={{ position: 'absolute', top: 2, right: 2, background: 'none', border: 'none', color: 'red', fontWeight: 'bold', cursor: 'pointer' }}
                      title={`Delete customer ${c}`}
                    >
                      ×
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fields.map((field, i) => (
              <tr key={field}>
                <td style={{ border: '1px solid #ccc', padding: 4, background: '#f4f4f4', position: 'relative' }}>
                  {field}
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteField(i)}
                      style={{ position: 'absolute', top: 2, right: 2, background: 'none', border: 'none', color: 'red', fontWeight: 'bold', cursor: 'pointer' }}
                      title={`Delete field ${field}`}
                    >
                      ×
                    </button>
                  )}
                </td>
                {customers.map(cust => (
                  <td key={cust} style={{ border: '1px solid #ccc', padding: 4 }}>
                    {CHECKBOX_FIELDS.has(field) ? (
                      <input
                        type="checkbox"
                        checked={data[field]?.[cust] === 'TRUE'}
                        onChange={e => handleCheckboxChange(field, cust, e.target.checked)}
                      />
                    ) : (
                      <input
                        type="text"
                        value={data[field]?.[cust] || ''}
                        onChange={e => handleCellChange(field, cust, e.target.value)}
                        style={{ width: '100%', border: '1px solid #ccc', borderRadius: 4, padding: 4 }}
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HostedOrderTrackerTab;
