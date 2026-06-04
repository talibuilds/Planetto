/**
 * OCR Table Reconstruction Utility
 * 
 * Takes ML Kit text recognition results (with bounding boxes)
 * and reconstructs a structured table by grouping text by position.
 */

const ROW_TOLERANCE = 20; // pixels — lines within this Y-distance are same row

/**
 * Reconstructs table text from ML Kit OCR blocks using bounding box positions.
 * Groups text lines by Y-coordinate (rows), sorts by X-coordinate (columns).
 * 
 * @param {Object} result - ML Kit TextRecognitionResult
 * @returns {string} Reconstructed table as text with rows and columns
 */
export function reconstructTableFromOCR(result) {
  if (!result || !result.blocks || result.blocks.length === 0) {
    return result?.text || '';
  }

  // Collect all lines with their bounding boxes
  const lines = [];

  for (const block of result.blocks) {
    if (block.lines && block.lines.length > 0) {
      for (const line of block.lines) {
        const frame = line.frame || line.boundingBox || {};
        lines.push({
          text: (line.text || '').trim(),
          x: frame.x ?? frame.left ?? 0,
          y: frame.y ?? frame.top ?? 0,
          width: frame.width ?? 0,
          height: frame.height ?? 0,
        });
      }
    } else {
      // Fallback: block-level text only
      const frame = block.frame || block.boundingBox || {};
      lines.push({
        text: (block.text || '').trim(),
        x: frame.x ?? frame.left ?? 0,
        y: frame.y ?? frame.top ?? 0,
        width: frame.width ?? 0,
        height: frame.height ?? 0,
      });
    }
  }

  if (lines.length === 0) return '';

  // Filter out empty lines
  const validLines = lines.filter(l => l.text.length > 0);
  if (validLines.length === 0) return '';

  // Sort by Y position (top to bottom)
  validLines.sort((a, b) => a.y - b.y);

  // Group into rows based on Y proximity
  const rows = [];
  let currentRow = [validLines[0]];

  for (let i = 1; i < validLines.length; i++) {
    const avgY = currentRow.reduce((sum, el) => sum + el.y, 0) / currentRow.length;
    if (Math.abs(validLines[i].y - avgY) <= ROW_TOLERANCE) {
      currentRow.push(validLines[i]);
    } else {
      rows.push([...currentRow]);
      currentRow = [validLines[i]];
    }
  }
  rows.push(currentRow);

  // Sort each row by X position (left to right) and join with separator
  const tableText = rows.map(row => {
    row.sort((a, b) => a.x - b.x);
    return row.map(el => el.text).join(' | ');
  }).join('\n');

  return tableText;
}

/**
 * Extracts just the raw full text from OCR results (fallback).
 * @param {Object} result - ML Kit TextRecognitionResult
 * @returns {string} Raw text
 */
export function getRawText(result) {
  if (!result) return '';
  if (result.text) return result.text;
  if (result.blocks) {
    return result.blocks.map(b => b.text || '').join('\n');
  }
  return '';
}
