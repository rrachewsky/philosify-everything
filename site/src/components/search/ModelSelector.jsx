// ModelSelector - AI model selection with custom dropdown and hover tooltips
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AI_MODELS, AI_MODEL_DISPLAY_NAMES } from '@/utils/constants';

// Full version names for tooltip display
const AI_MODEL_VERSIONS = {
  [AI_MODELS.CLAUDE]: 'Claude Opus 4.5',
  [AI_MODELS.OPENAI]: 'GPT-4.1',
  [AI_MODELS.GEMINI]: 'Gemini 3 Flash',
  [AI_MODELS.GROK]: 'Grok 4.1 Fast',
  [AI_MODELS.DEEPSEEK]: 'DeepSeek V3.2',
};

export function ModelSelector({ value, onChange }) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (modelValue) => {
    onChange(modelValue);
    setIsOpen(false);
  };

  const displayText = value ? AI_MODEL_DISPLAY_NAMES[value] : t('search.selectModel');

  return (
    <div className="model-selector-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className="model-selector"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        {displayText}
        <span className="model-selector-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="model-dropdown">
          {Object.entries(AI_MODELS).map(([, modelValue]) => (
            <div
              key={modelValue}
              className={`model-option ${value === modelValue ? 'selected' : ''}`}
              onClick={() => handleSelect(modelValue)}
            >
              {AI_MODEL_DISPLAY_NAMES[modelValue]}
              <span className="model-tooltip">{AI_MODEL_VERSIONS[modelValue]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ModelSelector;
