export function jsonOutput(data: unknown): void {
  console.log(JSON.stringify({ success: true, data, error: null }));
}

export function tableOutput(data: unknown[], columns: string[]): void {
  if (!data || data.length === 0) {
    console.log("No data");
    return;
  }

  const colWidths: Record<string, number> = {};
  columns.forEach(col => { colWidths[col] = col.length; });

  data.forEach((row: unknown) => {
    const r = row as Record<string, unknown>;
    columns.forEach(col => {
      const val = String(r[col] ?? "");
      if (val.length > colWidths[col]) colWidths[col] = Math.min(val.length, 50);
    });
  });

  const header = columns.map(col => col.padEnd(colWidths[col])).join("  ");
  console.log(header);
  console.log(columns.map(col => "=".repeat(colWidths[col])).join("  "));

  data.forEach((row: unknown) => {
    const r = row as Record<string, unknown>;
    const line = columns.map(col => {
      const val = String(r[col] ?? "");
      return val.length > colWidths[col] ? val.slice(0, colWidths[col] - 3) + "..." : val.padEnd(colWidths[col]);
    }).join("  ");
    console.log(line);
  });

  console.log(`\n${data.length} item(s)`);
}

export function printItem(item: Record<string, unknown>, fields: string[]): void {
  fields.forEach(field => {
    const val = item[field];
    if (val !== undefined) {
      if (typeof val === "object") {
        console.log(`${field}:`);
        console.log(JSON.stringify(val, null, 2));
      } else {
        console.log(`${field}: ${val}`);
      }
    }
  });
}

export function printError(message: string, jsonMode: boolean): void {
  if (jsonMode) {
    console.log(JSON.stringify({ success: false, data: null, error: message }));
  } else {
    console.error(message);
  }
}
