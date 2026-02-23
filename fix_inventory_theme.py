import re

with open('/Users/user/Workspace/Projects/Strucureo_Projects/erp/new/bridgebreak/app/(admin)/admin/inventory/page.tsx', 'r') as f:
    text = f.read()

# Shadcn structural replacements
text = re.sub(r'bg-slate-50/50', 'bg-background', text)
text = re.sub(r'bg-slate-50', 'bg-muted/40', text)
text = re.sub(r'bg-slate-100', 'bg-muted', text)
text = re.sub(r'bg-slate-200/60', 'bg-muted', text)
text = re.sub(r'bg-slate-200', 'bg-border', text)

text = re.sub(r'text-slate-900', 'text-foreground', text)
text = re.sub(r'text-slate-800', 'text-foreground font-semibold', text)
text = re.sub(r'text-slate-700', 'text-foreground/80', text)
text = re.sub(r'text-slate-600', 'text-muted-foreground', text)
text = re.sub(r'text-slate-500', 'text-muted-foreground', text)
text = re.sub(r'text-slate-400', 'text-muted-foreground/60', text)

text = re.sub(r'border-slate-100', 'border-border', text)
text = re.sub(r'border-slate-200', 'border-border', text)

# Primary color replacements (Red Shadcn theme)
text = re.sub(r'bg-indigo-600', 'bg-primary', text)
text = re.sub(r'hover:bg-indigo-700', 'hover:bg-primary/90', text)
text = re.sub(r'text-indigo-600', 'text-primary', text)
text = re.sub(r'text-indigo-700', 'text-primary', text)
text = re.sub(r'text-indigo-400', 'text-primary/70', text)
text = re.sub(r'bg-indigo-50', 'bg-primary/10', text)
text = re.sub(r'bg-indigo-100/50', 'bg-primary/15', text)
text = re.sub(r'border-indigo-100', 'border-border', text) # Or border-primary/20
text = re.sub(r'border-indigo-200', 'border-border', text)

with open('/Users/user/Workspace/Projects/Strucureo_Projects/erp/new/bridgebreak/app/(admin)/admin/inventory/page.tsx', 'w') as f:
    f.write(text)
