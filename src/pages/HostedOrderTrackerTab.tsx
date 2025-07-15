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

const DEFAULT_CUSTOMERS: string[] = [
  'CUST1', 'CUST2', 'CUST3', 'CUST4', 'CUST5'
];

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
  // ...existing code...
  // function handleDeleteField(idx: number) {
  //   const field = fields[idx];
  //   setFields(f => f.filter((_, i) => i !== idx));
  //   setData(d => {
  //     const { [field]: _removed, ...rest } = d;
  //     return rest;
  //   });
  // }
  // Add a new blank customer column (handle is editable in header)
  function handleAddCustomer() {
    setCustomers(custs => [...custs, '']);
    setData(d => {
      const newData = { ...d };
      for (const f of fields) newData[f] = { ...newData[f], ['']: '' };
      return newData;
    });
  }
  // Update customer handle (header cell input)
  function handleCustomerHandleChange(idx: number, value: string) {
    setCustomers(custs => {
      const newCusts = [...custs];
      const old = newCusts[idx];
      newCusts[idx] = value;
      // Update data keys for all fields
      setData(d => {
        const newData = { ...d };
        for (const f of fields) {
          const fieldData = { ...newData[f] };
          fieldData[value] = fieldData[old] || '';
          if (old !== '') delete fieldData[old];
          newData[f] = fieldData;
        }
        return newData;
      });
      return newCusts;
    });
  }
  function handleDeleteCustomer(idx: number) {
    const name = customers[idx];
    setCustomers(custs => custs.filter((_, i) => i !== idx));
    setData(d => {
      const newData = { ...d };
      for (const f of fields) {
        const fieldData = { ...newData[f] };
        delete fieldData[name];
        newData[f] = fieldData;
      }
      return newData;
    });
  }

  return (
    <div className="hosted-order-tracker-container">
      <h2 className="hosted-order-tracker-title">Hosted Order Tracker</h2>
      <div className="hosted-order-tracker-controls">
        <label htmlFor="csv-import" className="sr-only">Import CSV file</label>
        <input 
          id="csv-import"
          type="file" 
          accept=".csv" 
          onChange={handleImport}
          className="hosted-order-tracker-file-input"
          aria-label="Import CSV file"
        />
        <button 
          type="button" 
          onClick={handleExport} 
          className="hosted-order-tracker-button"
          aria-label="Export data as CSV file"
        >
          Export as CSV
        </button>
        <button 
          type="button" 
          onClick={handleAddCustomer} 
          className="hosted-order-tracker-button hosted-order-tracker-button-secondary"
          aria-label="Add new customer column"
        >
          Add Column
        </button>
        <a ref={downloadRef} className="hosted-order-tracker-download-link">Download</a>
      </div>
      <div className="hosted-order-tracker-table-container">
        <table className="hosted-order-tracker-table">
          <thead className="hosted-order-tracker-table-header">
            <tr>
              <th className="hosted-order-tracker-table-th">Field</th>
              {customers.map((c, i) => (
                <th key={i} className="hosted-order-tracker-table-th-customer">
                  <div className="hosted-order-tracker-customer-controls">
                    <label htmlFor={`customer-${i}`} className="sr-only">Customer handle</label>
                    <input
                      id={`customer-${i}`}
                      type="text"
                      value={c}
                      onChange={e => handleCustomerHandleChange(i, e.target.value)}
                      placeholder="Handle (e.g. WS7)"
                      className="hosted-order-tracker-customer-input"
                      aria-label={`Customer ${i + 1} handle`}
                    />
                    {customers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomer(i)}
                        className="hosted-order-tracker-button-danger"
                        title={`Delete customer column ${c || i + 1}`}
                        aria-label={`Delete customer column ${c || i + 1}`}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fields.map((field) => (
              <tr key={field} className="hosted-order-tracker-table-row">
                <td className="hosted-order-tracker-table-td">
                  {field}
                </td>
                {customers.map(cust => (
                  <td key={cust} className="hosted-order-tracker-table-td-data">
                    <div className="hosted-order-tracker-cell-container">
                      {CHECKBOX_FIELDS.has(field) ? (
                        <>
                          <label htmlFor={`${field}-${cust}`} className="sr-only">
                            {field} for {cust || 'customer'}
                          </label>
                          <input
                            id={`${field}-${cust}`}
                            type="checkbox"
                            checked={data[field]?.[cust] === 'TRUE'}
                            onChange={e => handleCheckboxChange(field, cust, e.target.checked)}
                            className="hosted-order-tracker-checkbox"
                            aria-label={`${field} for ${cust || 'customer'}`}
                          />
                        </>
                      ) : (
                        <>
                          <label htmlFor={`${field}-${cust}-text`} className="sr-only">
                            {field} for {cust || 'customer'}
                          </label>
                          <input
                            id={`${field}-${cust}-text`}
                            type="text"
                            value={data[field]?.[cust] || ''}
                            onChange={e => handleCellChange(field, cust, e.target.value)}
                            className="hosted-order-tracker-text-input"
                            aria-label={`${field} for ${cust || 'customer'}`}
                            placeholder={`Enter ${field.toLowerCase()}`}
                          />
                        </>
                      )}
                    </div>
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
