import os
import re

hr_components = '/Users/user/Workspace/Projects/Strucureo_Projects/erp/new/bridgebreak/components/hr'
hr_page = '/Users/user/Workspace/Projects/Strucureo_Projects/erp/new/bridgebreak/app/(admin)/admin/hr/page.tsx'

def clean_file(path):
    with open(path, 'r') as f:
        content = f.read()

    # Typography sizes
    content = re.sub(r'text-\[8px\]', 'text-[10px]', content)
    content = re.sub(r'text-\[9px\]', 'text-[10px]', content)
    content = re.sub(r'text-\[10px\]', 'text-xs', content)
    content = re.sub(r'text-\[11px\]', 'text-sm', content)
    
    # Tracking
    content = re.sub(r'tracking-\[0.2em\]', '', content)
    content = content.replace('tracking-widest', '')
    content = content.replace('tracking-wider', '')
    content = content.replace('tracking-tighter', '')
    content = content.replace('tracking-tight', '')
    
    # Uppercase
    content = content.replace(' uppercase ', ' ')
    content = content.replace('"uppercase ', '"')
    content = content.replace(' uppercase"', '"')
    
    # Fonts
    content = content.replace('font-black', 'font-semibold')
    content = content.replace('font-bold', 'font-medium')
    
    # Clean up double spaces created by replacement
    content = content.replace('  ', ' ')
    content = content.replace(' "', '"')
    
    # Icon containers
    content = content.replace('bg-foreground text-card-foreground', 'bg-primary/10 text-primary')

    with open(path, 'w') as f:
        f.write(content)

for root, _, files in os.walk(hr_components):
    for name in files:
        if name.endswith('.tsx') or name.endswith('.ts'):
            clean_file(os.path.join(root, name))

clean_file(hr_page)
print("Typography cleaned.")
