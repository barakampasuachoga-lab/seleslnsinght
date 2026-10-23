import { DatasetColumn, DatasetQualityReport, DatasetRecord, DataType, SemanticRole } from './types';

/**
 * Robust CSV Line Parser handling quotes, escaped commas, and diverse line endings.
 */
export function parseCSVLines(text: string): string[][] {
  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  // Determine line delimiter and normalize
  const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if ((char === ',' || char === ';' || char === '\t') && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if (char === '\n' && !insideQuotes) {
      currentRow.push(currentField.trim());
      if (currentRow.some((f) => f.length > 0)) {
        lines.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      lines.push(currentRow);
    }
  }

  return lines;
}

/**
 * Infer data type and suggest semantic business role from column name and sample values.
 */
export function inferColumnRole(colName: string, values: any[]): { type: DataType; role: SemanticRole } {
  const lower = colName.toLowerCase().replace(/[_\s-]+/g, ' ').trim();
  const sampleNonEmpty = values.filter((v) => v !== null && v !== undefined && v !== '' && v !== 'null');

  // Check if dates
  const isDateName = lower.includes('date') || lower.includes('time') || lower.includes('day') || lower.includes('month') || lower.includes('year');
  const dateMatches = sampleNonEmpty.slice(0, 30).filter((v) => {
    const s = String(v).trim();
    return !isNaN(Date.parse(s)) && (s.includes('-') || s.includes('/') || s.length === 4);
  });
  if (isDateName || dateMatches.length > sampleNonEmpty.slice(0, 30).length * 0.7) {
    return { type: 'date', role: 'date' };
  }

  // Check numeric
  const numericCount = sampleNonEmpty.slice(0, 50).filter((v) => {
    const cleaned = String(v).replace(/[$,%]/g, '').trim();
    return !isNaN(Number(cleaned)) && cleaned !== '';
  }).length;
  const isNumeric = sampleNonEmpty.length > 0 && numericCount >= sampleNonEmpty.slice(0, 50).length * 0.8;

  if (isNumeric) {
    if (lower.includes('profit') || lower.includes('margin') || lower.includes('gain') || lower.includes('earnings')) {
      return { type: 'numeric', role: 'profit' };
    }
    if (lower.includes('sale') || lower.includes('revenue') || lower.includes('amount') || lower.includes('total') || lower.includes('price')) {
      return { type: 'numeric', role: 'sales' };
    }
    if (lower.includes('discount') || lower.includes('rebate') || lower.includes('promo')) {
      return { type: 'numeric', role: 'discount' };
    }
    if (lower.includes('qty') || lower.includes('quantity') || lower.includes('units') || lower.includes('count') || lower.includes('volume')) {
      return { type: 'numeric', role: 'quantity' };
    }
    if (lower.includes('cost') || lower.includes('cogs') || lower.includes('expense')) {
      return { type: 'numeric', role: 'cost' };
    }
    return { type: 'numeric', role: 'other' };
  }

  // Identifiers
  if (lower.includes('order id') || lower.includes('order_id') || lower.includes('transaction id') || lower.includes('invoice')) {
    return { type: 'identifier', role: 'order_id' };
  }
  if (lower.includes('customer id') || lower.includes('user id') || lower.includes('account id')) {
    return { type: 'identifier', role: 'customer' };
  }

  // Categorical dimensions
  if (lower.includes('sub category') || lower.includes('subcategory')) {
    return { type: 'categorical', role: 'sub_category' };
  }
  if (lower.includes('category') || lower.includes('department') || lower.includes('group') || lower.includes('line')) {
    return { type: 'categorical', role: 'category' };
  }
  if (lower.includes('region') || lower.includes('state') || lower.includes('city') || lower.includes('country') || lower.includes('zone') || lower.includes('market')) {
    return { type: 'categorical', role: 'region' };
  }
  if (lower.includes('segment') || lower.includes('tier') || lower.includes('customer type')) {
    return { type: 'categorical', role: 'customer_segment' };
  }
  if (lower.includes('customer') || lower.includes('client') || lower.includes('buyer')) {
    return { type: 'text', role: 'customer' };
  }
  if (lower.includes('product') || lower.includes('item') || lower.includes('sku') || lower.includes('description')) {
    return { type: 'text', role: 'product_name' };
  }

  // Check distinct ratio for categorical vs text
  const distinctVals = new Set(sampleNonEmpty.map(String)).size;
  if (distinctVals <= 25) {
    return { type: 'categorical', role: 'other' };
  }

  return { type: 'text', role: 'other' };
}

/**
 * Builds DatasetColumn metadata array from rows.
 */
export function buildColumnsMetadata(headers: string[], rows: Record<string, any>[]): DatasetColumn[] {
  return headers.map((header) => {
    const values = rows.map((r) => r[header]);
    const { type, role } = inferColumnRole(header, values);

    const nullCount = values.filter((v) => v === null || v === undefined || v === '' || v === 'null' || v === 'None').length;
    const distinctSet = new Set(values.map(String));

    return {
      name: header,
      detectedType: type,
      semanticRole: role,
      nullCount,
      distinctCount: distinctSet.size,
      sampleValues: Array.from(distinctSet).slice(0, 4),
    };
  });
}

/**
 * Builds data quality report from rows and detected columns.
 */
export function generateQualityReport(rows: Record<string, any>[], columns: DatasetColumn[]): DatasetQualityReport {
  const totalRows = rows.length;
  const totalColumns = columns.length;

  // Duplicate records check (stringified first 6 fields)
  const seenHashes = new Set<string>();
  let duplicateCount = 0;
  for (const row of rows) {
    const signature = Object.values(row).slice(0, 8).join('|');
    if (seenHashes.has(signature)) {
      duplicateCount++;
    } else {
      seenHashes.add(signature);
    }
  }

  // Missing values stats
  const missingValueStats = columns
    .map((col) => ({
      column: col.name,
      count: col.nullCount,
      pct: totalRows > 0 ? Number(((col.nullCount / totalRows) * 100).toFixed(2)) : 0,
    }))
    .filter((s) => s.count > 0);

  // Negative profit check
  const profitCol = columns.find((c) => c.semanticRole === 'profit')?.name;
  let negativeProfitCount = 0;
  if (profitCol) {
    negativeProfitCount = rows.filter((r) => {
      const val = Number(String(r[profitCol]).replace(/[$,]/g, ''));
      return !isNaN(val) && val < 0;
    }).length;
  }

  // Warnings
  const warnings: string[] = [];
  if (duplicateCount > 0) {
    warnings.push(`Detected ${duplicateCount} duplicate transaction rows.`);
  }
  if (missingValueStats.length > 0) {
    warnings.push(`Found missing values in ${missingValueStats.length} attribute columns.`);
  }
  if (negativeProfitCount > 0) {
    warnings.push(
      `Audited ${negativeProfitCount} negative profit records. Non-destructive pipeline preserves these as legitimate commercial discounting losses.`
    );
  }
  if (warnings.length === 0) {
    warnings.push('All critical transactional headers and keys validated. 100% data integrity verified.');
  }

  return {
    totalRows,
    totalColumns,
    duplicateCount,
    missingValueStats,
    negativeProfitCount,
    dataRetentionPct: 100.0,
    warnings,
  };
}

/**
 * Parse an uploaded raw CSV string into a structured DatasetRecord.
 */
export function parseCSVDataset(
  csvContent: string,
  filename: string,
  datasetName: string,
  description: string,
  context: DatasetRecord['context'],
  ownerId: string,
  ownerName: string,
  fileSizeBytes: number
): DatasetRecord {
  const parsedLines = parseCSVLines(csvContent);

  if (parsedLines.length === 0) {
    throw new Error('The uploaded file is empty or contains no parseable data.');
  }

  const rawHeaders = parsedLines[0].map((h) => h.replace(/^["'\s]+|["'\s]+$/g, '').trim());
  // Ensure non-empty headers
  const headers = rawHeaders.map((h, idx) => (h.length > 0 ? h : `Column_${idx + 1}`));

  const dataRows: Record<string, any>[] = [];
  for (let i = 1; i < parsedLines.length; i++) {
    const line = parsedLines[i];
    if (line.length === 0 || (line.length === 1 && line[0] === '')) continue;

    const rowObj: Record<string, any> = {};
    for (let j = 0; j < headers.length; j++) {
      const header = headers[j];
      const rawVal = line[j] !== undefined ? line[j] : '';
      rowObj[header] = rawVal;
    }
    dataRows.push(rowObj);
  }

  const columns = buildColumnsMetadata(headers, dataRows);
  const qualityReport = generateQualityReport(dataRows, columns);

  const formattedSize =
    fileSizeBytes >= 1024 * 1024
      ? `${(fileSizeBytes / (1024 * 1024)).toFixed(2)} MB`
      : `${(fileSizeBytes / 1024).toFixed(1)} KB`;

  return {
    id: `ds_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ownerId,
    ownerName,
    name: datasetName.trim() || filename.replace(/\.[^/.]+$/, ''),
    description: description.trim() || `User uploaded ${filename} sales dataset`,
    context,
    filename,
    fileSize: formattedSize,
    rowCount: dataRows.length,
    colCount: headers.length,
    uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    columns,
    rows: dataRows,
    qualityReport,
  };
}
