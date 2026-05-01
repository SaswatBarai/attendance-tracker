'use client';

import { useState, useRef } from 'react';

export interface ParsedStudent {
  name: string;
  email: string;
  regno: string;
  shift: 'MORNING' | 'AFTERNOON';
}

interface CSVUploaderProps {
  onParsed: (students: ParsedStudent[]) => void;
}

function parseCSV(text: string): { rows: ParsedStudent[]; errors: string[] } {
  const lines = text
    .trim()
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return { rows: [], errors: ['CSV must have a header row and at least one data row'] };
  }

  const errors: string[] = [];
  const rows: ParsedStudent[] = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i]!.split(',').map((p) => p.trim());
    const [name, email, regno, shift] = parts;

    if (!name || !email || !regno || !shift) {
      errors.push(`Row ${i + 1}: missing required fields`);
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

export function CSVUploader({ onParsed }: CSVUploaderProps) {
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<ParsedStudent[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function processFile(file: File) {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setParseErrors(['Please upload a .csv file']);
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { rows, errors } = parseCSV(text);
      setPreview(rows);
      setParseErrors(errors);
      if (rows.length > 0) onParsed(rows);
    };
    reader.readAsText(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  return (
    <div className="space-y-4">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
          dragging
            ? 'border-[#FF6B00] bg-[#FF6B00]/5'
            : 'border-[#E5E7EB] hover:border-[#FF6B00]/40 hover:bg-[#FAFAFA]'
        }`}
      >
        <p className="text-3xl mb-2">📄</p>
        {fileName ? (
          <p className="text-sm font-medium text-[#374151]">{fileName}</p>
        ) : (
          <>
            <p className="text-sm font-medium text-[#374151]">Drop CSV here or click to browse</p>
            <p className="text-xs text-[#9CA3AF] mt-1">Format: Name, Email, Regno, Shift</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          onChange={handleChange}
          className="hidden"
        />
      </div>

      {parseErrors.length > 0 && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 space-y-1">
          {parseErrors.map((err, i) => (
            <p key={i} className="text-xs text-red-600">
              {err}
            </p>
          ))}
        </div>
      )}

      {preview.length > 0 && (
        <div>
          <p className="text-sm font-medium text-[#374151] mb-2">
            Preview — {preview.length} student{preview.length > 1 ? 's' : ''} found
          </p>
          <div className="overflow-x-auto rounded-xl border border-[#E5E7EB] max-h-56 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-[#F9FAFB]">
                <tr className="text-[#6B7280] uppercase tracking-wider">
                  <th className="px-3 py-2 text-left font-medium">Name</th>
                  <th className="px-3 py-2 text-left font-medium">Email</th>
                  <th className="px-3 py-2 text-left font-medium">Reg. No</th>
                  <th className="px-3 py-2 text-left font-medium">Shift</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {preview.map((s, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 text-[#121212]">{s.name}</td>
                    <td className="px-3 py-2 text-[#6B7280]">{s.email}</td>
                    <td className="px-3 py-2 font-mono">{s.regno}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                          s.shift === 'MORNING'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-indigo-100 text-indigo-700'
                        }`}
                      >
                        {s.shift}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
