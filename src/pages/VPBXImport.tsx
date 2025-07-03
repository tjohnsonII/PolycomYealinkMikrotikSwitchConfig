import React from 'react';


import { useRef, useState } from 'react';

// These should be imported from a shared constants file in a real refactor
const DEFAULT_VPBX_FIELDS = [
  "mac", "model", "extension",
  "name", "description", "tech", "secret", "callwaiting_enable", "voicemail",
  "voicemail_enable", "voicemail_vmpwd", "voicemail_email", "voicemail_pager", "voicemail_options",
  "voicemail_same_exten", "outboundcid", "id", "dial", "user", "max_contacts", "accountcode"
];

type VpbxFormType = Record<string, string>;

const createEmptyVpbxRow = (fields = DEFAULT_VPBX_FIELDS): VpbxFormType => fields.reduce((acc, f) => ({ ...acc, [f]: '' }), {} as VpbxFormType);


const DEFAULT_ROWS = 10;

const VPBXImport: React.FC = () => {
  const [vpbxFields, setVpbxFields] = useState<string[]>([...DEFAULT_VPBX_FIELDS]);
  const [vpbxRows, setVpbxRows] = useState<VpbxFormType[]>(Array(DEFAULT_ROWS).fill(0).map(() => createEmptyVpbxRow(vpbxFields)));
  const vpbxDownloadRef = useRef<HTMLAnchorElement>(null);

  const handleVpbxChange = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setVpbxRows(rows => rows.map((row, i) => i === idx ? { ...row, [name]: value } : row));
  };

  const handleVpbxDeleteColumn = (field: string) => {
    if (vpbxFields.length <= 1) return;
    setVpbxFields(fields => fields.filter(f => f !== field));
    setVpbxRows(rows => rows.map(row => {
      const newRow = { ...row };
      delete newRow[field];
      return newRow;
    }));
  };
  const handleVpbxAddRow = (count = 1) => {
    setVpbxRows(rows => [...rows, ...Array(count).fill(0).map(() => createEmptyVpbxRow(vpbxFields))]);
  };
  const handleVpbxDeleteRow = (idx: number) => {
    setVpbxRows(rows => rows.filter((_, i) => i !== idx));
  };
  const handleVpbxImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).filter(Boolean);
      const [header, ...rows] = lines;
      const fields = header.split(',');
      setVpbxFields(fields);
      const data = rows.map(line => {
        const values = line.split(',');
        return fields.reduce((acc, f, i) => ({ ...acc, [f]: values[i] || '' }), {} as VpbxFormType);
      });
      setVpbxRows(data.length ? data : [createEmptyVpbxRow(fields)]);
    };
    reader.readAsText(file);
  };
  const handleVpbxExport = () => {
    const csv = [vpbxFields.join(',')].concat(
      vpbxRows.map(row => vpbxFields.map(f => row[f] || '').join(','))
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    if (vpbxDownloadRef.current) {
      vpbxDownloadRef.current.href = url;
      vpbxDownloadRef.current.download = 'vpbx_import.csv';
      vpbxDownloadRef.current.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  };

  return (
    <div>
      <h2>VPBX Import</h2>
      <input type="file" accept=".csv" onChange={handleVpbxImport} />
      <button onClick={handleVpbxExport}>Export CSV</button>
      <a ref={vpbxDownloadRef} style={{ display: 'none' }}>Download</a>
      <div style={{ overflowX: 'auto', zoom: 0.8, WebkitTransform: 'scale(0.8)', WebkitTransformOrigin: '0 0' }}>
        <table style={{ borderCollapse: 'collapse', minWidth: '100%' }}>
          <thead>
            <tr>
              {vpbxFields.map(f => (
                <th key={f} style={{ border: '1px solid #ccc', padding: 4, position: 'relative' }}>
                  {f}
                  <button
                    style={{ marginLeft: 4, fontSize: 10, padding: '2px 6px', position: 'absolute', right: 2, top: 2 }}
                    onClick={() => handleVpbxDeleteColumn(f)}
                    title={`Delete column ${f}`}
                  >
                    Delete
                  </button>
                </th>
              ))}
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {vpbxRows.map((row, idx) => (
              <tr key={idx}>
                {vpbxFields.map(f => (
                  <td key={f} style={{ border: '1px solid #ccc', padding: 2 }}>
                    <input
                      name={f}
                      value={row[f] || ''}
                      onChange={e => handleVpbxChange(idx, e)}
                      style={{ width: 120 }}
                    />
                  </td>
                ))}
                <td>
                  <button onClick={() => handleVpbxDeleteRow(idx)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 8 }}>
        <button onClick={() => handleVpbxAddRow(1)}>Add 1 Row</button>{' '}
        <button onClick={() => handleVpbxAddRow(5)}>Add 5 Rows</button>{' '}
        <button onClick={() => handleVpbxAddRow(10)}>Add 10 Rows</button>
      </div>
    </div>
  );
};

export default VPBXImport;
