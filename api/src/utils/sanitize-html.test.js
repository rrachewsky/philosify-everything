// ============================================================
// SECURITY TESTS - Server-side HTML Sanitization
// ============================================================

import { describe, it, expect } from 'vitest';
import { stripHtml, sanitizeMessage } from './sanitize-html.js';

describe('stripHtml', () => {
  it('should return plain text unchanged', () => {
    expect(stripHtml('Hello world')).toBe('Hello world');
  });

  it('should strip HTML tags', () => {
    expect(stripHtml('<b>bold</b>')).toBe('bold');
    expect(stripHtml('<p>paragraph</p>')).toBe('paragraph');
  });

  it('should remove script tags and content', () => {
    expect(stripHtml('<script>alert("xss")</script>')).toBe('');
    expect(stripHtml('before<script>evil()</script>after')).toBe('beforeafter');
  });

  it('should remove style tags and content', () => {
    expect(stripHtml('<style>body{display:none}</style>text')).toBe('text');
  });

  it('should remove iframe tags', () => {
    expect(stripHtml('<iframe src="evil.com"></iframe>')).toBe('');
  });

  it('should handle nested tags', () => {
    expect(stripHtml('<div><span>text</span></div>')).toBe('text');
  });

  it('should decode HTML entities', () => {
    expect(stripHtml('a &amp; b')).toBe('a & b');
    expect(stripHtml('&lt;script&gt;')).toBe('');
  });

  it('should handle entity-encoded attack vectors', () => {
    // After decoding &lt;script&gt; becomes <script> which gets stripped
    const result = stripHtml('test &lt;script&gt;alert(1)&lt;/script&gt; end');
    expect(result).not.toContain('script');
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
  });

  it('should remove HTML comments', () => {
    expect(stripHtml('before<!-- hidden -->after')).toBe('beforeafter');
  });

  it('should handle null and non-string input', () => {
    expect(stripHtml(null)).toBeNull();
    expect(stripHtml(undefined)).toBeUndefined();
    expect(stripHtml(123)).toBe(123);
    expect(stripHtml('')).toBe('');
  });

  it('should collapse excessive whitespace', () => {
    expect(stripHtml('a   b   c')).toBe('a b c');
  });

  it('should remove form elements', () => {
    expect(stripHtml('<form action="/steal"><input type="text"></form>')).toBe('');
  });
});

describe('sanitizeMessage', () => {
  it('should preserve plain text', () => {
    expect(sanitizeMessage('Hello, how are you?')).toBe('Hello, how are you?');
  });

  it('should remove script tags', () => {
    expect(sanitizeMessage('Hey <script>steal()</script> there')).toBe('Hey  there');
  });

  it('should remove event handlers', () => {
    expect(sanitizeMessage('<img onerror="alert(1)" src=x>')).not.toContain('onerror');
    expect(sanitizeMessage('<div onclick="evil()">click</div>')).not.toContain('onclick');
  });

  it('should remove javascript: protocol', () => {
    expect(sanitizeMessage('<a href="javascript:alert(1)">click</a>')).not.toContain('javascript');
  });

  it('should remove data:text/html URIs', () => {
    expect(sanitizeMessage('<a href="data:text/html,<script>alert(1)</script>">x</a>')).not.toContain('data:text/html');
  });

  it('should strip all HTML tags', () => {
    const result = sanitizeMessage('<b>bold</b> and <i>italic</i>');
    expect(result).toBe('bold and italic');
  });

  it('should handle null and non-string input', () => {
    expect(sanitizeMessage(null)).toBeNull();
    expect(sanitizeMessage(undefined)).toBeUndefined();
  });

  it('should handle real-world XSS vectors', () => {
    // SVG-based XSS
    expect(sanitizeMessage('<svg onload=alert(1)>')).not.toContain('onload');
    // IMG tag XSS
    expect(sanitizeMessage('<img src=x onerror=alert(1)//')).not.toContain('onerror');
    // Body onload
    expect(sanitizeMessage('<body onload=alert(1)>')).not.toContain('onload');
  });
});
