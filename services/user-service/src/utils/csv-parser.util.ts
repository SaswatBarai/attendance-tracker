export interface StudentCSVRow {
  name: string;
  email: string;
  regno: string;
  shift: 'MORNING' | 'AFTERNOON';
}

export interface CSVParseResult {
  rows: StudentCSVRow[];
  errors: string[];
}

export function parseStudentCSV(csvText: string): CSVParseResult {
  const lines = csvText
    .trim()
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return { rows: [], errors: ['CSV must have a header row and at least one data row'] };
  }

  const errors: string[] = [];
  const rows: StudentCSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i]!.split(',').map((p) => p.trim());
    const [name, email, regno, shift] = parts;

    if (!name || !email || !regno || !shift) {
      errors.push(`Row ${i + 1}: missing required fields (Name, Email, Regno, Shift)`);
      continue;
    }

    const normalizedShift = shift.toUpperCase();
    if (normalizedShift !== 'MORNING' && normalizedShift !== 'AFTERNOON') {
      errors.push(`Row ${i + 1}: shift must be MORNING or AFTERNOON, got "${shift}"`);
      continue;
    }

    rows.push({ name, email, regno, shift: normalizedShift as 'MORNING' | 'AFTERNOON' });
  }

  return { rows, errors };
}
