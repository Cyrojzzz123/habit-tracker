export function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const val = row[header];
          const escaped = String(val).replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(",")
    ),
  ];

  const csvContent = csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function exportAllData() {
  const [habitsRes, entriesRes, assignmentsRes, errandsRes] = await Promise.all([
    fetch("/api/habits?archived=true"),
    fetch("/api/entries?from=2020-01-01&to=2099-12-31"),
    fetch("/api/assignments?archived=true"),
    fetch("/api/errands?archived=true"),
  ]);

  const habits = await habitsRes.json();
  const entries = await entriesRes.json();
  const assignments = await assignmentsRes.json();
  const errands = await errandsRes.json();

  // Export habits
  exportToCSV(
    habits.map((h: Record<string, unknown>) => ({
      name: h.name,
      icon: h.icon,
      color: h.color,
      days: h.days,
      startTime: h.startTime || "",
      endTime: h.endTime || "",
      archived: h.archived,
    })),
    "habits"
  );

  // Export entries
  setTimeout(() => {
    exportToCSV(
      entries.map((e: Record<string, unknown>) => ({
        habitId: e.habitId,
        date: e.date,
        completed: e.completed,
        note: e.note || "",
      })),
      "entries"
    );
  }, 500);

  // Export assignments
  setTimeout(() => {
    exportToCSV(
      assignments.map((a: Record<string, unknown>) => ({
        name: a.name,
        icon: a.icon,
        startDate: a.startDate,
        dueDate: a.dueDate,
        completed: a.completed,
        note: a.note || "",
      })),
      "assignments"
    );
  }, 1000);

  // Export errands
  setTimeout(() => {
    exportToCSV(
      errands.map((e: Record<string, unknown>) => ({
        name: e.name,
        icon: e.icon,
        date: e.date,
        time: e.time || "",
        completed: e.completed,
        note: e.note || "",
      })),
      "errands"
    );
  }, 1500);
}
