'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Globe, 
  Settings2, 
  Wallet, 
  Calculator, 
  ChevronRight,
  Landmark,
  Plus,
  Save,
  Trash2,
  Shield,
  Users,
  X,
  Pencil,
  Briefcase,
  Building2,
  Tags
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createHRRole, createDepartment } from '@/lib/api';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

type ConfigMode = 'statutory' | 'roles' | 'departments' | 'employment-types' | 'components' | 'templates';

interface HRMSSettingsProps {
  roles?: any[];
  departments?: any[];
  onRefresh?: () => void;
}

export function HRMSSettings({ roles = [], departments = [], onRefresh = () => {} }: HRMSSettingsProps) {
  const [mode, setConfigMode] = useState<ConfigMode>('statutory');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setIsEditOpen(true);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left: Configuration Mode Selector */}
      <div className="lg:col-span-4 space-y-4">
        <Label className="text-sm font-medium text-foreground px-1">Configuration Hub</Label>
        <div className="grid grid-cols-1 gap-2">
          {[
            { id: 'statutory', label: 'Statutory Rules', desc: 'Country tax & laws', icon: Globe },
            { id: 'roles', label: 'Role Architect', desc: 'Designations/Positions', icon: Shield },
            { id: 'departments', label: 'Work Units', desc: 'Departments/Divisions', icon: Building2 },
            { id: 'employment-types', label: 'Contract Types', desc: 'Staffing categories', icon: Tags },
            { id: 'components', label: 'Component Master', desc: 'Earnings & deductions', icon: Calculator },
            { id: 'templates', label: 'Salary Templates', desc: 'Role-based structures', icon: Wallet },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setConfigMode(item.id as ConfigMode)}
              className={cn(
               "flex items-center gap-4 p-4 rounded-md border text-left transition-all",
                mode === item.id 
                  ?"border-primary bg-primary/5 shadow-sm" 
                  :"border-border bg-card hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <div className={cn(
               "h-10 w-10 rounded-md flex items-center justify-center transition-colors",
                mode === item.id ?"bg-primary text-card-foreground" :"bg-muted text-muted-foreground"
              )}>
                <item.icon size={20} />
              </div>
              <div className="min-w-0">
                <p className={cn("text-xs font-semibold", mode === item.id ?"text-foreground" :"text-muted-foreground")}>{item.label}</p>
                <p className="text-xs font-medium text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Input-Based Configuration Area */}
      <div className="lg:col-span-8 space-y-6">
        <div className="flex items-center justify-between px-1">
          <Label className="text-sm font-medium text-foreground">Configure Properties</Label>
          <Button size="sm" className="h-8 gap-2 bg-primary hover:bg-primary/90 font-medium text-xs">
            <Save className="h-3 w-3" /> Save All Changes
          </Button>
        </div>

        {mode === 'statutory' && (
          <Card className="border shadow-sm rounded-md bg-card">
            <CardHeader className="border-b bg-muted/50 py-4 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-foreground">Statutory Engine</CardTitle>
              <Landmark className="h-4 w-4 text-muted-foreground/60" />
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              <div className="space-y-4">
                <Label className="text-xs font-medium text-muted-foreground">Select Active Region</Label>
                <Select defaultValue="AE">
                  <SelectTrigger className="h-10 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AE" className="text-xs font-medium">United Arab Emirates (AED)</SelectItem>
                    <SelectItem value="IN" className="text-xs font-medium">India (INR)</SelectItem>
                    <SelectItem value="US" className="text-xs font-medium">United States (USD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">Tax Model</Label>
                  <Select defaultValue="none">
                    <SelectTrigger className="h-9 border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (Exempt)</SelectItem>
                      <SelectItem value="flat">Flat Rate</SelectItem>
                      <SelectItem value="slab">Progressive Slabs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">Gratuity Rule</Label>
                  <div className="flex items-center gap-3 h-9">
                    <Switch defaultChecked />
                    <span className="text-xs font-medium text-muted-foreground">Mandatory Accrual</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {mode === 'roles' && (
          <Card className="border shadow-sm rounded-md bg-card">
            <CardHeader className="border-b bg-muted/50 py-4 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-foreground">Role Architect</CardTitle>
              <Badge variant="outline" className="text-xs font-medium">Designations</Badge>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">New Designation</Label>
                  <div className="flex gap-2">
                    <Input placeholder="e.g. Senior Fitter" className="h-9 border-border text-xs font-medium" id="new-role-title" />
                    <Button size="sm" className="h-9 px-4 bg-primary font-medium text-xs" onClick={async () => {
                      const input = document.getElementById('new-role-title') as HTMLInputElement;
                      if (!input.value) return;
                      try {
                        await createHRRole({ title: input.value, code: input.value.toLowerCase().replace(/\s+/g, '_') });
                        toast.success('Designation added');
                        input.value = '';
                        onRefresh();
                      } catch { toast.error('Failed to add'); }
                    }}>Add</Button>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-border">
                <Label className="text-xs font-medium text-foreground">Configured Roles</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {roles && roles.length > 0 ? (
                    roles.map(role => (
                      <div key={role.id} className="flex items-center justify-between p-3 border rounded-md bg-muted hover:bg-white transition-all group">
                        <div className="flex items-center gap-3">
                          <Users size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                          <span className="text-sm font-medium text-foreground">{role.title}</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => handleEdit({ type: 'role', name: role.title })}>
                            <Pencil size={12} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/60 hover:text-rose-500"><Trash2 size={12} /></Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic col-span-full">No roles configured yet</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {mode === 'departments' && (
          <Card className="border shadow-sm rounded-md bg-card">
            <CardHeader className="border-b bg-muted/50 py-4 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-foreground">Work Units</CardTitle>
              <Badge variant="outline" className="text-xs font-medium">Departments</Badge>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">New Department Name</Label>
                  <div className="flex gap-2">
                    <Input placeholder="e.g. Fabrication" className="h-9 border-border text-xs font-medium" id="new-dept-name" />
                    <Button size="sm" className="h-9 px-4 bg-primary font-medium text-xs" onClick={async () => {
                      const input = document.getElementById('new-dept-name') as HTMLInputElement;
                      if (!input.value) return;
                      try {
                        await createDepartment({ name: input.value, code: input.value.toUpperCase().slice(0, 3) });
                        toast.success('Department created');
                        input.value = '';
                        onRefresh();
                      } catch { toast.error('Failed to create'); }
                    }}>Add</Button>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-border">
                <Label className="text-xs font-medium text-foreground">Active Units</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {departments && departments.length > 0 ? (
                    departments.map(dept => (
                      <div key={dept.id} className="flex items-center justify-between p-3 border rounded-md bg-muted hover:bg-white transition-all group">
                        <div className="flex items-center gap-3">
                          <Building2 size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                          <span className="text-sm font-medium text-foreground">{dept.name}</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => handleEdit({ type: 'dept', name: dept.name })}>
                            <Pencil size={12} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/60 hover:text-rose-500"><Trash2 size={12} /></Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic col-span-full">No departments configured yet</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {mode === 'employment-types' && (
          <Card className="border shadow-sm rounded-md bg-card">
            <CardHeader className="border-b bg-muted/50 py-4 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-foreground">Contract Types</CardTitle>
              <Badge variant="outline" className="text-xs font-medium">Staffing</Badge>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Add Category</Label>
                  <div className="flex gap-2">
                    <Input placeholder="e.g. Daily Wages" className="h-9 border-border text-xs font-medium" />
                    <Button size="sm" className="h-9 px-4 bg-primary font-medium text-xs">Add</Button>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-border">
                <Label className="text-xs font-medium text-foreground">Current Categories</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {['Permanent', 'Contract', 'Intern', 'Probationary'].map(type => (
                    <div key={type} className="flex items-center justify-between p-3 border rounded-md bg-muted hover:bg-white transition-all group">
                      <div className="flex items-center gap-3">
                        <Tags size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                        <span className="text-sm font-medium text-foreground">{type}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => handleEdit({ type: 'contract', name: type })}>
                          <Pencil size={12} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/60 hover:text-rose-500"><Trash2 size={12} /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {mode === 'components' && (
          <Card className="border shadow-sm rounded-md bg-card overflow-hidden">
            <CardHeader className="border-b bg-muted/50 py-4 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-foreground">Salary Components</CardTitle>
              <Button variant="outline" size="sm" className="h-7 text-xs font-medium text-primary border-primary/20">+ Add</Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {[
                  { name: 'Base Salary', cat: 'Earning', type: 'Fixed' },
                  { name: 'Housing', cat: 'Earning', type: '40% of Base' },
                  { name: 'Transport', cat: 'Earning', type: 'Flat' },
                ].map((comp) => (
                  <div key={comp.name} className="flex items-center justify-between p-4 hover:bg-accent hover:text-accent-foreground transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                        <Calculator size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-foreground">{comp.name}</p>
                        <Badge className={cn(
                         "text-xs font-semibold px-1.5 h-4 mt-1 border-none",
                          comp.cat === 'Earning' ?"bg-emerald-50 text-emerald-700" :"bg-rose-50 text-rose-700"
                        )}>{comp.cat}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right mr-4">
                        <p className="text-xs font-medium text-muted-foreground">Logic</p>
                        <p className="text-xs font-semibold text-foreground mt-0.5">{comp.type}</p>
                      </div>
                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleEdit({ ...comp, kind: 'component' })}>
                          <Pencil size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/60 hover:text-rose-500"><Trash2 size={14} /></Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {mode === 'templates' && (
          <div className="space-y-6">
            <Card className="border shadow-sm rounded-md bg-card">
              <CardHeader className="border-b bg-muted/50 py-4 flex flex-row items-center justify-between text-foreground">
                <CardTitle className="text-sm font-semibold">Salary Templates</CardTitle>
                <Button variant="outline" size="sm" className="h-7 text-xs font-medium text-primary border-primary/20 gap-1.5">
                  <Plus size={14} /> New Template
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {[
                    { name: 'Senior Engineer', role: 'Engineering', base: 10000, hra: 4000, ta: 2000 },
                    { name: 'Junior Developer', role: 'IT', base: 6000, hra: 2400, ta: 1200 },
                    { name: 'Operations Manager', role: 'Operations', base: 8500, hra: 3400, ta: 1700 },
                  ].map((template) => (
                    <div key={template.name} className="flex items-center justify-between p-4 hover:bg-accent hover:text-accent-foreground transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                          <Briefcase size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{template.name}</p>
                          <Badge variant="secondary" className="text-xs font-semibold mt-1">{template.role}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-xs font-medium text-muted-foreground">Base Salary</p>
                          <p className="text-sm font-semibold text-foreground">AED {template.base.toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit template">
                            <Pencil size={14} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500/60 hover:text-rose-600" title="Delete template">
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm rounded-md bg-card">
              <CardHeader className="border-b bg-muted/50 py-4">
                <CardTitle className="text-sm font-semibold text-foreground">Define Structure: Senior Engineer</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <Label className="text-xs font-semibold text-primary">Earnings Components</Label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md border border-border group hover:border-primary/30">
                      <div>
                        <p className="text-xs font-medium text-foreground">Base Salary</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Fixed monthly amount</p>
                      </div>
                      <input type="number" placeholder="10000" defaultValue="10000" className="w-24 h-8 rounded-md border border-border px-2 text-xs font-medium" />
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100"><X size={14} /></Button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md border border-border group hover:border-primary/30">
                      <div>
                        <p className="text-xs font-medium text-foreground">Housing Allowance</p>
                        <p className="text-xs text-muted-foreground mt-0.5">40% of base salary</p>
                      </div>
                      <input type="number" placeholder="4000" defaultValue="4000" className="w-24 h-8 rounded-md border border-border px-2 text-xs font-medium" />
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100"><X size={14} /></Button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md border border-border group hover:border-primary/30">
                      <div>
                        <p className="text-xs font-medium text-foreground">Transport Allowance</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Flat 2000 AED</p>
                      </div>
                      <input type="number" placeholder="2000" defaultValue="2000" className="w-24 h-8 rounded-md border border-border px-2 text-xs font-medium" />
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100"><X size={14} /></Button>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full h-8 text-xs font-medium gap-1.5"><Plus size={14} /> Add Component</Button>
                </div>

                <div className="border-t pt-4">
                  <Label className="text-xs font-semibold text-rose-600">Deductions</Label>
                  <div className="space-y-3 mt-3">
                    <div className="flex items-center justify-between p-3 bg-rose-50/30 dark:bg-rose-950/10 rounded-md border border-rose-200/50 group hover:border-rose-300/50">
                      <div>
                        <p className="text-xs font-medium text-foreground">PF Employee</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Provident Fund</p>
                      </div>
                      <input type="number" placeholder="0" className="w-24 h-8 rounded-md border border-border px-2 text-xs font-medium" />
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100"><X size={14} /></Button>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full h-8 text-xs font-medium gap-1.5 mt-3"><Plus size={14} /> Add Deduction</Button>
                </div>

                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground font-medium">Gross Salary:</span>
                    <span className="font-semibold text-foreground">AED 16,000</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground font-medium">Total Deductions:</span>
                    <span className="font-semibold text-red-600">- AED 0</span>
                  </div>
                  <div className="border-t border-primary/20 pt-2 flex justify-between">
                    <span className="text-foreground font-semibold">Net Salary:</span>
                    <span className="text-lg font-bold text-primary">AED 16,000</span>
                  </div>
                </div>

                <Button className="w-full bg-primary hover:bg-primary/90 font-medium text-xs h-10">Save Template Structure</Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Global Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="">Edit Properties</DialogTitle>
            <DialogDescription className="text-xs font-medium text-muted-foreground">Update system configuration</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Name / Title</Label>
              <Input defaultValue={editingItem?.name} className="h-10 border-border font-medium text-xs" />
            </div>
            {editingItem?.type === 'component' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Calculation Logic</Label>
                  <Select defaultValue="fixed">
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                      <SelectItem value="percent">Percentage of Base</SelectItem>
                      <SelectItem value="formula">Custom Formula</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-md border border-border">
                  <span className="text-xs font-medium text-muted-foreground">Taxable Component</span>
                  <Switch defaultChecked={editingItem?.tax} className="scale-75" />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button className="w-full bg-primary hover:bg-primary/90 font-medium text-xs h-10" onClick={() => {
              toast.success('Configuration updated');
              setIsEditOpen(false);
            }}>Commit Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
