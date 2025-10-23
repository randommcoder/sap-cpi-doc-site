import React, { useState, useCallback, useMemo } from 'react';
import {
  Save, Download, FileText, Edit3, Plus, Trash2,
  ChevronDown, ChevronRight, LayoutDashboard, Settings,
  Network, Shield, Activity, Database, BookOpen,
  List, Key, Eye, CheckSquare, FileJson
} from 'lucide-react';
import { saveAs } from 'file-saver';

// --- TYPES ---
interface DocInfo {
  title: string;
  version: string;
  author: string;
  dateCreated: string;
  status: string;
  environment: string;
}

interface VersionEntry {
  version: string;
  date: string;
  author: string;
  description: string;
}

interface Stakeholder {
  role: string;
  name: string;
  contact: string;
}

interface EnvDetail {
  environment: string;
  url: string;
  purpose: string;
}

interface ProcessStep {
  step: number;
  type: string;
  description: string;
}

interface IFlowDetail {
  description: string;
  sender: { adapter: string; endpoint: string; auth: string };
  receiver: { adapter: string; endpoint: string; timeout: string };
  steps: ProcessStep[];
}

interface IFlow {
  id: string;
  name: string;
  type: string;
  source: string;
  target: string;
  details: IFlowDetail;
}

interface ApiProxy {
  name: string;
  basePath: string;
  target: string;
}

interface TestScenario {
  id: string;
  scenario: string;
  input: string;
  expected: string;
}

interface Credential {
  name: string;
  type: string;
  usage: string;
}

interface Metric {
  metric: string;
  threshold: string;
  alertType: string;
}

interface DocState {
  info: DocInfo;
  versions: VersionEntry[];
  executive: {
    purpose: string;
    scope: string;
    sources: string;
    targets: string;
  };
  stakeholders: Stakeholder[];
  architecture: { environments: EnvDetail[] };
  iflows: IFlow[];
  api: { proxies: ApiProxy[]; policies: string };
  deployment: { checklist: string; steps: string };
  testing: { scenarios: TestScenario[] };
  security: { credentials: Credential[] };
  monitoring: { metrics: Metric[] };
}

// --- INITIAL STATE ---
const INITIAL_STATE: DocState = {
  info: {
    title: 'SAP CPI Deployment Document',
    version: '1.0',
    author: '[Your Name]',
    dateCreated: new Date().toLocaleDateString(),
    status: 'Draft',
    environment: 'DEV'
  },
  versions: [
    {
      version: '1.0',
      date: new Date().toLocaleDateString(),
      author: 'Author',
      description: 'Initial draft'
    }
  ],
  executive: {
    purpose: 'Describe the business requirements and purpose of this integration.',
    scope: 'Define what is in scope and out of scope for this deployment.',
    sources: 'S/4HANA, Salesforce',
    targets: 'Third-party Logistics (3PL)'
  },
  stakeholders: [
    { role: 'Technical Lead', name: 'John Doe', contact: 'john@example.com' },
    { role: 'Business Owner', name: 'Jane Smith', contact: 'jane@example.com' }
  ],
  architecture: {
    environments: [
      {
        environment: 'DEV',
        url: 'https://[tenant]-tmn.hci.eu1.hana.ondemand.com',
        purpose: 'Unit Testing'
      },
      {
        environment: 'QA',
        url: 'https://[tenant]-tmn.hci.eu1.hana.ondemand.com',
        purpose: 'Integration Testing'
      },
      {
        environment: 'PROD',
        url: 'https://[tenant]-tmn.hci.eu1.hana.ondemand.com',
        purpose: 'Live Operations'
      }
    ]
  },
  iflows: [
    {
      id: 'IF_001',
      name: 'Order Synchronization',
      type: 'Async',
      source: 'S4HANA',
      target: '3PL',
      details: {
        description: 'Synchronizes sales orders from ERP to logistics provider in real-time via SOAP.',
        sender: { adapter: 'HTTPS', endpoint: '/cpi/orders', auth: 'Client Certificate' },
        receiver: {
          adapter: 'SOAP',
          endpoint: 'https://3pl.example.com/orders',
          timeout: '60000'
        },
        steps: [
          { step: 1, type: 'Content Modifier', description: 'Store original payload and set headers' },
          { step: 2, type: 'Message Mapping', description: 'Map IDoc to target 3PL XML format' },
          { step: 3, type: 'Request Reply', description: 'Call 3PL SOAP Service' }
        ]
      }
    }
  ],
  api: {
    proxies: [{ name: 'Order API', basePath: '/v1/orders', target: 'IF_001 endpoint' }],
    policies: 'Rate Limiting: 1000/min\nOAuth 2.0 verified\nSpike Arrest: 100ps'
  },
  deployment: {
    checklist: '- [ ] All iFlows tested in QA\n- [ ] Security Materials created in target\n- [ ] Connectivity verified\n- [ ] API Proxies deployed',
    steps: '1. Export package from QA tenant.\n2. Import to PROD tenant.\n3. Configure externalized parameters (URLs, credentials).\n4. Deploy all artifacts.\n5. Verify IF_001 status is "Started".'
  },
  testing: {
    scenarios: [
      {
        id: 'TC001',
        scenario: 'Happy Path Order',
        input: 'Valid Order XML (Order #12345)',
        expected: 'HTTP 200 OK, Order created in target'
      },
      {
        id: 'TC002',
        scenario: 'Invalid Data',
        input: 'Missing mandatory fields',
        expected: 'HTTP 400 Bad Request, Error logged in CPI'
      }
    ]
  },
  security: {
    credentials: [
      { name: 'S4_User', type: 'User Credentials', usage: 'Inbound Basic Auth' },
      { name: '3PL_Cert', type: 'Client Certificate', usage: 'Outbound Mutual TLS' }
    ]
  },
  monitoring: {
    metrics: [
      { metric: 'Error Rate', threshold: '> 5%', alertType: 'Critical Email to Support' },
      { metric: 'Processing Time', threshold: '> 10s', alertType: 'Warning Notification' }
    ]
  }
};

// --- OPTIMIZED SIMPLE INPUT COMPONENT WITH BUFFERED STATE ---
const SimpleInput = React.memo(
  ({
    label,
    value,
    onChange,
    multiline,
    placeholder,
    editMode
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    multiline?: boolean;
    placeholder?: string;
    editMode: boolean;
  }) => {
    const [bufferedValue, setBufferedValue] = useState(value);

    React.useEffect(() => {
      setBufferedValue(value);
    }, [value]);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setBufferedValue(e.target.value);
      },
      []
    );

    const handleBlur = useCallback(() => {
      if (bufferedValue !== value) {
        onChange(bufferedValue);
      }
    }, [bufferedValue, value, onChange]);

    return (
      <div className="mb-5">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
        </label>
        {editMode ? (
          multiline ? (
            <textarea
              placeholder={placeholder}
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-24 text-sm transition-all"
              value={bufferedValue}
              onChange={handleChange}
              onBlur={handleBlur}
            />
          ) : (
            <input
              placeholder={placeholder}
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
              value={bufferedValue}
              onChange={handleChange}
              onBlur={handleBlur}
              type="text"
            />
          )
        ) : (
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-800 whitespace-pre-wrap text-sm">
            {value || <span className="text-gray-400 italic">Not specified</span>}
          </div>
        )}
      </div>
    );
  }
);

SimpleInput.displayName = 'SimpleInput';

// --- OPTIMIZED TABLE COMPONENT ---
const RenderTable = React.memo(
  ({
    headers,
    data,
    path,
    keys,
    editMode,
    onUpdate,
    onRemove
  }: {
    headers: string[];
    data: any[];
    path: string[];
    keys: string[];
    editMode: boolean;
    onUpdate: (path: string[], value: any) => void;
    onRemove: (path: string[], index: number) => void;
  }) => {
    const handleCellChange = useCallback(
      (rowIndex: number, key: string, value: string) => {
        onUpdate([...path, rowIndex.toString(), key], value);
      },
      [path, onUpdate]
    );

    const handleRemove = useCallback(
      (rowIndex: number) => {
        onRemove(path, rowIndex);
      },
      [path, onRemove]
    );

    return (
      <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm mb-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {headers.map((h: string, i: number) => (
                <th
                  key={i}
                  className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
              {editMode && <th className="w-10 px-4 py-3"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {data.map((row: any, i: number) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                {keys.map((k: string, j: number) => (
                  <td key={j} className="px-4 py-2">
                    {editMode ? (
                      <input
                        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                        value={row[k]}
                        onChange={(e) => handleCellChange(i, k, e.target.value)}
                        type="text"
                      />
                    ) : (
                      <span className="text-sm text-gray-700">{row[k]}</span>
                    )}
                  </td>
                ))}
                {editMode && (
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => handleRemove(i)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td
                  colSpan={headers.length + (editMode ? 1 : 0)}
                  className="px-4 py-4 text-center text-sm text-gray-500 italic"
                >
                  No entries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }
);

RenderTable.displayName = 'RenderTable';

// --- SIDEBAR BUTTON COMPONENT ---
const SidebarBtn = React.memo(
  ({
    id,
    icon: Icon,
    label,
    activeTab,
    onSelect
  }: {
    id: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    activeTab: string;
    onSelect: (id: string) => void;
  }) => (
    <button
      onClick={() => onSelect(id)}
      className={`flex items-center w-full px-4 py-3 text-sm font-medium transition-colors duration-150 ${
        activeTab === id
          ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      <Icon className="w-5 h-5 mr-3 opacity-70" />
      {label}
    </button>
  )
);

SidebarBtn.displayName = 'SidebarBtn';

// --- SECTION HEADER COMPONENTS ---
const SectionHeader = React.memo(
  ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div className="mb-8 border-b border-gray-200 pb-4">
      <h2 className="text-3xl font-bold text-gray-800">{title}</h2>
      <p className="text-gray-500 mt-2 text-lg">{subtitle}</p>
    </div>
  )
);

SectionHeader.displayName = 'SectionHeader';

const SectionSubHeader = React.memo(
  ({ title }: { title: string }) => (
    <h3 className="text-lg font-bold text-gray-700 mb-4">{title}</h3>
  )
);

SectionSubHeader.displayName = 'SectionSubHeader';

const AddButton = React.memo(
  ({ onClick, label }: { onClick: () => void; label: string }) => (
    <button
      onClick={onClick}
      className="flex items-center text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 px-4 py-2 rounded-md hover:bg-blue-100"
    >
      <Plus size={16} className="mr-2" /> {label}
    </button>
  )
);

AddButton.displayName = 'AddButton';

// --- ICON COMPONENTS ---
const UploadIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" x2="12" y1="3" y2="15" />
  </svg>
);

const DownloadIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 15 12 20 17 15" />
    <line x1="12" x2="12" y1="3" y2="20" />
  </svg>
);

// --- MAIN COMPONENT ---
export default function SAPDeploymentDocFull() {
  const [activeTab, setActiveTab] = useState('info');
  const [editMode, setEditMode] = useState(true);
  const [doc, setDoc] = useState<DocState>(INITIAL_STATE);
  const [selectedIFlowId, setSelectedIFlowId] = useState<string>(
    doc.iflows[0]?.id || ''
  );

  // --- OPTIMIZED STATE UPDATERS USING structuredClone ---
  const updateField = useCallback(
    (section: keyof DocState, field: string, value: any) => {
      setDoc((prev) => {
        const newDoc = structuredClone(prev);
        (newDoc[section] as any)[field] = value;
        return newDoc;
      });
    },
    []
  );

  const updateDeepField = useCallback((path: string[], value: any) => {
    setDoc((prev) => {
      const newDoc = structuredClone(prev);
      let current: any = newDoc;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
      return newDoc;
    });
  }, []);

  const addRow = useCallback((path: string[], newItem: any) => {
    setDoc((prev) => {
      const newDoc = structuredClone(prev);
      let current: any = newDoc;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      current[path[path.length - 1]].push(newItem);
      return newDoc;
    });
  }, []);

  const removeRow = useCallback((path: string[], index: number) => {
    setDoc((prev) => {
      const newDoc = structuredClone(prev);
      let current: any = newDoc;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      current[path[path.length - 1]].splice(index, 1);
      return newDoc;
    });
  }, []);

  // --- EXPORT FUNCTION ---
  const handleExport = useCallback(() => {
    const genTable = (headers: string[], data: any[], keys: string[]) => {
      if (!data || data.length === 0)
        return '<p><em>No data available.</em></p>';
      let t =
        '<table style="width:100%;border-collapse:collapse;margin:15px 0;font-size:14px;"><thead><tr style="background-color:#f3f4f6;">';
      headers.forEach(
        (h) =>
          (t += `<th style="border:1px solid #999;padding:8px;text-align:left;">${h}</th>`)
      );
      t += '</tr></thead><tbody>';
      data.forEach((row) => {
        t += '<tr>';
        keys.forEach(
          (k) =>
            (t += `<td style="border:1px solid #999;padding:8px;vertical-align:top;">${row[k] !== undefined ? row[k] : ''}</td>`)
        );
        t += '</tr>';
      });
      t += '</tbody></table>';
      return t;
    };

    const css = `
      <style>
        body { font-family: 'Calibri', sans-serif; color: #333; line-height: 1.5; }
        h1 { color: #1a56db; font-size: 28px; border-bottom: 2px solid #1a56db; padding-bottom: 10px; }
        h2 { color: #1e40af; font-size: 22px; margin-top: 30px; background-color: #eff6ff; padding: 5px 10px; }
        h3 { color: #374151; font-size: 18px; margin-top: 25px; border-bottom: 1px solid #eee; }
        h4 { font-size: 16px; margin-top: 15px; color: #555; font-weight: bold; }
        p, li { font-size: 14px; }
        pre { background: #f9fafb; padding: 10px; border: 1px solid #e5e7eb; white-space: pre-wrap; font-family: 'Courier New', monospace; font-size: 13px; }
        .page-break { page-break-before: always; }
      </style>
    `;

    let html = `<html><head><meta charset='utf-8'>${css}</head><body>`;

    // Title Page
    html += `<div style="text-align:center;margin-top:200px;margin-bottom:200px;">
      <h1 style="font-size:36px;border:none;">${doc.info.title}</h1>
      <p style="font-size:20px;color:#666;">Version ${doc.info.version}</p>
      <p style="font-size:16px;">${doc.info.dateCreated}</p>
    </div><div class="page-break"></div>`;

    // Document Control
    html += `<h2>Document Control</h2>`;
    html += `<table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
      <tr><th style="border:1px solid #999;padding:8px;background:#f3f4f6;width:30%">Document Title</th><td style="border:1px solid #999;padding:8px;">${doc.info.title}</td></tr>
      <tr><th style="border:1px solid #999;padding:8px;background:#f3f4f6;">Version</th><td style="border:1px solid #999;padding:8px;">${doc.info.version}</td></tr>
      <tr><th style="border:1px solid #999;padding:8px;background:#f3f4f6;">Author</th><td style="border:1px solid #999;padding:8px;">${doc.info.author}</td></tr>
      <tr><th style="border:1px solid #999;padding:8px;background:#f3f4f6;">Status</th><td style="border:1px solid #999;padding:8px;">${doc.info.status}</td></tr>
      <tr><th style="border:1px solid #999;padding:8px;background:#f3f4f6;">Environment Target</th><td style="border:1px solid #999;padding:8px;">${doc.info.environment}</td></tr>
    </table>`;

    html += `<h3>Version History</h3>`;
    html += genTable(
      ['Version', 'Date', 'Author', 'Description'],
      doc.versions,
      ['version', 'date', 'author', 'description']
    );

    // Executive Summary
    html += `<h2>1. Executive Summary</h2>`;
    html += `<h3>1.1 Purpose</h3><p>${doc.executive.purpose}</p>`;
    html += `<h3>1.2 Scope</h3><p>${doc.executive.scope}</p>`;
    html += `<h3>1.3 Integration Landscape</h3><ul><li><strong>Source Systems:</strong> ${doc.executive.sources}</li><li><strong>Target Systems:</strong> ${doc.executive.targets}</li></ul>`;
    html += `<h3>1.4 Key Stakeholders</h3>`;
    html += genTable(
      ['Role', 'Name', 'Contact'],
      doc.stakeholders,
      ['role', 'name', 'contact']
    );

    // Architecture
    html += `<h2>2. Technical Architecture</h2>`;
    html += `<h3>2.1 Environment Details</h3>`;
    html += genTable(
      ['Environment', 'Tenant URL', 'Purpose'],
      doc.architecture.environments,
      ['environment', 'url', 'purpose']
    );

    // iFlows Overview
    html += `<h2>3. Integration Flows Overview</h2>`;
    html += genTable(
      ['ID', 'Name', 'Type', 'Source', 'Target'],
      doc.iflows,
      ['id', 'name', 'type', 'source', 'target']
    );

    // Detailed Specs
    html += `<div class="page-break"></div><h2>4. Detailed Specifications</h2>`;
    doc.iflows.forEach((f, index) => {
      html += `<h3>4.${index + 1} ${f.id} - ${f.name}</h3>`;
      html += `<p><strong>Description:</strong> ${f.details.description}</p>`;

      html += `<h4>Sender Configuration</h4>`;
      html += `<table style="width:100%;border-collapse:collapse;margin-bottom:10px;">
        <tr><th style="border:1px solid #999;padding:6px;background:#f3f4f6;">Adapter Type</th><td style="border:1px solid #999;padding:6px;">${f.details.sender.adapter}</td></tr>
        <tr><th style="border:1px solid #999;padding:6px;background:#f3f4f6;">Endpoint URL</th><td style="border:1px solid #999;padding:6px;">${f.details.sender.endpoint}</td></tr>
        <tr><th style="border:1px solid #999;padding:6px;background:#f3f4f6;">Authentication</th><td style="border:1px solid #999;padding:6px;">${f.details.sender.auth}</td></tr>
      </table>`;

      html += `<h4>Receiver Configuration</h4>`;
      html += `<table style="width:100%;border-collapse:collapse;margin-bottom:10px;">
        <tr><th style="border:1px solid #999;padding:6px;background:#f3f4f6;">Adapter Type</th><td style="border:1px solid #999;padding:6px;">${f.details.receiver.adapter}</td></tr>
        <tr><th style="border:1px solid #999;padding:6px;background:#f3f4f6;">Target Endpoint</th><td style="border:1px solid #999;padding:6px;">${f.details.receiver.endpoint}</td></tr>
        <tr><th style="border:1px solid #999;padding:6px;background:#f3f4f6;">Timeout/Config</th><td style="border:1px solid #999;padding:6px;">${f.details.receiver.timeout}</td></tr>
      </table>`;

      html += `<h4>Process Flow Steps</h4>`;
      html += genTable(
        ['Step #', 'Type', 'Description'],
        f.details.steps,
        ['step', 'type', 'description']
      );
      html += `<hr style="margin: 20px 0; border-color: #eee;">`;
    });

    // API Management
    html += `<h2>5. API Management Configuration</h2>`;
    html += `<h3>5.1 API Proxies</h3>`;
    html += genTable(
      ['API Proxy Name', 'Base Path', 'Target Endpoint'],
      doc.api.proxies,
      ['name', 'basePath', 'target']
    );
    html += `<h3>5.2 API Policies</h3><pre>${doc.api.policies}</pre>`;

    // Deployment
    html += `<h2>6. Deployment Procedures</h2>`;
    html += `<h3>6.1 Pre-Deployment Checklist</h3><pre>${doc.deployment.checklist}</pre>`;
    html += `<h3>6.2 Deployment Steps</h3><pre>${doc.deployment.steps}</pre>`;

    // Testing
    html += `<h2>7. Testing Strategy</h2>`;
    html += genTable(
      ['Test ID', 'Scenario', 'Input Data', 'Expected Output'],
      doc.testing.scenarios,
      ['id', 'scenario', 'input', 'expected']
    );

    // Security
    html += `<h2>8. Security Configuration</h2>`;
    html += genTable(
      ['Credential Name', 'Type', 'Usage'],
      doc.security.credentials,
      ['name', 'type', 'usage']
    );

    // Monitoring
    html += `<h2>9. Monitoring & Operations</h2>`;
    html += genTable(
      ['Metric', 'Threshold', 'Alert Action'],
      doc.monitoring.metrics,
      ['metric', 'threshold', 'alertType']
    );

    html += `</body></html>`;

    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    saveAs(
      blob,
      `SAP_CPI_Deployment_${doc.info.title.replace(/\s+/g, '_')}.doc`
    );
  }, [doc]);

  const currentIFlow = useMemo(
    () => doc.iflows.find((f) => f.id === selectedIFlowId) || doc.iflows[0],
    [doc.iflows, selectedIFlowId]
  );

  return (
    <div className="h-screen bg-gray-100 flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center shadow-sm z-10 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-tr from-blue-600 to-blue-500 p-2 rounded-lg text-white shadow-sm">
            <FileText size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800 leading-none">
              SAP CPI Deployment Manager
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              {doc.info.title} v{doc.info.version}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-gray-100 p-1 rounded-lg flex">
            <button
              onClick={() => setEditMode(true)}
              className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                editMode
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Edit3 size={16} className="mr-2" /> Edit
            </button>
            <button
              onClick={() => setEditMode(false)}
              className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                !editMode
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BookOpen size={16} className="mr-2" /> Preview
            </button>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow transition-all active:scale-95"
          >
            <Download size={18} className="mr-2" /> Export to Word
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <nav className="w-72 bg-white border-r border-gray-200 overflow-y-auto py-6 hidden md:block flex-shrink-0">
          <div className="px-6 mb-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
            Table of Contents
          </div>
          <SidebarBtn
            id="info"
            icon={Settings}
            label="Document Info"
            activeTab={activeTab}
            onSelect={setActiveTab}
          />
          <SidebarBtn
            id="exec"
            icon={LayoutDashboard}
            label="1. Executive Summary"
            activeTab={activeTab}
            onSelect={setActiveTab}
          />
          <SidebarBtn
            id="arch"
            icon={Network}
            label="2. Architecture"
            activeTab={activeTab}
            onSelect={setActiveTab}
          />
          <SidebarBtn
            id="iflows"
            icon={Activity}
            label="3. iFlows Overview"
            activeTab={activeTab}
            onSelect={setActiveTab}
          />
          <SidebarBtn
            id="specs"
            icon={List}
            label="4. Detailed Specs"
            activeTab={activeTab}
            onSelect={setActiveTab}
          />
          <SidebarBtn
            id="api"
            icon={Database}
            label="5. API Management"
            activeTab={activeTab}
            onSelect={setActiveTab}
          />
          <SidebarBtn
            id="deploy"
            icon={Download}
            label="6. Deployment"
            activeTab={activeTab}
            onSelect={setActiveTab}
          />
          <SidebarBtn
            id="test"
            icon={CheckSquare}
            label="7. Testing Strategy"
            activeTab={activeTab}
            onSelect={setActiveTab}
          />
          <SidebarBtn
            id="sec"
            icon={Shield}
            label="8. Security"
            activeTab={activeTab}
            onSelect={setActiveTab}
          />
          <SidebarBtn
            id="mon"
            icon={Eye}
            label="9. Monitoring"
            activeTab={activeTab}
            onSelect={setActiveTab}
          />
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6 md:p-8">
          <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-8 md:p-10 min-h-full">
            {activeTab === 'info' && (
              <div>
                <SectionHeader
                  title="Document Information"
                  subtitle="Metadata and version control."
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                  {Object.keys(doc.info).map((k) => (
                    <SimpleInput
                      key={k}
                      label={k
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/^./, (str) => str.toUpperCase())}
                      value={(doc.info as any)[k]}
                      onChange={(v: string) => updateField('info', k, v)}
                      editMode={editMode}
                    />
                  ))}
                </div>
                <SectionSubHeader title="Version History" />
                <RenderTable
                  path={['versions']}
                  data={doc.versions}
                  headers={['Version', 'Date', 'Author', 'Description']}
                  keys={['version', 'date', 'author', 'description']}
                  editMode={editMode}
                  onUpdate={updateDeepField}
                  onRemove={removeRow}
                />
                {editMode && (
                  <AddButton
                    onClick={() =>
                      addRow(['versions'], {
                        version: '',
                        date: new Date().toLocaleDateString(),
                        author: '',
                        description: ''
                      })
                    }
                    label="Add Version"
                  />
                )}
              </div>
            )}

            {activeTab === 'exec' && (
              <div>
                <SectionHeader
                  title="1. Executive Summary"
                  subtitle="High-level project overview."
                />
                <SimpleInput
                  multiline
                  label="1.1 Purpose"
                  value={doc.executive.purpose}
                  onChange={(v: string) => updateField('executive', 'purpose', v)}
                  placeholder="Why is this integration needed?"
                  editMode={editMode}
                />
                <SimpleInput
                  multiline
                  label="1.2 Scope"
                  value={doc.executive.scope}
                  onChange={(v: string) => updateField('executive', 'scope', v)}
                  placeholder="What is included/excluded?"
                  editMode={editMode}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <SimpleInput
                    multiline
                    label="1.3 Source Systems"
                    value={doc.executive.sources}
                    onChange={(v: string) => updateField('executive', 'sources', v)}
                    editMode={editMode}
                  />
                  <SimpleInput
                    multiline
                    label="Target Systems"
                    value={doc.executive.targets}
                    onChange={(v: string) => updateField('executive', 'targets', v)}
                    editMode={editMode}
                  />
                </div>
                <div className="mt-10">
                  <SectionSubHeader title="1.4 Key Stakeholders" />
                  <RenderTable
                    path={['stakeholders']}
                    data={doc.stakeholders}
                    headers={['Role', 'Name', 'Contact Info']}
                    keys={['role', 'name', 'contact']}
                    editMode={editMode}
                    onUpdate={updateDeepField}
                    onRemove={removeRow}
                  />
                  {editMode && (
                    <AddButton
                      onClick={() =>
                        addRow(['stakeholders'], {
                          role: '',
                          name: '',
                          contact: ''
                        })
                      }
                      label="Add Stakeholder"
                    />
                  )}
                </div>
              </div>
            )}

            {activeTab === 'arch' && (
              <div>
                <SectionHeader
                  title="2. Technical Architecture"
                  subtitle="Landscape and environment setup."
                />
                <SectionSubHeader title="2.1 Environment Details" />
                <RenderTable
                  path={['architecture', 'environments']}
                  data={doc.architecture.environments}
                  headers={['Environment', 'Tenant URL', 'Purpose']}
                  keys={['environment', 'url', 'purpose']}
                  editMode={editMode}
                  onUpdate={updateDeepField}
                  onRemove={removeRow}
                />
                {editMode && (
                  <AddButton
                    onClick={() =>
                      addRow(['architecture', 'environments'], {
                        environment: '',
                        url: '',
                        purpose: ''
                      })
                    }
                    label="Add Environment"
                  />
                )}

                <div className="mt-10 p-6 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 text-center">
                  <Network className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    Architecture Diagram
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Paste your diagram into the exported Word document.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'iflows' && (
              <div>
                <SectionHeader
                  title="3. Integration Flows Overview"
                  subtitle="Inventory of all integration artifacts."
                />
                <RenderTable
                  path={['iflows']}
                  data={doc.iflows}
                  headers={['ID', 'Name', 'Type', 'Source', 'Target']}
                  keys={['id', 'name', 'type', 'source', 'target']}
                  editMode={editMode}
                  onUpdate={updateDeepField}
                  onRemove={removeRow}
                />
                {editMode && (
                  <button
                    onClick={() =>
                      addRow(['iflows'], {
                        id: 'IF_NEW',
                        name: 'New Flow',
                        type: 'Async',
                        source: '',
                        target: '',
                        details: {
                          description: '',
                          sender: { adapter: '', endpoint: '', auth: '' },
                          receiver: { adapter: '', endpoint: '', timeout: '' },
                          steps: []
                        }
                      })
                    }
                    className="w-full py-3 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 font-medium hover:bg-blue-50 transition flex items-center justify-center"
                  >
                    <Plus size={18} className="mr-2" /> Add New Integration Flow
                  </button>
                )}
              </div>
            )}

            {activeTab === 'specs' && (
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 pb-4 border-b border-gray-200">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      4. Detailed Specifications
                    </h2>
                    <p className="text-gray-500 mt-1">
                      Deep dive into each integration flow.
                    </p>
                  </div>
                  <div className="mt-4 sm:mt-0">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Select iFlow to Edit
                    </label>
                    <select
                      className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      value={selectedIFlowId}
                      onChange={(e) => setSelectedIFlowId(e.target.value)}
                    >
                      {doc.iflows.length > 0 ? (
                        doc.iflows.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.id} - {f.name}
                          </option>
                        ))
                      ) : (
                        <option>No iFlows available</option>
                      )}
                    </select>
                  </div>
                </div>

                {currentIFlow ? (
                  <div className="space-y-10">
                    <div>
                      <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center">
                        <FileJson className="mr-2 w-5 h-5" /> {currentIFlow.id} -{' '}
                        {currentIFlow.name}
                      </h3>
                      <SimpleInput
                        multiline
                        label="Functional Description"
                        value={currentIFlow.details.description}
                        onChange={(v: string) => {
                          const idx = doc.iflows.findIndex(
                            (f) => f.id === currentIFlow.id
                          );
                          updateDeepField(
                            ['iflows', idx.toString(), 'details', 'description'],
                            v
                          );
                        }}
                        placeholder="Describe what this flow does..."
                        editMode={editMode}
                      />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                        <h4 className="font-bold text-blue-900 mb-4 flex items-center">
                          <UploadIcon className="mr-2" /> Sender Configuration
                        </h4>
                        {['adapter', 'endpoint', 'auth'].map((field) => (
                          <SimpleInput
                            key={field}
                            label={
                              field === 'auth'
                                ? 'Authentication'
                                : field.charAt(0).toUpperCase() + field.slice(1)
                            }
                            value={(currentIFlow.details.sender as any)[field]}
                            onChange={(v: string) => {
                              const idx = doc.iflows.findIndex(
                                (f) => f.id === currentIFlow.id
                              );
                              updateDeepField(
                                [
                                  'iflows',
                                  idx.toString(),
                                  'details',
                                  'sender',
                                  field
                                ],
                                v
                              );
                            }}
                            editMode={editMode}
                          />
                        ))}
                      </div>
                      <div className="bg-green-50 p-6 rounded-xl border border-green-100">
                        <h4 className="font-bold text-green-900 mb-4 flex items-center">
                          <DownloadIcon className="mr-2" /> Receiver Configuration
                        </h4>
                        {['adapter', 'endpoint', 'timeout'].map((field) => (
                          <SimpleInput
                            key={field}
                            label={
                              field === 'timeout'
                                ? 'Timeout/Config'
                                : field === 'endpoint'
                                  ? 'Target Endpoint'
                                  : field.charAt(0).toUpperCase() + field.slice(1)
                            }
                            value={(currentIFlow.details.receiver as any)[field]}
                            onChange={(v: string) => {
                              const idx = doc.iflows.findIndex(
                                (f) => f.id === currentIFlow.id
                              );
                              updateDeepField(
                                [
                                  'iflows',
                                  idx.toString(),
                                  'details',
                                  'receiver',
                                  field
                                ],
                                v
                              );
                            }}
                            editMode={editMode}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <SectionSubHeader title="Process Flow Steps" />
                      <RenderTable
                        path={[
                          'iflows',
                          doc.iflows
                            .findIndex((f) => f.id === currentIFlow.id)
                            .toString(),
                          'details',
                          'steps'
                        ]}
                        data={currentIFlow.details.steps}
                        headers={['Step #', 'Step Type', 'Description']}
                        keys={['step', 'type', 'description']}
                        editMode={editMode}
                        onUpdate={updateDeepField}
                        onRemove={removeRow}
                      />
                      {editMode && (
                        <AddButton
                          onClick={() =>
                            addRow(
                              [
                                'iflows',
                                doc.iflows
                                  .findIndex((f) => f.id === currentIFlow.id)
                                  .toString(),
                                'details',
                                'steps'
                              ],
                              {
                                step: currentIFlow.details.steps.length + 1,
                                type: '',
                                description: ''
                              }
                            )
                          }
                          label="Add Process Step"
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed">
                    Please add an Integration Flow in Section 3 first.
                  </div>
                )}
              </div>
            )}

            {activeTab === 'api' && (
              <div>
                <SectionHeader
                  title="5. API Management"
                  subtitle="API Gateway configurations."
                />
                <SectionSubHeader title="5.1 API Proxies" />
                <RenderTable
                  path={['api', 'proxies']}
                  data={doc.api.proxies}
                  headers={['API Proxy Name', 'Base Path', 'Target Endpoint']}
                  keys={['name', 'basePath', 'target']}
                  editMode={editMode}
                  onUpdate={updateDeepField}
                  onRemove={removeRow}
                />
                {editMode && (
                  <div className="mb-8">
                    <AddButton
                      onClick={() =>
                        addRow(['api', 'proxies'], {
                          name: '',
                          basePath: '',
                          target: ''
                        })
                      }
                      label="Add API Proxy"
                    />
                  </div>
                )}
                <SectionSubHeader title="5.2 Applied Policies" />
                <SimpleInput
                  multiline
                  label=""
                  value={doc.api.policies}
                  onChange={(v: string) => updateField('api', 'policies', v)}
                  placeholder="List policies like Rate Limiting, OAuth, etc."
                  editMode={editMode}
                />
              </div>
            )}

            {activeTab === 'deploy' && (
              <div>
                <SectionHeader
                  title="6. Deployment Procedures"
                  subtitle="Steps for successful promotion."
                />
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <SectionSubHeader title="6.1 Pre-Deployment Checklist" />
                    <SimpleInput
                      multiline
                      label=""
                      value={doc.deployment.checklist}
                      onChange={(v: string) =>
                        updateField('deployment', 'checklist', v)
                      }
                      placeholder="- [ ] Item 1..."
                      editMode={editMode}
                    />
                  </div>
                  <div>
                    <SectionSubHeader title="6.2 Deployment Steps" />
                    <SimpleInput
                      multiline
                      label=""
                      value={doc.deployment.steps}
                      onChange={(v: string) => updateField('deployment', 'steps', v)}
                      placeholder="1. Step one..."
                      editMode={editMode}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'test' && (
              <div>
                <SectionHeader
                  title="7. Testing Strategy"
                  subtitle="Validation scenarios."
                />
                <RenderTable
                  path={['testing', 'scenarios']}
                  data={doc.testing.scenarios}
                  headers={['Test ID', 'Scenario Description', 'Input Data', 'Expected Output']}
                  keys={['id', 'scenario', 'input', 'expected']}
                  editMode={editMode}
                  onUpdate={updateDeepField}
                  onRemove={removeRow}
                />
                {editMode && (
                  <AddButton
                    onClick={() =>
                      addRow(['testing', 'scenarios'], {
                        id:
                          'TC' +
                          (doc.testing.scenarios.length + 1)
                            .toString()
                            .padStart(3, '0'),
                        scenario: '',
                        input: '',
                        expected: ''
                      })
                    }
                    label="Add Test Case"
                  />
                )}
              </div>
            )}

            {activeTab === 'sec' && (
              <div>
                <SectionHeader
                  title="8. Security Configuration"
                  subtitle="Credentials and access control."
                />
                <RenderTable
                  path={['security', 'credentials']}
                  data={doc.security.credentials}
                  headers={['Credential Name', 'Type', 'Usage']}
                  keys={['name', 'type', 'usage']}
                  editMode={editMode}
                  onUpdate={updateDeepField}
                  onRemove={removeRow}
                />
                {editMode && (
                  <AddButton
                    onClick={() =>
                      addRow(['security', 'credentials'], {
                        name: '',
                        type: 'User Credentials',
                        usage: ''
                      })
                    }
                    label="Add Credential"
                  />
                )}
              </div>
            )}

            {activeTab === 'mon' && (
              <div>
                <SectionHeader
                  title="9. Monitoring & Operations"
                  subtitle="KPIs and alerting rules."
                />
                <RenderTable
                  path={['monitoring', 'metrics']}
                  data={doc.monitoring.metrics}
                  headers={['Metric Name', 'Threshold', 'Alert Action']}
                  keys={['metric', 'threshold', 'alertType']}
                  editMode={editMode}
                  onUpdate={updateDeepField}
                  onRemove={removeRow}
                />
                {editMode && (
                  <AddButton
                    onClick={() =>
                      addRow(['monitoring', 'metrics'], {
                        metric: '',
                        threshold: '',
                        alertType: ''
                      })
                    }
                    label="Add Metric"
                  />
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
