export function cleanDescription(value: string) {
  return decodeDisplayEntities(value)
    .replace(/<\s*(br|\/p|\/li|\/h[1-6]|\/div)\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function decodeDisplayEntities(value: string) {
  let decoded = value;

  for (let index = 0; index < 3; index += 1) {
    const next = decoded.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ");

    if (next === decoded) return next;
    decoded = next;
  }

  return decoded;
}

export function formatExperience(value: string) {
  const labels: Record<string, string> = {
    ENTRY: "Entry",
    JUNIOR: "Junior",
    MID: "Mid-level",
    SENIOR: "Senior",
    LEAD: "Lead",
    EXECUTIVE: "Executive",
    UNKNOWN: "Any level",
  };

  return labels[value] ?? value;
}

export function formatSalary(min?: number | null, max?: number | null, currency?: string | null) {
  if (!min && !max) return null;
  const safeCurrency = currency ?? "INR";
  const formatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: safeCurrency,
    maximumFractionDigits: 0,
  });

  if (min && max) return `${formatter.format(min)} - ${formatter.format(max)}`;
  return formatter.format(min ?? max ?? 0);
}

export function formatFreshness(value: string) {
  const lastSeenAt = new Date(value);

  if (Number.isNaN(lastSeenAt.getTime())) return "Freshness unknown";

  const elapsedDays = Math.floor((Date.now() - lastSeenAt.getTime()) / 86_400_000);

  if (elapsedDays <= 0) return "Seen today";
  if (elapsedDays === 1) return "Seen yesterday";
  if (elapsedDays < 14) return `Seen ${elapsedDays} days ago`;

  return "Stale check pending";
}

export function formatDateTime(value?: string | null) {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
