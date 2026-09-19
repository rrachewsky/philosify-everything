// markdownLite - the single markdown → HTML path for model prose that
// arrives as markdown (philosopher-panel bodies, colloquium and debate
// verdicts). Same sanitizer config as the analysis pipeline
// (DOMPurify, ADD_TAGS: ['hl']). Headings: # is the piece's own title
// (dropped when the surface already labels it), ## → h3, ###+ → h4.
import DOMPurify from 'dompurify';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function inline(s) {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+?)\*/g, '$1<em>$2</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

export function renderMarkdownLite(text, { dropTitle = true } = {}) {
  if (!text) return '';
  const lines = String(text).replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  let para = [];
  let list = null;
  let first = true;
  const flushPara = () => {
    if (para.length) {
      out.push('<p>' + para.map(inline).join('<br/>') + '</p>');
      para = [];
    }
  };
  const flushList = () => {
    if (list) {
      out.push(`<${list.type}>` + list.items.map((i) => '<li>' + inline(i) + '</li>').join('') + `</${list.type}>`);
      list = null;
    }
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushPara();
      flushList();
      continue;
    }
    const h = line.match(/^(#{1,6})\s+(.+?)\s*#*$/);
    if (h) {
      flushPara();
      flushList();
      const level = h[1].length;
      if (dropTitle && level === 1 && first) {
        first = false;
        continue;
      }
      first = false;
      const tag = level <= 2 ? 'h3' : 'h4';
      out.push(`<${tag}>${inline(h[2])}</${tag}>`);
      continue;
    }
    first = false;
    if (/^\s*-{3,}\s*$/.test(line)) {
      flushPara();
      flushList();
      continue;
    }
    const li = line.match(/^\s*(?:[-*\u2022]|\d+[.)])\s+(.+)$/);
    if (li) {
      flushPara();
      const type = /^\s*\d/.test(line) ? 'ol' : 'ul';
      if (!list || list.type !== type) {
        flushList();
        list = { type, items: [] };
      }
      list.items.push(li[1]);
      continue;
    }
    flushList();
    para.push(line.trim());
  }
  flushPara();
  flushList();
  return DOMPurify.sanitize(out.join(''), { ADD_TAGS: ['hl'] });
}

export default renderMarkdownLite;
