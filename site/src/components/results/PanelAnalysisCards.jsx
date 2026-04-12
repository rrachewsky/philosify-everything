import DOMPurify from 'dompurify';

/**
 * Parse philosopher panel markdown into structured sections and render as cards.
 * Expected format:
 *   # Title (optional)
 *   ## Section heading
 *   **Philosopher Name** — *School*
 *   paragraphs...
 *   ---
 *   ## Next section
 *   ...
 */
function parsePanelSections(markdown) {
  if (!markdown) return [];

  const sections = [];
  // Split by --- or ## headings
  const blocks = markdown.split(/\n---\n|\n(?=## )/);

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    // Extract heading (## or #)
    const headingMatch = trimmed.match(/^#{1,2}\s+(.+)/);
    let title = '';
    let subtitle = '';
    let body = trimmed;

    if (headingMatch) {
      title = headingMatch[1]
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/^#+\s*/, '')
        .trim();
      body = trimmed.slice(headingMatch[0].length).trim();
    }

    // Check for subtitle pattern: **Name** — *School*
    const subtitleMatch = body.match(/^\*\*(.+?)\*\*\s*—\s*\*(.+?)\*/);
    if (subtitleMatch && !title) {
      title = subtitleMatch[1].trim();
      subtitle = subtitleMatch[2].trim();
      body = body.slice(subtitleMatch[0].length).trim();
    } else if (body.startsWith('**') && !title) {
      // Just a bold title
      const boldMatch = body.match(/^\*\*(.+?)\*\*/);
      if (boldMatch) {
        title = boldMatch[1].trim();
        body = body.slice(boldMatch[0].length).trim();
        // Check for subtitle after
        const subAfter = body.match(/^—\s*\*(.+?)\*/);
        if (subAfter) {
          subtitle = subAfter[1].trim();
          body = body.slice(subAfter[0].length).trim();
        }
      }
    }

    // Skip empty sections or title-only headers like "# Análise Filosófica..."
    if (!body && !title) continue;
    // Skip the main title line (h1)
    if (trimmed.startsWith('# ') && !body) continue;

    // Detect section type
    let type = 'philosopher';
    const titleLower = (title || '').toLowerCase();
    if (titleLower.includes('verdict') || titleLower.includes('veredicto') || titleLower.includes('veredito') || titleLower.includes('verdicto')) {
      type = 'verdict';
    } else if (titleLower.includes('provoca') || titleLower.includes('paradox')) {
      type = 'provocation';
    } else if (titleLower.includes('acordo') || titleLower.includes('conflito') || titleLower.includes('agreement') || titleLower.includes('conflict') || titleLower.includes('pontos de')) {
      type = 'conflict';
    } else if (titleLower.includes('secção') || titleLower.includes('section') || titleLower.includes('seção')) {
      // Section headers like "Secção 1 — Perspectivas..." — keep as-is but no special type
      type = 'section-header';
    }

    sections.push({ title, subtitle, body, type });
  }

  return sections;
}

function renderBody(text) {
  if (!text) return '';
  return DOMPurify.sanitize(
    text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br/>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>')
  );
}

export default function PanelAnalysisCards({ analysis }) {
  const sections = parsePanelSections(analysis);

  if (sections.length === 0) {
    // Fallback: render as single card
    return (
      <div className="panel-analysis">
        <div className="panel-analysis__section">
          <div
            className="panel-analysis__section-body"
            dangerouslySetInnerHTML={{ __html: renderBody(analysis) }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="panel-analysis">
      {sections.map((section, i) => {
        // Section headers just become titles without their own card
        if (section.type === 'section-header' && !section.body) {
          return null;
        }

        const className = [
          'panel-analysis__section',
          section.type === 'verdict' && 'panel-analysis__section--verdict',
          section.type === 'provocation' && 'panel-analysis__section--provocation',
        ].filter(Boolean).join(' ');

        return (
          <div key={i} className={className}>
            {section.title && (
              <h3 className="panel-analysis__section-title">{section.title}</h3>
            )}
            {section.subtitle && (
              <p className="panel-analysis__section-subtitle">{section.subtitle}</p>
            )}
            {section.body && (
              <div
                className="panel-analysis__section-body"
                dangerouslySetInnerHTML={{ __html: renderBody(section.body) }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
