import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

// Get all Vue files with @apply
const files = execSync('grep -l "@apply" --include="*.vue" -r /home/user/1033/pages /home/user/1033/components /home/user/1033/layouts 2>/dev/null || true', { encoding: 'utf-8' })
  .trim()
  .split('\n')
  .filter(Boolean);

console.log(`Found ${files.length} Vue files with @apply`);

let fixedCount = 0;

for (const file of files) {
  try {
    let content = readFileSync(file, 'utf-8');
    
    // Check if file has style blocks with @apply that don't have @reference
    const styleRegex = /<style([^>]*)>([\s\S]*?)<\/style>/g;
    let modified = false;
    
    content = content.replace(styleRegex, (match, attrs, styleContent) => {
      // Check if this style block uses @apply
      if (styleContent.includes('@apply')) {
        // Check if it already has @reference
        if (!styleContent.includes('@reference')) {
          modified = true;
          // Add @reference at the beginning of the style content
          return `<style${attrs}>\n@reference "tailwindcss";${styleContent}</style>`;
        }
      }
      return match;
    });
    
    if (modified) {
      writeFileSync(file, content);
      console.log(`Fixed: ${file}`);
      fixedCount++;
    }
  } catch (err) {
    console.error(`Error processing ${file}: ${err.message}`);
  }
}

console.log(`\nFixed ${fixedCount} files`);
