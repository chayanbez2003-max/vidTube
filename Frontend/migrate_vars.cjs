const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src');

const MAP = {
  'bg-\\[var\\(--glass-bg\\)\\]': 'bg-white/5',
  'bg-\\[var\\(--glass-bg-hover\\)\\]': 'bg-white/10',
  'bg-\\[var\\(--bg-elevated\\)\\]': 'bg-bg-elevated',
  'bg-\\[var\\(--bg-surface\\)\\]': 'bg-bg-surface',
  'bg-\\[var\\(--bg-base\\)\\]': 'bg-bg-base',
  'bg-\\[var\\(--teal-mist\\)\\]': 'bg-teal-mist',
  'bg-\\[var\\(--teal-primary\\)\\]': 'bg-teal-primary',
  
  'text-\\[var\\(--text-primary\\)\\]': 'text-white',
  'text-\\[var\\(--text-secondary\\)\\]': 'text-white/70',
  'text-\\[var\\(--text-muted\\)\\]': 'text-white/50',
  'text-\\[var\\(--text-hint\\)\\]': 'text-white/40',
  'text-\\[var\\(--teal-primary\\)\\]': 'text-teal-primary',
  'text-\\[var\\(--teal-soft\\)\\]': 'text-teal-soft',
  'text-\\[var\\(--badge-pink\\)\\]': 'text-badge-pink',
  'text-\\[var\\(--badge-blue\\)\\]': 'text-badge-blue',
  'text-\\[var\\(--badge-green\\)\\]': 'text-badge-green',

  'border-\\[var\\(--border-color\\)\\]': 'border-white/10',
  'border-\\[var\\(--border-default\\)\\]': 'border-white/10',
  'border-\\[var\\(--border-subtle\\)\\]': 'border-white/10',
  'border-\\[var\\(--teal-dim\\)\\]': 'border-teal-dim',

  'var\\(--teal-primary\\)': '#1DB8A8',
  'var\\(--teal-soft\\)': '#2ED4BC',
  'var\\(--teal-vivid\\)': '#40FFE8',
  'var\\(--bg-base\\)': '#0D0B18',
  'var\\(--text-muted\\)': 'rgba(255,255,255,0.5)',
  'var\\(--text-secondary\\)': 'rgba(255,255,255,0.7)'
};

function walkDir(d) {
  const files = fs.readdirSync(d);
  for (const f of files) {
    const full = path.join(d, f);
    if (fs.statSync(full).isDirectory()) walkDir(full);
    else if (full.endsWith('.jsx') || full.endsWith('.js')) {
      let content = fs.readFileSync(full, 'utf8');
      let changed = false;
      for (const [k, v] of Object.entries(MAP)) {
        const regex = new RegExp(k, 'g');
        if (regex.test(content)) {
          content = content.replace(regex, v);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(full, content);
        console.log('Updated:', full);
      }
    }
  }
}

walkDir(dir);
