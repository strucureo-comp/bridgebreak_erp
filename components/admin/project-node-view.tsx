'use client';

import { useCallback, useMemo, useState } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState, 
  addEdge,
  Handle, 
  Position,
  NodeProps,
  Edge,
  NodeMouseHandler
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  Briefcase, 
  User, 
  PenTool, 
  Layers, 
  HardHat, 
  Package, 
  Receipt, 
  DollarSign, 
  CalendarClock 
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Project } from '@/lib/db/types';
import { NodeDetailSheet } from './node-detail-sheet';

// --- Custom Nodes ---

const CoreNode = ({ data }: NodeProps) => {
  const project = data.project as Project;
  return (
    <div className="w-96 shadow-2xl rounded-2xl border-3 border-primary bg-background p-0 overflow-hidden cursor-default">
      <div className="bg-gradient-to-r from-primary to-primary/80 p-5 flex items-center gap-3">
        <Briefcase className="h-6 w-6 text-primary-foreground" />
        <div>
          <h3 className="font-bold text-primary-foreground uppercase tracking-wider text-base">Project Core</h3>
          <p className="text-xs text-primary-foreground/70">Central Hub</p>
        </div>
      </div>
      <div className="p-5 space-y-4">
        <div>
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-wide">Project Name</p>
          <p className="font-bold text-xl leading-tight mt-1">{project.title}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/30 border">
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Status</p>
            <Badge variant="outline" className="mt-2 text-xs">{project.status.replace('_', ' ')}</Badge>
          </div>
          <div className="p-3 rounded-lg bg-muted/30 border">
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Contract Value</p>
            <p className="font-mono text-sm font-bold mt-2 text-green-600">
              ${project.estimated_cost?.toLocaleString() || '0'}
            </p>
          </div>
        </div>
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Project Manager</p>
            <p className="text-sm font-medium mt-1">Admin User</p>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-primary !w-4 !h-4" />
      <Handle type="source" position={Position.Left} className="!bg-primary !w-4 !h-4" />
      <Handle type="source" position={Position.Top} className="!bg-primary !w-4 !h-4" />
      <Handle type="source" position={Position.Bottom} className="!bg-primary !w-4 !h-4" />
    </div>
  );
};

const ModuleNode = ({ data }: NodeProps) => {
  const { title, icon: Icon, items, colorClass } = data as any;
  
  return (
    <div className={`w-80 shadow-xl rounded-xl border-2 bg-background overflow-hidden hover:ring-2 hover:ring-offset-2 transition-all cursor-pointer ${colorClass}`}>
      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <div className="p-4 border-b bg-muted/40 flex items-center gap-3">
        <div className={`p-2.5 rounded-lg ${data.iconBg}`}>
          <Icon className={`h-5 w-5 ${data.iconColor}`} />
        </div>
        <span className="font-bold text-base uppercase tracking-tight">{title}</span>
      </div>
      <div className="p-4">
        <ul className="space-y-2.5">
          {items.map((item: string, i: number) => (
            <li key={i} className="text-sm text-muted-foreground flex items-center gap-2.5">
              <div className="h-2 w-2 rounded-full bg-primary/60 flex-shrink-0" />
              <span className="font-medium text-foreground">{item}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="px-4 py-3 bg-muted/20 border-t text-xs text-muted-foreground font-medium">
        Click to expand details
      </div>
    </div>
  );
};

const nodeTypes = {
  core: CoreNode,
  module: ModuleNode,
};

// --- Main Component ---

export function ProjectNodeView({ project, onRefresh }: { project: Project, onRefresh: () => void }) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const initialNodes = useMemo(() => [
    {
      id: 'core',
      type: 'core',
      position: { x: 400, y: 300 },
      data: { project },
      draggable: false,
      style: { cursor: 'pointer' }, 
    },
    // Top
    {
      id: 'finance',
      type: 'module',
      position: { x: 400, y: 0 },
      data: { 
        title: 'Finance', 
        icon: DollarSign, 
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        colorClass: 'hover:ring-green-500',
        items: ['Revenue', 'Total Cost', 'Gross Margin', 'Net Margin', 'Cash Flow']
      },
    },
    // Top Right
    {
      id: 'timeline',
      type: 'module',
      position: { x: 850, y: 100 },
      data: { 
        title: 'Timeline / Status', 
        icon: CalendarClock,
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        colorClass: 'hover:ring-blue-500',
        items: ['Milestones', 'Progress %', 'Delay Notes', 'Execution Status']
      },
    },
    // Right
    {
      id: 'design',
      type: 'module',
      position: { x: 900, y: 350 },
      data: { 
        title: 'Design', 
        icon: PenTool,
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
        colorClass: 'hover:ring-purple-500',
        items: ['Drawings', 'BOQ', 'Specifications', 'Revisions', 'History']
      },
    },
    // Bottom Right
    {
      id: 'inventory',
      type: 'module',
      position: { x: 850, y: 600 },
      data: { 
        title: 'Inventory', 
        icon: Package,
        iconBg: 'bg-orange-100',
        iconColor: 'text-orange-600',
        colorClass: 'hover:ring-orange-500',
        items: ['Issued Materials', 'Returns', 'Scrap & Wastage', 'Stock Balance']
      },
    },
    // Bottom
    {
      id: 'expenses',
      type: 'module',
      position: { x: 400, y: 700 },
      data: { 
        title: 'Expenses', 
        icon: Receipt,
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
        colorClass: 'hover:ring-red-500',
        items: ['Site Expenses', 'Transport', 'Equipment Hire', 'Misc Costs']
      },
    },
    // Bottom Left
    {
      id: 'labour',
      type: 'module',
      position: { x: -50, y: 600 },
      data: { 
        title: 'Labour', 
        icon: HardHat,
        iconBg: 'bg-yellow-100',
        iconColor: 'text-yellow-600',
        colorClass: 'hover:ring-yellow-500',
        items: ['Categories', 'Skill Levels', 'Rates', 'Attendance', 'Overtime']
      },
    },
    // Left
    {
      id: 'resources',
      type: 'module',
      position: { x: -100, y: 350 },
      data: { 
        title: 'Resources', 
        icon: Layers,
        iconBg: 'bg-indigo-100',
        iconColor: 'text-indigo-600',
        colorClass: 'hover:ring-indigo-500',
        items: ['Planned Materials', 'Issued Materials', 'Equipment Usage', 'Balance']
      },
    },
    // Top Left
    {
      id: 'client',
      type: 'module',
      position: { x: -50, y: 100 },
      data: { 
        title: 'Client', 
        icon: User,
        iconBg: 'bg-pink-100',
        iconColor: 'text-pink-600',
        colorClass: 'hover:ring-pink-500',
        items: ['Details', 'Contract / PO', 'Invoices', 'Receipts & Outstanding']
      },
    },
  ], [project]);

  const initialEdges: Edge[] = useMemo(() => [
    { id: 'e-core-finance', source: 'core', target: 'finance', animated: true, style: { stroke: '#16a34a', strokeWidth: 2 } },
    { id: 'e-core-timeline', source: 'core', target: 'timeline', animated: true, style: { stroke: '#2563eb', strokeWidth: 2 } },
    { id: 'e-core-design', source: 'core', target: 'design', animated: true, style: { stroke: '#9333ea', strokeWidth: 2 } },
    { id: 'e-core-inventory', source: 'core', target: 'inventory', animated: true, style: { stroke: '#ea580c', strokeWidth: 2 } },
    { id: 'e-core-expenses', source: 'core', target: 'expenses', animated: true, style: { stroke: '#dc2626', strokeWidth: 2 } },
    { id: 'e-core-labour', source: 'core', target: 'labour', animated: true, style: { stroke: '#ca8a04', strokeWidth: 2 } },
    { id: 'e-core-resources', source: 'core', target: 'resources', animated: true, style: { stroke: '#4f46e5', strokeWidth: 2 } },
    { id: 'e-core-client', source: 'core', target: 'client', animated: true, style: { stroke: '#db2777', strokeWidth: 2 } },
  ], []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick: NodeMouseHandler = useCallback((event, node) => {
    // if (node.id === 'core') return; // Removed restriction
    setSelectedNode(node.id);
    setIsSheetOpen(true);
  }, []);

  return (
    <>
      <div className="h-[calc(100vh-8rem)] w-full bg-slate-50 rounded-xl border overflow-hidden relative">
        <div className="absolute top-4 left-4 z-10 bg-white/80 backdrop-blur px-4 py-2 rounded-lg border shadow-sm">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
            Interactive Workspace
          </p>
          <p className="text-[10px] text-muted-foreground">
            Click on a module node to view details
          </p>
        </div>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.5}
          maxZoom={1.5}
          attributionPosition="bottom-right"
        >
          <Background gap={20} size={1} color="#cbd5e1" />
          <Controls />
          <MiniMap zoomable pannable className="!bg-background rounded-lg border shadow-sm" />
        </ReactFlow>
      </div>

      <NodeDetailSheet 
        isOpen={isSheetOpen} 
        onClose={() => setIsSheetOpen(false)} 
        type={selectedNode}
        project={project}
        onUpdate={onRefresh}
      />
    </>
  );
}