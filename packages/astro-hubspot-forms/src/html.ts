const EMPTY_PARAGRAPH = /<p\b[^>]*>(?:\s|&nbsp;|&#160;|<br\s*\/?>)*<\/p>/gi;
const LEADING_BREAKS = /(<p\b[^>]*>)(?:\s|<br\s*\/?>)+/gi;
const TRAILING_BREAKS = /(?:\s|<br\s*\/?>)+(<\/p>)/gi;

/**
 * Removes the spacing HubSpot's rich text editor leaves behind: empty paragraphs (`<p>&nbsp;</p>`)
 * and line breaks at the start or end of a paragraph (`<p><br>Text`). Spacing is left to the
 * site's CSS. Inline styles and other markup are kept.
 */
export function tidyRichText(html: string): string {
  return html.replace(EMPTY_PARAGRAPH, '').replace(LEADING_BREAKS, '$1').replace(TRAILING_BREAKS, '$1').trim();
}
