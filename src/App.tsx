import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Save, Download, FileText, Edit3, Plus, Trash2,
  ChevronDown, ChevronRight, LayoutDashboard, Settings,
  Network, Shield, Activity, Database, BookOpen,
  List, Key, Eye, CheckSquare, FileJson,
  Server, Users, Layers, ArrowRightCircle, Globe, Lock
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
    author: '',
    dateCreated: new Date().toLocaleDateString(),
    status: 'Draft',
    environment: 'DEV'
  },
  versions: [
    {
      version: '1.0',
      date: new Date().toLocaleDateString(),
      author: '',
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
      {
        name: 'S4_User',
        type: 'User Credentials',
        usage: 'Inbound Basic Auth'
      },
      {
        name: '3PL_Cert',
        type: 'Client Certificate',
        usage: 'Outbound Mutual TLS'
      }
    ]
  },
  monitoring: {
    metrics: [
      { metric: 'Error Rate', threshold: '> 5%', alertType: 'Critical Email to Support' },
      { metric: 'Processing Time', threshold: '> 10s', alertType: 'Warning Notification' }
    ]
  }
};

// --- UI COMPONENTS ---

const SimpleInput = React.memo(
  ({
    label,
    value,
    onChange,
    multiline,
    placeholder,
    editMode,
    className = ''
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    multiline?: boolean;
    placeholder?: string;
    editMode: boolean;
    className?: string;
  }) => {
    const [bufferedValue, setBufferedValue] = useState(value);

    useEffect(() => {
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
      <div className={`group ${className}`}>
        {label && (
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            {label}
          </label>
        )}
        {editMode ? (
          multiline ? (
            <textarea
              placeholder={placeholder}
              className="w-full p-3 bg-white border border-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-h-[100px] text-sm text-slate-700 placeholder:text-slate-400 transition-all resize-y outline-none"
              value={bufferedValue}
              onChange={handleChange}
              onBlur={handleBlur}
            />
          ) : (
            <input
              placeholder={placeholder}
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm text-slate-700 placeholder:text-slate-400 transition-all outline-none"
              value={bufferedValue}
              onChange={handleChange}
              onBlur={handleBlur}
              type="text"
            />
          )
        ) : (
          <div className="px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-100 text-slate-800 whitespace-pre-wrap text-sm min-h-[42px] flex items-center">
            {value || <span className="text-slate-400 italic">Not specified</span>}
          </div>
        )}
      </div>
    );
  }
);
SimpleInput.displayName = 'SimpleInput';

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

    return (
      <div className="overflow-hidden border border-slate-200 rounded-xl shadow-sm bg-white mb-4">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead>
              <tr className="bg-slate-50/80">
                {headers.map((h, i) => (
                  <th
                    key={i}
                    className="px-4 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
                {editMode && <th className="px-4 py-3 w-12"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  {keys.map((k, j) => (
                    <td key={j} className="px-4 py-2.5 align-top">
                      {editMode ? (
                        <input
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                          value={row[k] || ''}
                          onChange={(e) => handleCellChange(i, k, e.target.value)}
                          type="text"
                        />
                      ) : (
                        <span className="text-sm text-slate-700">{row[k]}</span>
                      )}
                    </td>
                  ))}
                  {editMode && (
                    <td className="px-2 py-2.5 text-center align-middle whitespace-nowrap">
                      <button
                        onClick={() => onRemove(path, i)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                        title="Remove row"
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
                    className="px-6 py-8 text-center text-sm text-slate-500 italic bg-slate-50/30"
                  >
                    No entries found. Add one below.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
);
RenderTable.displayName = 'RenderTable';

const SidebarBtn = React.memo(
  ({
    id,
    icon: Icon,
    label,
    activeTab,
    onSelect
  }: {
    id: string;
    icon: React.ComponentType<{ className?: string; size?: number }>;
    label: string;
    activeTab: string;
    onSelect: (id: string) => void;
  }) => {
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => onSelect(id)}
        className={`group flex items-center w-full mx-2 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out mb-1 ${
          isActive
            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <Icon
          size={18}
          className={`mr-3 transition-opacity ${
            isActive ? 'text-white opacity-100' : 'text-slate-400 group-hover:text-slate-600 opacity-80'
          }`}
        />
        {label}
        {isActive && <ChevronRight size={16} className="ml-auto opacity-60" />}
      </button>
    );
  }
);
SidebarBtn.displayName = 'SidebarBtn';

const SectionHeader = React.memo(
  ({ title, subtitle, icon: Icon }: { title: string; subtitle: string; icon?: React.ComponentType<any> }) => (
    <div className="mb-8 pb-5 border-b border-slate-200">
      <div className="flex items-center space-x-3 mb-2">
        {Icon && (
          <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
            <Icon size={24} />
          </div>
        )}
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{title}</h2>
      </div>
      <p className="text-slate-500 text-base ml-1">{subtitle}</p>
    </div>
  )
);
SectionHeader.displayName = 'SectionHeader';

const SectionSubHeader = React.memo(({ title }: { title: string }) => (
  <h3 className="text-base font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center">
    <span className="bg-blue-600 w-1 h-4 mr-3 rounded-full"></span>
    {title}
  </h3>
));
SectionSubHeader.displayName = 'SectionSubHeader';

const AddButton = React.memo(({ onClick, label }: { onClick: () => void; label: string }) => (
  <button
    onClick={onClick}
    className="inline-flex items-center text-sm font-semibold text-blue-600 bg-blue-50/50 px-4 py-2.5 rounded-lg hover:bg-blue-100/80 hover:text-blue-700 transition-all active:scale-95 border border-blue-100"
  >
    <Plus size={16} className="mr-2" /> {label}
  </button>
));
AddButton.displayName = 'AddButton';

// --- MAIN COMPONENT ---
function App() {
  const [activeTab, setActiveTab] = useState('info');
  const [editMode, setEditMode] = useState(true);
  const [doc, setDoc] = useState<DocState>(INITIAL_STATE);
  const [selectedIFlowId, setSelectedIFlowId] = useState<string>(doc.iflows[0]?.id || '');

  // Ensure selected iFlow is valid when iflows change
  useEffect(() => {
    if (doc.iflows.length > 0 && !doc.iflows.find((f) => f.id === selectedIFlowId)) {
      setSelectedIFlowId(doc.iflows[0].id);
    }
  }, [doc.iflows, selectedIFlowId]);

  const currentIFlow = useMemo(
    () => doc.iflows.find((f) => f.id === selectedIFlowId) || doc.iflows[0],
    [doc.iflows, selectedIFlowId]
  );

  // State updaters using structuredClone for deep copies
  const updateField = useCallback((section: keyof DocState, field: string, value: any) => {
    setDoc((prev) => {
      const newDoc = structuredClone(prev);
      (newDoc[section] as any)[field] = value;
      return newDoc;
    });
  }, []);

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

  // Export functionality
  const handleExport = useCallback(() => {
    // Helper to generate HTML table
    const genTable = (headers: string[], data: any[], keys: string[]) => {
      if (!data || data.length === 0) return '<p><em>No data available.</em></p>';
      let t =
        '<table style="width:100%;border-collapse:collapse;margin:15px 0;font-size:14px;border:1px solid #e5e7eb;"><thead><tr style="background-color:#f9fafb;">';
      headers.forEach(
        (h) =>
          (t += `<th style="border:1px solid #e5e7eb;padding:10px 12px;text-align:left;font-weight:bold;color:#374151;">${h}</th>`)
      );
      t += '</tr></thead><tbody>';
      data.forEach((row) => {
        t += '<tr>';
        keys.forEach(
          (k) =>
            (t += `<td style="border:1px solid #e5e7eb;padding:10px 12px;vertical-align:top;color:#1f2937;">${
              row[k] !== undefined ? row[k] : ''
            }</td>`)
        );
        t += '</tr>';
      });
      t += '</tbody></table>';
      return t;
    };

    const css = `
      <style>
        body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937; line-height: 1.6; }
        h1 { color: #1e40af; font-size: 32px; margin-bottom: 10px; }
        h2 { color: #1e3a8a; font-size: 24px; margin-top: 35px; padding-bottom: 10px; border-bottom: 2px solid #e5e7eb; }
        h3 { color: #374151; font-size: 18px; margin-top: 25px; font-weight: 700; }
        h4 { font-size: 16px; margin-top: 15px; color: #4b5563; font-weight: 600; }
        p, li { font-size: 15px; }
        .meta-table th { text-align: left; background: #f9fafb; padding: 8px; color: #6b7280; font-weight: 600; width: 30%; border: 1px solid #e5e7eb; }
        .meta-table td { padding: 8px; border: 1px solid #e5e7eb; }
        .page-break { page-break-before: always; }
        .cover-page { display: flex; flex-direction: column; justify-content: center; align-items: center; height: 90vh; text-align: center; }
      </style>
    `;

    let html = `<html><head><meta charset='utf-8'>${css}</head><body>`;

    // Title Page
    html += `<div class="cover-page">
      <h1 style="font-size:42px;color:#1e40af;margin-bottom:20px;">${doc.info.title}</h1>
      <p style="font-size:24px;color:#6b7280;margin:0;">Version ${doc.info.version}</p>
      <p style="font-size:18px;color:#9ca3af;margin-top:10px;">${doc.info.dateCreated}</p>
      <div style="margin-top: 50px; border-top: 1px solid #e5e7eb; width: 200px;"></div>
    </div><div class="page-break"></div>`;

    // Document Control
    html += `<h2>Document Information</h2>`;
    html += `<table class="meta-table" style="width:100%;border-collapse:collapse;margin-bottom:30px;">
      <tr><th>Document Title</th><td>${doc.info.title}</td></tr>
      <tr><th>Version</th><td>${doc.info.version}</td></tr>
      <tr><th>Author</th><td>${doc.info.author}</td></tr>
      <tr><th>Status</th><td>${doc.info.status}</td></tr>
      <tr><th>Target Environment</th><td>${doc.info.environment}</td></tr>
    </table>`;

    html += `<h3>Version History</h3>`;
    html += genTable(
      ['Version', 'Date', 'Author', 'Description'],
      doc.versions,
      ['version', 'date', 'author', 'description']
    );
    html += `<div class="page-break"></div>`;

    // Executive Summary
    html += `<h2>1. Executive Summary</h2><h3>1.1 Purpose</h3><p>${doc.executive.purpose}</p><h3>1.2 Scope</h3><p>${doc.executive.scope}</p><h3>1.3 Landscape</h3><ul><li><strong>Sources:</strong> ${doc.executive.sources}</li><li><strong>Targets:</strong> ${doc.executive.targets}</li></ul><h3>1.4 Stakeholders</h3>${genTable(['Role', 'Name', 'Contact'], doc.stakeholders, ['role', 'name', 'contact'])}`;

    html += `<h2>2. Architecture</h2><h3>2.1 Environments</h3>${genTable(['Environment', 'URL', 'Purpose'], doc.architecture.environments, ['environment', 'url', 'purpose'])}`;

    html += `<h2>3. Integration Flows</h2>${genTable(['ID', 'Name', 'Type', 'Source', 'Target'], doc.iflows, ['id', 'name', 'type', 'source', 'target'])}`;

    html += `<div class="page-break"></div><h2>4. Detailed Specifications</h2>`;
    doc.iflows.forEach((f, i) => {
      html += `<h3>4.${i + 1} ${f.id} - ${f.name}</h3><p><strong>Description:</strong> ${f.details.description}</p>`;
      html += `<h4>Sender</h4><table class="meta-table" style="width:100%;border-collapse:collapse;"><tr><th>Adapter</th><td>${f.details.sender.adapter}</td></tr><tr><th>Endpoint</th><td>${f.details.sender.endpoint}</td></tr><tr><th>Auth</th><td>${f.details.sender.auth}</td></tr></table>`;
      html += `<h4>Receiver</h4><table class="meta-table" style="width:100%;border-collapse:collapse;"><tr><th>Adapter</th><td>${f.details.receiver.adapter}</td></tr><tr><th>Endpoint</th><td>${f.details.receiver.endpoint}</td></tr><tr><th>Config</th><td>${f.details.receiver.timeout}</td></tr></table>`;
      html += `<h4>Process Steps</h4>${genTable(['#', 'Type', 'Description'], f.details.steps, ['step', 'type', 'description'])}<hr style="margin:20px 0;border:0;border-top:1px solid #eee;">`;
    });

    html += `<h2>5. API Management</h2><h3>5.1 Proxies</h3>${genTable(['Name', 'Base Path', 'Target'], doc.api.proxies, ['name', 'basePath', 'target'])}<h3>5.2 Policies</h3><pre style="background:#f9fafb;padding:15px;border-radius:8px;">${doc.api.policies}</pre>`;

    html += `<h2>6. Deployment</h2><h3>6.1 Checklist</h3><pre style="background:#f9fafb;padding:15px;border-radius:8px;">${doc.deployment.checklist}</pre><h3>6.2 Steps</h3><pre style="background:#f9fafb;padding:15px;border-radius:8px;">${doc.deployment.steps}</pre>`;

    html += `<div class="page-break"></div><h2>7. Testing</h2>${genTable(['ID', 'Scenario', 'Input', 'Expected'], doc.testing.scenarios, ['id', 'scenario', 'input', 'expected'])}`;
    html += `<h2>8. Security</h2>${genTable(['Name', 'Type', 'Usage'], doc.security.credentials, ['name', 'type', 'usage'])}`;
    html += `<h2>9. Monitoring</h2>${genTable(['Metric', 'Threshold', 'Alert'], doc.monitoring.metrics, ['metric', 'threshold', 'alertType'])}`;

    html += `</body></html>`;
    saveAs(
      new Blob(['\ufeff', html], { type: 'application/msword' }),
      `SAP_CPI_Doc_${doc.info.title.replace(/\s+/g, '_')}.doc`
    );
  }, [doc]);

  return (
    <div className="h-screen bg-slate-100 flex flex-col font-sans text-slate-900 overflow-hidden">
      {/* --- TOP NAVIGATION --- */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center shadow-sm z-20 flex-shrink-0 relative">
        <div className="flex items-center space-x-4">
          <div className="bg-gradient-to-br from-blue-700 to-blue-500 p-2.5 rounded-xl text-white shadow-sm">
            <Layers size={24} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-tight">SAP Integration Architect</h1>
            <div className="flex items-center text-xs font-medium text-slate-500 mt-0.5">
              <span className="bg-slate-100 px-2 py-0.5 rounded-md mr-2">{doc.info.version}</span>
              <span>{doc.info.title}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="bg-slate-100/80 p-1 rounded-lg flex border border-slate-200">
            <button
              onClick={() => setEditMode(true)}
              className={`flex items-center px-4 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 ${
                editMode
                  ? 'bg-white text-blue-700 shadow-sm ring-1 ring-black/5'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Edit3 size={16} className="mr-2" /> Editor
            </button>
            <button
              onClick={() => setEditMode(false)}
              className={`flex items-center px-4 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 ${
                !editMode
                  ? 'bg-white text-blue-700 shadow-sm ring-1 ring-black/5'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <BookOpen size={16} className="mr-2" /> Preview
            </button>
          </div>

          <div className="h-6 w-px bg-slate-300 mx-2"></div>

          <button
            onClick={handleExport}
            className="flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md shadow-blue-600/20 transition-all active:scale-[0.98]"
          >
            <Download size={18} className="mr-2" /> Export DOCX
          </button>
        </div>
      </header>

      {/* --- MAIN LAYOUT --- */}
      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <nav className="w-72 bg-slate-50/50 border-r border-slate-200 overflow-y-auto py-6 flex-shrink-0">
          <div className="px-6 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">General</div>
          <div className="px-2 mb-8">
            <SidebarBtn id="info" icon={Settings} label="Document Info" activeTab={activeTab} onSelect={setActiveTab} />
            <SidebarBtn id="exec" icon={LayoutDashboard} label="Executive Summary" activeTab={activeTab} onSelect={setActiveTab} />
          </div>

          <div className="px-6 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Technical Specs</div>
          <div className="px-2 mb-8">
            <SidebarBtn id="arch" icon={Network} label="Architecture" activeTab={activeTab} onSelect={setActiveTab} />
            <SidebarBtn id="iflows" icon={Activity} label="iFlows Overview" activeTab={activeTab} onSelect={setActiveTab} />
            <SidebarBtn id="specs" icon={List} label="Detailed Specs" activeTab={activeTab} onSelect={setActiveTab} />
            <SidebarBtn id="api" icon={Database} label="API Management" activeTab={activeTab} onSelect={setActiveTab} />
          </div>

          <div className="px-6 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Operations</div>
          <div className="px-2 mb-8">
            <SidebarBtn id="deploy" icon={Server} label="Deployment" activeTab={activeTab} onSelect={setActiveTab} />
            <SidebarBtn id="test" icon={CheckSquare} label="Testing" activeTab={activeTab} onSelect={setActiveTab} />
            <SidebarBtn id="sec" icon={Shield} label="Security" activeTab={activeTab} onSelect={setActiveTab} />
            <SidebarBtn id="mon" icon={Eye} label="Monitoring" activeTab={activeTab} onSelect={setActiveTab} />
          </div>
        </nav>

        {/* CONTENT AREA */}
        <main className="flex-1 overflow-y-auto bg-slate-100 p-6 lg:p-10 scroll-smooth">
          <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200/60 p-8 lg:p-12 min-h-[90%]">
            {/* -- TAB CONTENT START -- */}

            {activeTab === 'info' && (
              <div className="animate-in fade-in duration-300">
                <SectionHeader title="Document Information" subtitle="Manage document metadata and version history." icon={FileText} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                  {Object.keys(doc.info).map((k) => (
                    <SimpleInput
                      key={k}
                      label={k.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                      value={(doc.info as any)[k]}
                      onChange={(v) => updateField('info', k as keyof DocInfo, v)}
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
              <div className="animate-in fade-in duration-300">
                <SectionHeader title="Executive Summary" subtitle="High-level overview of the integration project." icon={LayoutDashboard} />
                <div className="space-y-8">
                  <SimpleInput
                    multiline
                    label="1.1 Purpose"
                    value={doc.executive.purpose}
                    onChange={(v) => updateField('executive', 'purpose', v)}
                    placeholder="Why is this integration needed?"
                    editMode={editMode}
                  />
                  <SimpleInput
                    multiline
                    label="1.2 Scope"
                    value={doc.executive.scope}
                    onChange={(v) => updateField('executive', 'scope', v)}
                    placeholder="What is in/out of scope?"
                    editMode={editMode}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SimpleInput
                      multiline
                      label="1.3 Source Systems"
                      value={doc.executive.sources}
                      onChange={(v) => updateField('executive', 'sources', v)}
                      editMode={editMode}
                    />
                    <SimpleInput
                      multiline
                      label="Target Systems"
                      value={doc.executive.targets}
                      onChange={(v) => updateField('executive', 'targets', v)}
                      editMode={editMode}
                    />
                  </div>
                </div>
                <div className="mt-12">
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
                    <AddButton onClick={() => addRow(['stakeholders'], { role: '', name: '', contact: '' })} label="Add Stakeholder" />
                  )}
                </div>
              </div>
            )}

            {activeTab === 'arch' && (
              <div className="animate-in fade-in duration-300">
                <SectionHeader title="Technical Architecture" subtitle="Landscape setup and environment details." icon={Network} />
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
                    onClick={() => addRow(['architecture', 'environments'], { environment: '', url: '', purpose: '' })}
                    label="Add Environment"
                  />
                )}
                <div className="mt-12 p-8 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50/50 text-center flex flex-col items-center justify-center">
                  <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                    <Network className="h-10 w-10 text-blue-500" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Architecture Diagram Placeholder</h3>
                  <p className="mt-2 text-sm text-slate-500 max-w-md">
                    Images cannot be embedded directly. Please paste your high-resolution architecture diagram into the exported Word document
                    here.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'iflows' && (
              <div className="animate-in fade-in duration-300">
                <SectionHeader title="Integration Flows Overview" subtitle="Master inventory of all integration artifacts." icon={Activity} />
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
                        id: `IF_${(doc.iflows.length + 1).toString().padStart(3, '0')}`,
                        name: 'New Integration Flow',
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
                    className="w-full py-4 border-2 border-dashed border-blue-300/60 rounded-xl text-blue-600 font-semibold hover:bg-blue-50/50 hover:border-blue-400 transition-all flex items-center justify-center mt-6"
                  >
                    <Plus size={20} className="mr-2" /> Create New Integration Flow
                  </button>
                )}
              </div>
            )}

            {activeTab === 'specs' && (
              <div className="animate-in fade-in duration-300">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 pb-6 border-b border-slate-200">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Detailed Specifications</h2>
                    <p className="text-slate-500 mt-2 text-lg">Deep dive configuration for each flow.</p>
                  </div>
                  <div className="mt-6 md:mt-0 w-full md:w-72">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Integration Flow</label>
                    <div className="relative">
                      <select
                        className="block w-full pl-4 pr-10 py-3 text-base border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm appearance-none font-medium text-slate-700 transition-all hover:bg-slate-100"
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
                          <option>No iFlows defined</option>
                        )}
                      </select>
                      <ChevronDown className="absolute right-3 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {currentIFlow ? (
                  <div className="space-y-12 animate-in slide-in-from-right-4 duration-300">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200/50">
                      <h3 className="text-lg font-bold text-blue-700 mb-6 flex items-center">
                        <FileJson className="mr-3 w-6 h-6 opacity-75" />
                        {currentIFlow.id} : {currentIFlow.name}
                      </h3>
                      <SimpleInput
                        multiline
                        label="Functional Description"
                        value={currentIFlow.details.description}
                        onChange={(v) => {
                          const idx = doc.iflows.findIndex((f) => f.id === currentIFlow.id);
                          updateDeepField(['iflows', idx.toString(), 'details', 'description'], v);
                        }}
                        placeholder="Describe the business logic..."
                        editMode={editMode}
                        className="bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                      {/* Sender Card */}
                      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100 flex items-center">
                          <ArrowRightCircle className="text-indigo-600 mr-3" />
                          <h4 className="font-bold text-indigo-900">Sender Configuration</h4>
                        </div>
                        <div className="p-6 space-y-5">
                          <SimpleInput
                            label="Adapter Type"
                            value={currentIFlow.details.sender.adapter}
                            onChange={(v) =>
                              updateDeepField(
                                ['iflows', doc.iflows.findIndex((f) => f.id === currentIFlow.id).toString(), 'details', 'sender', 'adapter'],
                                v
                              )
                            }
                            editMode={editMode}
                            placeholder="e.g., HTTPS, IDoc, SFTP"
                          />
                          <SimpleInput
                            label="Source Endpoint"
                            value={currentIFlow.details.sender.endpoint}
                            onChange={(v) =>
                              updateDeepField(
                                ['iflows', doc.iflows.findIndex((f) => f.id === currentIFlow.id).toString(), 'details', 'sender', 'endpoint'],
                                v
                              )
                            }
                            editMode={editMode}
                            placeholder="/cpi/path"
                          />
                          <SimpleInput
                            label="Authentication"
                            value={currentIFlow.details.sender.auth}
                            onChange={(v) =>
                              updateDeepField(
                                ['iflows', doc.iflows.findIndex((f) => f.id === currentIFlow.id).toString(), 'details', 'sender', 'auth'],
                                v
                              )
                            }
                            editMode={editMode}
                            placeholder="e.g., Basic, Certificate, OAuth"
                          />
                        </div>
                      </div>

                      {/* Receiver Card */}
                      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100 flex items-center">
                          <Globe className="text-emerald-600 mr-3" />
                          <h4 className="font-bold text-emerald-900">Receiver Configuration</h4>
                        </div>
                        <div className="p-6 space-y-5">
                          <SimpleInput
                            label="Adapter Type"
                            value={currentIFlow.details.receiver.adapter}
                            onChange={(v) =>
                              updateDeepField(
                                ['iflows', doc.iflows.findIndex((f) => f.id === currentIFlow.id).toString(), 'details', 'receiver', 'adapter'],
                                v
                              )
                            }
                            editMode={editMode}
                            placeholder="e.g., SOAP, OData, REST"
                          />
                          <SimpleInput
                            label="Target Endpoint"
                            value={currentIFlow.details.receiver.endpoint}
                            onChange={(v) =>
                              updateDeepField(
                                ['iflows', doc.iflows.findIndex((f) => f.id === currentIFlow.id).toString(), 'details', 'receiver', 'endpoint'],
                                v
                              )
                            }
                            editMode={editMode}
                            placeholder="https://target.system/api"
                          />
                          <SimpleInput
                            label="Timeout / Config"
                            value={currentIFlow.details.receiver.timeout}
                            onChange={(v) =>
                              updateDeepField(
                                ['iflows', doc.iflows.findIndex((f) => f.id === currentIFlow.id).toString(), 'details', 'receiver', 'timeout'],
                                v
                              )
                            }
                            editMode={editMode}
                            placeholder="e.g., 60000ms"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <SectionSubHeader title="Process Flow Steps" />
                      <RenderTable
                        path={['iflows', doc.iflows.findIndex((f) => f.id === currentIFlow.id).toString(), 'details', 'steps']}
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
                            addRow(['iflows', doc.iflows.findIndex((f) => f.id === currentIFlow.id).toString(), 'details', 'steps'], {
                              step: currentIFlow.details.steps.length + 1,
                              type: '',
                              description: ''
                            })
                          }
                          label="Add Process Step"
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-32 flex flex-col items-center justify-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300">
                    <Activity className="h-16 w-16 text-slate-300 mb-4" />
                    <h3 className="text-xl font-semibold text-slate-700">No Integration Flows</h3>
                    <p className="text-slate-500 mt-2 mb-6">Go to the 'iFlows Overview' section to add your first integration.</p>
                    <button
                      onClick={() => setActiveTab('iflows')}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Go to Overview
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'api' && (
              <div className="animate-in fade-in duration-300">
                <SectionHeader title="API Management" subtitle="API Gateway and proxy configurations." icon={Database} />
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
                  <div className="mb-12">
                    <AddButton onClick={() => addRow(['api', 'proxies'], { name: '', basePath: '', target: '' })} label="Add API Proxy" />
                  </div>
                )}
                <SectionSubHeader title="5.2 Applied Policies" />
                <SimpleInput
                  multiline
                  label=""
                  value={doc.api.policies}
                  onChange={(v) => updateField('api', 'policies', v)}
                  placeholder="List policies like Rate Limiting, OAuth, Spike Arrest..."
                  editMode={editMode}
                />
              </div>
            )}

            {activeTab === 'deploy' && (
              <div className="animate-in fade-in duration-300">
                <SectionHeader title="Deployment Procedures" subtitle="Standard Operating Procedures for promotion." icon={Server} />
                <div className="grid md:grid-cols-2 gap-10">
                  <div className="bg-amber-50/50 p-6 rounded-xl border border-amber-100/50">
                    <h3 className="text-lg font-bold text-amber-800 mb-4 flex items-center">
                      <CheckSquare className="mr-2" size={20} /> 6.1 Pre-Deployment Checklist
                    </h3>
                    <SimpleInput
                      multiline
                      value={doc.deployment.checklist}
                      onChange={(v) => updateField('deployment', 'checklist', v)}
                      placeholder="- [ ] Item 1..."
                      editMode={editMode}
                      label=""
                      className="bg-white"
                    />
                  </div>
                  <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100/50">
                    <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center">
                      <List className="mr-2" size={20} /> 6.2 Deployment Steps
                    </h3>
                    <SimpleInput
                      multiline
                      value={doc.deployment.steps}
                      onChange={(v) => updateField('deployment', 'steps', v)}
                      placeholder="1. Step one..."
                      editMode={editMode}
                      label=""
                      className="bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'test' && (
              <div className="animate-in fade-in duration-300">
                <SectionHeader title="Testing Strategy" subtitle="Validation scenarios and expected results." icon={CheckSquare} />
                <RenderTable
                  path={['testing', 'scenarios']}
                  data={doc.testing.scenarios}
                  headers={['ID', 'Scenario', 'Input Data', 'Expected Output']}
                  keys={['id', 'scenario', 'input', 'expected']}
                  editMode={editMode}
                  onUpdate={updateDeepField}
                  onRemove={removeRow}
                />
                {editMode && (
                  <AddButton
                    onClick={() =>
                      addRow(['testing', 'scenarios'], {
                        id: 'TC' + (doc.testing.scenarios.length + 1).toString().padStart(3, '0'),
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
              <div className="animate-in fade-in duration-300">
                <SectionHeader title="Security Configuration" subtitle="Manage credentials and access artifacts." icon={Shield} />
                <div className="bg-rose-50 p-6 rounded-xl border border-rose-100 mb-8 flex items-start">
                  <Lock className="text-rose-500 mr-4 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="text-rose-800 font-bold mb-1">Security Warning</h4>
                    <p className="text-rose-700/80 text-sm">
                      Do not enter actual passwords or sensitive secrets here. Only reference the artifact names used in the CPI tenant.
                    </p>
                  </div>
                </div>
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
                    onClick={() => addRow(['security', 'credentials'], { name: '', type: 'User Credentials', usage: '' })}
                    label="Add Credential"
                  />
                )}
              </div>
            )}

            {activeTab === 'mon' && (
              <div className="animate-in fade-in duration-300">
                <SectionHeader title="Monitoring & Operations" subtitle="KPIs, thresholds, and alerting rules." icon={Eye} />
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
                  <AddButton onClick={() => addRow(['monitoring', 'metrics'], { metric: '', threshold: '', alertType: '' })} label="Add Metric" />
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;