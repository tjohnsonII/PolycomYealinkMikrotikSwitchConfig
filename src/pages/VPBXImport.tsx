import React from 'react';


import { useRef, useState } from 'react';

// These should be imported from a shared constants file in a real refactor
const VPBX_FIELDS = [
  "mac", "model", "extension",
  "name", "description", "tech", "secret", "callwaiting_enable", "voicemail",
  "voicemail_enable", "voicemail_vmpwd", "voicemail_email", "voicemail_pager", "voicemail_options",
  "voicemail_same_exten", "outboundcid", "id", "dial", "user", "max_contacts", "accountcode"
];

type VpbxFormType = Record<string, string>;

const createEmptyVpbxRow = (): VpbxFormType => VPBX_FIELDS.reduce((acc, f) => ({ ...acc, [f]: '' }), {} as VpbxFormType);

const VPBXImport: React.FC = () => {
  const [vpbxRows, setVpbxRows] = useState<VpbxFormType[]>([createEmptyVpbxRow()]);
  const vpbxDownloadRef = useRef<HTMLAnchorElement>(null);

  const handleVpbxChange = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setVpbxRows(rows => rows.map((row, i) => i === idx ? { ...row, [name]: value } : row));
  };
  const handleVpbxAddRow = (count = 1) => {
    setVpbxRows(rows => [...rows, ...Array(count).fill(0).map(createEmptyVpbxRow)]);
  };
  const handleVpbxDeleteRow = (idx: number) => {
    setVpbxRows(rows => rows.filter((_, i) => i !== idx));
  };
  const handleVpbxImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    // CSV import logic (stub)
  };
  const handleVpbxExport = () => {
    // CSV export logic (stub)
  };

  return (
    <div>
      <h2>VPBX Import</h2>
      <input type="file" accept=".csv" onChange={handleVpbxImport} />
      <button onClick={handleVpbxExport}>Export CSV</button>
      <a ref={vpbxDownloadRef} style={{ display: 'none' }}>Download</a>
      <table>
        <thead>
          <tr>
            {VPBX_FIELDS.map(f => <th key={f}>{f}</th>)}
          </tr>
        </thead>
        <tbody>
          {vpbxRows.map((row, idx) => (
            <tr key={idx}>
              {VPBX_FIELDS.map(f => (
                <td key={f}>
                  <input
                    name={f}
                    value={row[f] || ''}
                    onChange={e => handleVpbxChange(idx, e)}
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
      <button onClick={() => handleVpbxAddRow(1)}>Add Row</button>
    </div>
  );
};

export default VPBXImport;
