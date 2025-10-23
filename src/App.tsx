import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Save, Download, FileText, Edit3, Plus, Trash2,
  ChevronDown, ChevronRight, LayoutDashboard, Settings,
  Network, Shield, Activity, Database, BookOpen,
  List, Key, Eye, CheckSquare, FileJson,
  Server, Users, Layers, ArrowRightCircle, Globe, Lock, Upload, Image, Check, X, AlertTriangle, RotateCcw
} from 'lucide-react';
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  Table, 
  TableRow, 
  TableCell, 
  HeadingLevel, 
  AlignmentType, 
  WidthType, 
  BorderStyle,
  ShadingType,
  VerticalAlign,
  TableOfContents,
  ImageRun
} from 'docx';
import { saveAs } from 'file-saver';

// --- TYPES ---
interface DocInfo {
  title: string;
  version: string;
  author: string;
  dateCreated: string;
  status: string;
  environment: string;
  logoUrl: string;
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

interface SenderConfig {
  adapter: string;
  endpoint: string;
  auth: string;
}

interface ReceiverConfig {
  adapter: string;
  endpoint: string;
  timeout: string;
}

interface IFlowDetail {
  description: string;
  senders: SenderConfig[];
  receivers: ReceiverConfig[];
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
  sourcePayload: string;
  targetPayload: string;
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

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

interface Prerequisite {
  id: string;
  item: string;
  status: string;
}

interface ErrorScenario {
  error: string;
  cause: string;
  resolution: string;
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
  prerequisites: Prerequisite[];
  deployment: { 
    checklist: ChecklistItem[];
    steps: string;
    rollback: string;
  };
  testing: { scenarios: TestScenario[] };
  security: { credentials: Credential[] };
  monitoring: { metrics: Metric[] };
  errorHandling: { scenarios: ErrorScenario[] };
}

// --- INITIAL STATE ---
const INITIAL_STATE: DocState = {
  info: {
    title: 'SAP CPI Deployment Document',
    version: '1.0',
    author: '',
    dateCreated: new Date().toLocaleDateString(),
    status: 'Draft',
    environment: 'DEV',
    logoUrl: ''
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
        senders: [
          { adapter: 'HTTPS', endpoint: '/cpi/orders', auth: 'Client Certificate' }
        ],
        receivers: [
          { adapter: 'SOAP', endpoint: 'https://3pl.example.com/orders', timeout: '60000' }
        ],
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
  prerequisites: [
    { id: '1', item: 'SAP BTP account with CPI subscription', status: 'Completed' },
    { id: '2', item: 'Network connectivity to target systems', status: 'Pending' },
    { id: '3', item: 'Required certificates and credentials', status: 'In Progress' }
  ],
  deployment: {
    checklist: [
      { id: '1', text: 'All iFlows tested in QA', checked: false },
      { id: '2', text: 'Security Materials created in target', checked: false },
      { id: '3', text: 'Connectivity verified', checked: false },
      { id: '4', text: 'API Proxies deployed', checked: false }
    ],
    steps: '1. Export package from QA tenant.\n2. Import to PROD tenant.\n3. Configure externalized parameters (URLs, credentials).\n4. Deploy all artifacts.\n5. Verify IF_001 status is "Started".',
    rollback: '1. Stop all integration flows\n2. Restore previous package version\n3. Verify system stability\n4. Notify stakeholders'
  },
  testing: {
    scenarios: [
      {
        id: 'TC001',
        scenario: 'Happy Path Order',
        input: 'Valid Order XML (Order #12345)',
        expected: 'HTTP 200 OK, Order created in target',
        sourcePayload: '<Order><OrderID>12345</OrderID><Customer>ACME Corp</Customer></Order>',
        targetPayload: '<OrderResponse><Status>Success</Status><OrderID>12345</OrderID></OrderResponse>'
      },
      {
        id: 'TC002',
        scenario: 'Invalid Data',
        input: 'Missing mandatory fields',
        expected: 'HTTP 400 Bad Request, Error logged in CPI',
        sourcePayload: '<Order><OrderID></OrderID></Order>',
        targetPayload: '<Error><Code>400</Code><Message>OrderID is required</Message></Error>'
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
  },
  errorHandling: {
    scenarios: [
      { error: 'Connection Timeout', cause: 'Target system unavailable', resolution: 'Check network connectivity, verify target system status' },
      { error: 'Authentication Failed', cause: 'Invalid credentials', resolution: 'Verify credential deployment, check certificate expiry' }
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
              className="w-full p-3 bg-white border border-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-h-[100px] text-sm text-slate-700 placeholder:text-slate-400 transition-all resize-y outline-none font-mono"
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
          <div className="px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-100 text-slate-800 whitespace-pre-wrap text-sm min-h-[42px] flex items-center font-mono">
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
              <tr className="bg-slate-50">
                {headers.map((h, i) => (
                  <th
                    key={i}
                    className="px-4 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap border-b-2 border-slate-300"
                  >
                    {h}
                  </th>
                ))}
                {editMode && <th className="px-4 py-3 w-12 border-b-2 border-slate-300"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  {keys.map((k, j) => (
                    <td key={j} className="px-4 py-2.5 align-top border-b border-slate-100">
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
                    <td className="px-2 py-2.5 text-center align-middle whitespace-nowrap border-b border-slate-100">
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

  useEffect(() => {
    if (doc.iflows.length > 0 && !doc.iflows.find((f) => f.id === selectedIFlowId)) {
      setSelectedIFlowId(doc.iflows[0].id);
    }
  }, [doc.iflows, selectedIFlowId]);

  const currentIFlow = useMemo(
    () => doc.iflows.find((f) => f.id === selectedIFlowId) || doc.iflows[0],
    [doc.iflows, selectedIFlowId]
  );

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

  const toggleChecklistItem = useCallback((index: number) => {
    setDoc((prev) => {
      const newDoc = structuredClone(prev);
      newDoc.deployment.checklist[index].checked = !newDoc.deployment.checklist[index].checked;
      return newDoc;
    });
  }, []);

  const updateChecklistItem = useCallback((index: number, text: string) => {
    setDoc((prev) => {
      const newDoc = structuredClone(prev);
      newDoc.deployment.checklist[index].text = text;
      return newDoc;
    });
  }, []);

  const addChecklistItem = useCallback(() => {
    setDoc((prev) => {
      const newDoc = structuredClone(prev);
      newDoc.deployment.checklist.push({
        id: Date.now().toString(),
        text: '',
        checked: false
      });
      return newDoc;
    });
  }, []);

  const removeChecklistItem = useCallback((index: number) => {
    setDoc((prev) => {
      const newDoc = structuredClone(prev);
      newDoc.deployment.checklist.splice(index, 1);
      return newDoc;
    });
  }, []);

  // Helper function to fetch image and convert to base64
  const fetchImageAsBase64 = async (url: string): Promise<string | null> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Failed to fetch logo:', error);
      return null;
    }
  };

 // EXPORT with "Table Grid" Style
const handleExport = useCallback(async () => {
  const sections: any[] = [];

  // Helper to create "Table Grid" style tables (Word default)
  const createBasicTable = (headers: string[], data: any[], keys: string[]) => {
    if (!data || data.length === 0) {
      return new Paragraph({ 
        text: "No data available", 
        italics: true, 
        color: "666666",
        spacing: { before: 200, after: 200 }
      });
    }

    const columnWidths = headers.map(() => Math.floor(9500 / headers.length));

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        // Header row - simple white background with bold text
        new TableRow({
          children: headers.map((header, idx) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: header,
                      bold: true,
                      size: 22
                    })
                  ],
                  alignment: AlignmentType.LEFT
                })
              ],
              shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
              width: { size: columnWidths[idx], type: WidthType.DXA },
              margins: { top: 100, bottom: 100, left: 100, right: 100 },
              verticalAlign: VerticalAlign.CENTER,
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 4, color: "000000" }
              }
            })
          )
        }),
        // Data rows - simple white background with thin black borders
        ...data.map((row, rowIdx) =>
          new TableRow({
            children: keys.map((key, colIdx) =>
              new TableCell({
                children: [
                  new Paragraph({
                    text: String(row[key] || ''),
                    size: 22
                  })
                ],
                shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
                width: { size: columnWidths[colIdx], type: WidthType.DXA },
                margins: { top: 100, bottom: 100, left: 100, right: 100 },
                verticalAlign: VerticalAlign.CENTER,
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                  left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                  right: { style: BorderStyle.SINGLE, size: 4, color: "000000" }
                }
              })
            )
          })
        )
      ]
    });
  };

  // Two-column info table with "Table Grid" style
  const createInfoTable = (data: { label: string; value: string }[]) => {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: data.map((item, idx) =>
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: item.label,
                      bold: true,
                      size: 22
                    })
                  ]
                })
              ],
              shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
              width: { size: 3000, type: WidthType.DXA },
              margins: { top: 100, bottom: 100, left: 100, right: 100 },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 4, color: "000000" }
              }
            }),
            new TableCell({
              children: [
                new Paragraph({
                  text: item.value,
                  size: 22
                })
              ],
              shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
              width: { size: 6500, type: WidthType.DXA },
              margins: { top: 100, bottom: 100, left: 100, right: 100 },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 4, color: "000000" }
              }
            })
          ]
        })
      )
    });
  };
    // COVER PAGE with Logo
    const coverElements: any[] = [];

    // Add logo if URL is provided
    if (doc.info.logoUrl) {
      try {
        const base64Image = await fetchImageAsBase64(doc.info.logoUrl);
        if (base64Image) {
          const imageData = base64Image.split(',')[1];
          coverElements.push(
            new Paragraph({
              children: [
                new ImageRun({
                  data: Uint8Array.from(atob(imageData), c => c.charCodeAt(0)),
                  transformation: {
                    width: 150,
                    height: 150
                  }
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 2000, after: 800 }
            })
          );
        }
      } catch (error) {
        console.error('Error adding logo to document:', error);
      }
    }

    coverElements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: doc.info.title,
            bold: true,
            size: 56,
            color: "1E40AF"
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: doc.info.logoUrl ? 400 : 4000, after: 600 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Version ${doc.info.version}`,
            size: 32,
            color: "6B7280"
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: doc.info.dateCreated,
            size: 24,
            color: "9CA3AF"
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Status: ${doc.info.status} | Environment: ${doc.info.environment}`,
            size: 20,
            color: "6B7280",
            italics: true
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 2000 }
      }),
      new Paragraph({ text: '', pageBreakBefore: true })
    );

    sections.push(...coverElements);

    // TABLE OF CONTENTS
    sections.push(
      new Paragraph({
        text: 'TABLE OF CONTENTS',
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 600 }
      }),
      new TableOfContents("Table of Contents", {
        hyperlink: true,
        headingStyleRange: "1-3"
      }),
      new Paragraph({ text: '', pageBreakBefore: true })
    );

    // DOCUMENT INFORMATION
    sections.push(
      new Paragraph({
        text: 'DOCUMENT INFORMATION',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 400 }
      }),
      createInfoTable([
        { label: 'Document Title', value: doc.info.title },
        { label: 'Version', value: doc.info.version },
        { label: 'Author', value: doc.info.author || 'N/A' },
        { label: 'Status', value: doc.info.status },
        { label: 'Target Environment', value: doc.info.environment },
        { label: 'Created Date', value: doc.info.dateCreated }
      ]),
      new Paragraph({
        text: 'Version History',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 }
      }),
      createBasicTable(
        ['Version', 'Date', 'Author', 'Description'],
        doc.versions,
        ['version', 'date', 'author', 'description']
      )
    );

    // EXECUTIVE SUMMARY
    sections.push(
      new Paragraph({ text: '', pageBreakBefore: true }),
      new Paragraph({
        text: '1. EXECUTIVE SUMMARY',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 400 }
      }),
      new Paragraph({
        text: '1.1 Purpose',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 200 }
      }),
      new Paragraph({
        text: doc.executive.purpose,
        spacing: { after: 300 }
      }),
      new Paragraph({
        text: '1.2 Scope',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 200 }
      }),
      new Paragraph({
        text: doc.executive.scope,
        spacing: { after: 300 }
      }),
      new Paragraph({
        text: '1.3 System Landscape',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Source Systems: ', bold: true }),
          new TextRun({ text: doc.executive.sources })
        ],
        spacing: { after: 150 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Target Systems: ', bold: true }),
          new TextRun({ text: doc.executive.targets })
        ],
        spacing: { after: 300 }
      }),
      new Paragraph({
        text: '1.4 Key Stakeholders',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 200 }
      }),
      createBasicTable(
        ['Role', 'Name', 'Contact'],
        doc.stakeholders,
        ['role', 'name', 'contact']
      )
    );

    // ARCHITECTURE
    sections.push(
      new Paragraph({ text: '', pageBreakBefore: true }),
      new Paragraph({
        text: '2. TECHNICAL ARCHITECTURE',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 400 }
      }),
      new Paragraph({
        text: '2.1 Environment Details',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 200 }
      }),
      createBasicTable(
        ['Environment', 'Tenant URL', 'Purpose'],
        doc.architecture.environments,
        ['environment', 'url', 'purpose']
      )
    );

    // INTEGRATION FLOWS
    sections.push(
      new Paragraph({ text: '', pageBreakBefore: true }),
      new Paragraph({
        text: '3. INTEGRATION FLOWS',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 400 }
      }),
      createBasicTable(
        ['ID', 'Name', 'Type', 'Source', 'Target'],
        doc.iflows,
        ['id', 'name', 'type', 'source', 'target']
      )
    );

    // DETAILED SPECIFICATIONS
    sections.push(
      new Paragraph({ text: '', pageBreakBefore: true }),
      new Paragraph({
        text: '4. DETAILED SPECIFICATIONS',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 400 }
      })
    );

    doc.iflows.forEach((flow, idx) => {
      sections.push(
        new Paragraph({
          text: `4.${idx + 1} ${flow.id} - ${flow.name}`,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Description: ', bold: true }),
            new TextRun({ text: flow.details.description })
          ],
          spacing: { after: 300 }
        }),
        new Paragraph({
          text: 'Sender Configurations',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 300, after: 200 }
        }),
        createBasicTable(
          ['Adapter', 'Endpoint', 'Authentication'],
          flow.details.senders,
          ['adapter', 'endpoint', 'auth']
        ),
        new Paragraph({
          text: 'Receiver Configurations',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 300, after: 200 }
        }),
        createBasicTable(
          ['Adapter', 'Endpoint', 'Timeout/Config'],
          flow.details.receivers,
          ['adapter', 'endpoint', 'timeout']
        ),
        new Paragraph({
          text: 'Process Steps',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 300, after: 200 }
        }),
        createBasicTable(
          ['Step', 'Type', 'Description'],
          flow.details.steps,
          ['step', 'type', 'description']
        )
      );
    });

    // API MANAGEMENT
    sections.push(
      new Paragraph({ text: '', pageBreakBefore: true }),
      new Paragraph({
        text: '5. API MANAGEMENT',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 400 }
      }),
      new Paragraph({
        text: '5.1 API Proxies',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 200 }
      }),
      createBasicTable(
        ['API Name', 'Base Path', 'Target Endpoint'],
        doc.api.proxies,
        ['name', 'basePath', 'target']
      ),
      new Paragraph({
        text: '5.2 Applied Policies',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 200 }
      }),
      new Paragraph({
        text: doc.api.policies,
        spacing: { after: 300 }
      })
    );

    // PREREQUISITES
    sections.push(
      new Paragraph({ text: '', pageBreakBefore: true }),
      new Paragraph({
        text: '6. PREREQUISITES',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 400 }
      }),
      createBasicTable(
        ['Prerequisite', 'Status'],
        doc.prerequisites,
        ['item', 'status']
      )
    );

    // DEPLOYMENT
    sections.push(
      new Paragraph({ text: '', pageBreakBefore: true }),
      new Paragraph({
        text: '7. DEPLOYMENT PROCEDURES',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 400 }
      }),
      new Paragraph({
        text: '7.1 Pre-Deployment Checklist',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 200 }
      })
    );

    doc.deployment.checklist.forEach((item) => {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({ 
              text: item.checked ? '☑ ' : '☐ ', 
              size: 22 
            }),
            new TextRun({ 
              text: item.text,
              size: 20
            })
          ],
          spacing: { after: 150 }
        })
      );
    });

    sections.push(
      new Paragraph({
        text: '7.2 Deployment Steps',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 }
      }),
      new Paragraph({
        text: doc.deployment.steps,
        spacing: { after: 300 }
      }),
      new Paragraph({
        text: '7.3 Rollback Procedures',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 }
      }),
      new Paragraph({
        text: doc.deployment.rollback,
        spacing: { after: 300 }
      })
    );

    // TESTING with Payloads
    sections.push(
      new Paragraph({ text: '', pageBreakBefore: true }),
      new Paragraph({
        text: '8. TESTING STRATEGY',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 400 }
      })
    );

    doc.testing.scenarios.forEach((scenario, idx) => {
      sections.push(
        new Paragraph({
          text: `8.${idx + 1} ${scenario.id} - ${scenario.scenario}`,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Input: ', bold: true }),
            new TextRun({ text: scenario.input })
          ],
          spacing: { after: 150 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Expected: ', bold: true }),
            new TextRun({ text: scenario.expected })
          ],
          spacing: { after: 200 }
        }),
        new Paragraph({
          text: 'Source Payload:',
          bold: true,
          spacing: { before: 200, after: 100 }
        }),
        new Paragraph({
          text: scenario.sourcePayload,
          shading: { fill: "F3F4F6", type: ShadingType.SOLID },
          spacing: { after: 200 }
        }),
        new Paragraph({
          text: 'Target Payload:',
          bold: true,
          spacing: { before: 200, after: 100 }
        }),
        new Paragraph({
          text: scenario.targetPayload,
          shading: { fill: "F3F4F6", type: ShadingType.SOLID },
          spacing: { after: 300 }
        })
      );
    });

    // SECURITY
    sections.push(
      new Paragraph({ text: '', pageBreakBefore: true }),
      new Paragraph({
        text: '9. SECURITY CONFIGURATION',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 400 }
      }),
      createBasicTable(
        ['Credential Name', 'Type', 'Usage'],
        doc.security.credentials,
        ['name', 'type', 'usage']
      )
    );

    // MONITORING
    sections.push(
      new Paragraph({ text: '', pageBreakBefore: true }),
      new Paragraph({
        text: '10. MONITORING & OPERATIONS',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 400 }
      }),
      createBasicTable(
        ['Metric', 'Threshold', 'Alert Action'],
        doc.monitoring.metrics,
        ['metric', 'threshold', 'alertType']
      )
    );

    // ERROR HANDLING
    sections.push(
      new Paragraph({ text: '', pageBreakBefore: true }),
      new Paragraph({
        text: '11. ERROR HANDLING',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 400 }
      }),
      createBasicTable(
        ['Error', 'Cause', 'Resolution'],
        doc.errorHandling.scenarios,
        ['error', 'cause', 'resolution']
      )
    );

    // COPYRIGHT FOOTER
    sections.push(
      new Paragraph({
        text: '',
        spacing: { before: 800 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `© ${new Date().getFullYear()} Kannan Rajendran. All rights reserved.`,
            size: 20,
            color: "6B7280"
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `SAP Integration Architect • Generated on ${new Date().toLocaleString()}`,
            size: 18,
            color: "9CA3AF",
            italics: true
          })
        ],
        alignment: AlignmentType.CENTER
      })
    );

    // CREATE DOCUMENT
    const docx = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1440,
                right: 1440,
                bottom: 1440,
                left: 1440
              }
            }
          },
          children: sections
        }
      ]
    });

    // EXPORT
    const blob = await Packer.toBlob(docx);
    saveAs(blob, `SAP_CPI_Doc_${doc.info.title.replace(/\s+/g, '_')}_v${doc.info.version}.docx`);
  }, [doc]);

  return (
    <div className="h-screen bg-slate-100 flex flex-col font-sans text-slate-900 overflow-hidden">
      {/* TOP NAVIGATION */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center shadow-sm z-20 flex-shrink-0 relative">
        <div className="flex items-center space-x-4">
          {doc.info.logoUrl ? (
            <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm border border-slate-200 flex items-center justify-center bg-white">
              <img src={doc.info.logoUrl} alt="Company Logo" className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="bg-gradient-to-br from-blue-700 to-blue-500 p-2.5 rounded-xl text-white shadow-sm">
              <Layers size={24} strokeWidth={1.5} />
            </div>
          )}
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

      {/* MAIN LAYOUT */}
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
            <SidebarBtn id="prereq" icon={CheckSquare} label="Prerequisites" activeTab={activeTab} onSelect={setActiveTab} />
            <SidebarBtn id="deploy" icon={Server} label="Deployment" activeTab={activeTab} onSelect={setActiveTab} />
            <SidebarBtn id="test" icon={FileJson} label="Testing & Payloads" activeTab={activeTab} onSelect={setActiveTab} />
            <SidebarBtn id="sec" icon={Shield} label="Security" activeTab={activeTab} onSelect={setActiveTab} />
            <SidebarBtn id="mon" icon={Eye} label="Monitoring" activeTab={activeTab} onSelect={setActiveTab} />
            <SidebarBtn id="error" icon={AlertTriangle} label="Error Handling" activeTab={activeTab} onSelect={setActiveTab} />
          </div>
        </nav>

        {/* CONTENT AREA */}
        <main className="flex-1 overflow-y-auto bg-slate-100 p-6 lg:p-10 scroll-smooth">
          <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200/60 p-8 lg:p-12 min-h-[90%]">
            
            {activeTab === 'info' && (
              <div className="animate-in fade-in duration-300">
                <SectionHeader title="Document Information" subtitle="Manage document metadata and version history." icon={FileText} />
                
                <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Image className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-800 mb-2">Company Logo</h3>
                      <SimpleInput
                        label="Logo URL"
                        value={doc.info.logoUrl}
                        onChange={(v) => updateField('info', 'logoUrl', v)}
                        placeholder="https://example.com/logo.png"
                        editMode={editMode}
                      />
                      {doc.info.logoUrl && (
                        <div className="mt-4 p-4 bg-white rounded-lg border border-slate-200 flex items-center justify-center">
                          <img src={doc.info.logoUrl} alt="Logo Preview" className="max-h-24 object-contain" />
                        </div>
                      )}
                      <p className="text-xs text-slate-500 mt-2">
                        💡 Logo will appear on cover page of exported document
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                  {Object.keys(doc.info)
                    .filter((k) => k !== 'logoUrl')
                    .map((k) => (
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
                          senders: [],
                          receivers: [],
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

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100 flex items-center justify-between">
                        <div className="flex items-center">
                          <ArrowRightCircle className="text-indigo-600 mr-3" />
                          <h4 className="font-bold text-indigo-900">Sender Configurations</h4>
                        </div>
                      </div>
                      <div className="p-6">
                        <RenderTable
                          path={['iflows', doc.iflows.findIndex((f) => f.id === currentIFlow.id).toString(), 'details', 'senders']}
                          data={currentIFlow.details.senders}
                          headers={['Adapter Type', 'Endpoint', 'Authentication']}
                          keys={['adapter', 'endpoint', 'auth']}
                          editMode={editMode}
                          onUpdate={updateDeepField}
                          onRemove={removeRow}
                        />
                        {editMode && (
                          <AddButton
                            onClick={() =>
                              addRow(
                                ['iflows', doc.iflows.findIndex((f) => f.id === currentIFlow.id).toString(), 'details', 'senders'],
                                { adapter: '', endpoint: '', auth: '' }
                              )
                            }
                            label="Add Sender"
                          />
                        )}
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100 flex items-center justify-between">
                        <div className="flex items-center">
                          <Globe className="text-emerald-600 mr-3" />
                          <h4 className="font-bold text-emerald-900">Receiver Configurations</h4>
                        </div>
                      </div>
                      <div className="p-6">
                        <RenderTable
                          path={['iflows', doc.iflows.findIndex((f) => f.id === currentIFlow.id).toString(), 'details', 'receivers']}
                          data={currentIFlow.details.receivers}
                          headers={['Adapter Type', 'Endpoint', 'Timeout/Config']}
                          keys={['adapter', 'endpoint', 'timeout']}
                          editMode={editMode}
                          onUpdate={updateDeepField}
                          onRemove={removeRow}
                        />
                        {editMode && (
                          <AddButton
                            onClick={() =>
                              addRow(
                                ['iflows', doc.iflows.findIndex((f) => f.id === currentIFlow.id).toString(), 'details', 'receivers'],
                                { adapter: '', endpoint: '', timeout: '' }
                              )
                            }
                            label="Add Receiver"
                          />
                        )}
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

            {activeTab === 'prereq' && (
              <div className="animate-in fade-in duration-300">
                <SectionHeader title="Prerequisites" subtitle="Required setup before deployment." icon={CheckSquare} />
                <RenderTable
                  path={['prerequisites']}
                  data={doc.prerequisites}
                  headers={['Prerequisite Item', 'Status']}
                  keys={['item', 'status']}
                  editMode={editMode}
                  onUpdate={updateDeepField}
                  onRemove={removeRow}
                />
                {editMode && (
                  <AddButton onClick={() => addRow(['prerequisites'], { id: Date.now().toString(), item: '', status: 'Pending' })} label="Add Prerequisite" />
                )}
              </div>
            )}

            {activeTab === 'deploy' && (
              <div className="animate-in fade-in duration-300">
                <SectionHeader title="Deployment Procedures" subtitle="Standard Operating Procedures for promotion." icon={Server} />
                <div className="grid md:grid-cols-2 gap-10">
                  <div className="bg-amber-50/50 p-6 rounded-xl border border-amber-100/50">
                    <h3 className="text-lg font-bold text-amber-800 mb-4 flex items-center">
                      <CheckSquare className="mr-2" size={20} /> Pre-Deployment Checklist
                    </h3>
                    <div className="space-y-3">
                      {doc.deployment.checklist.map((item, idx) => (
                        <div key={item.id} className="flex items-start space-x-3 group">
                          <button
                            onClick={() => toggleChecklistItem(idx)}
                            className={`flex-shrink-0 w-5 h-5 rounded border-2 transition-all flex items-center justify-center mt-0.5 ${
                              item.checked
                                ? 'bg-green-500 border-green-500'
                                : 'bg-white border-slate-300 hover:border-green-400'
                            }`}
                            disabled={!editMode}
                          >
                            {item.checked && <Check size={14} className="text-white" />}
                          </button>
                          {editMode ? (
                            <input
                              type="text"
                              value={item.text}
                              onChange={(e) => updateChecklistItem(idx, e.target.value)}
                              className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                              placeholder="Checklist item..."
                            />
                          ) : (
                            <span className={`flex-1 text-sm ${item.checked ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                              {item.text}
                            </span>
                          )}
                          {editMode && (
                            <button
                              onClick={() => removeChecklistItem(idx)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded transition-all"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {editMode && (
                      <button
                        onClick={addChecklistItem}
                        className="mt-4 w-full py-2 border-2 border-dashed border-amber-300 rounded-lg text-amber-700 text-sm font-medium hover:bg-amber-50 transition-all"
                      >
                        + Add Checklist Item
                      </button>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100/50">
                      <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center">
                        <List className="mr-2" size={20} /> Deployment Steps
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

                    <div className="bg-red-50/50 p-6 rounded-xl border border-red-100/50">
                      <h3 className="text-lg font-bold text-red-800 mb-4 flex items-center">
                        <RotateCcw className="mr-2" size={20} /> Rollback Procedures
                      </h3>
                      <SimpleInput
                        multiline
                        value={doc.deployment.rollback}
                        onChange={(v) => updateField('deployment', 'rollback', v)}
                        placeholder="1. Rollback step one..."
                        editMode={editMode}
                        label=""
                        className="bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'test' && (
              <div className="animate-in fade-in duration-300">
                <SectionHeader title="Testing & Payloads" subtitle="Test scenarios with sample data." icon={FileJson} />
                
                {doc.testing.scenarios.map((scenario, idx) => (
                  <div key={scenario.id} className="mb-8 p-6 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-bold text-slate-800">
                        {scenario.id} - {scenario.scenario}
                      </h3>
                      {editMode && (
                        <button
                          onClick={() => removeRow(['testing', 'scenarios'], idx)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <SimpleInput
                        label="Test ID"
                        value={scenario.id}
                        onChange={(v) => updateDeepField(['testing', 'scenarios', idx.toString(), 'id'], v)}
                        editMode={editMode}
                      />
                      <SimpleInput
                        label="Scenario Name"
                        value={scenario.scenario}
                        onChange={(v) => updateDeepField(['testing', 'scenarios', idx.toString(), 'scenario'], v)}
                        editMode={editMode}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <SimpleInput
                        label="Input Description"
                        value={scenario.input}
                        onChange={(v) => updateDeepField(['testing', 'scenarios', idx.toString(), 'input'], v)}
                        editMode={editMode}
                      />
                      <SimpleInput
                        label="Expected Output"
                        value={scenario.expected}
                        onChange={(v) => updateDeepField(['testing', 'scenarios', idx.toString(), 'expected'], v)}
                        editMode={editMode}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <SimpleInput
                        multiline
                        label="Source Payload (XML/JSON)"
                        value={scenario.sourcePayload}
                        onChange={(v) => updateDeepField(['testing', 'scenarios', idx.toString(), 'sourcePayload'], v)}
                        placeholder='<Order>...</Order>'
                        editMode={editMode}
                      />
                      <SimpleInput
                        multiline
                        label="Target Payload (XML/JSON)"
                        value={scenario.targetPayload}
                        onChange={(v) => updateDeepField(['testing', 'scenarios', idx.toString(), 'targetPayload'], v)}
                        placeholder='<Response>...</Response>'
                        editMode={editMode}
                      />
                    </div>
                  </div>
                ))}

                {editMode && (
                  <AddButton
                    onClick={() =>
                      addRow(['testing', 'scenarios'], {
                        id: 'TC' + (doc.testing.scenarios.length + 1).toString().padStart(3, '0'),
                        scenario: 'New Test Scenario',
                        input: '',
                        expected: '',
                        sourcePayload: '',
                        targetPayload: ''
                      })
                    }
                    label="Add Test Scenario"
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

            {activeTab === 'error' && (
              <div className="animate-in fade-in duration-300">
                <SectionHeader title="Error Handling" subtitle="Common errors and resolution steps." icon={AlertTriangle} />
                <RenderTable
                  path={['errorHandling', 'scenarios']}
                  data={doc.errorHandling.scenarios}
                  headers={['Error', 'Cause', 'Resolution']}
                  keys={['error', 'cause', 'resolution']}
                  editMode={editMode}
                  onUpdate={updateDeepField}
                  onRemove={removeRow}
                />
                {editMode && (
                  <AddButton onClick={() => addRow(['errorHandling', 'scenarios'], { error: '', cause: '', resolution: '' })} label="Add Error Scenario" />
                )}
              </div>
            )}

            <div className="mt-16 pt-8 border-t-2 border-slate-200 text-center">
              <p className="text-slate-400 text-sm font-medium">
                © {new Date().getFullYear()} <span className="text-slate-600 font-semibold">Kannan Rajendran</span>. All rights reserved.
              </p>
              <p className="text-slate-400 text-xs mt-2">SAP Integration Architect • Version {doc.info.version}</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;