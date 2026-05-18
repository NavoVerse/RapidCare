import os
import re

frontend_dir = '/home/navo/Documents/GitHub/RapidCare/Frontend'

for root, _, files in os.walk(frontend_dir):
    for file in files:
        if file.endswith('.css'):
            file_path = os.path.join(root, file)
            with open(file_path, 'r') as f:
                content = f.read()

            original_content = content
            
            # 1. Remove overused `will-change` to stop layer explosion
            content = re.sub(r'\s*will-change:\s*[^;]+;', '', content)
            
            # 2. Put back will-change specifically for the top scroll-progress-bar
            # This is one of the few places where hardware acceleration is strictly beneficial
            content = content.replace('transition: width 0.1s cubic-bezier(0.16, 1, 0.3, 1);\n}', 'transition: width 0.1s cubic-bezier(0.16, 1, 0.3, 1);\n    will-change: width;\n}')
            
            # 3. Remove duplicate webkit glass filters
            content = re.sub(r'\s*-webkit-backdrop-filter:\s*[^;]+;', '', content)
            
            if content != original_content:
                with open(file_path, 'w') as f:
                    f.write(content)
                print(f"Optimized: {file_path}")

print("CSS Optimization Complete.")
