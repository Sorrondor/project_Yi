export type ArchiveEntry = {
  id: string;
  nickname: string;
  note: string;
  submittedAt: number;
};

const INBOX_KEY = "yi-sang-archive-inbox";
const PUBLISHED_IDS_KEY = "yi-sang-archive-published-ids";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    const v = JSON.parse(raw) as unknown;
    return v as T;
  } catch {
    return fallback;
  }
}

export function loadInbox(): ArchiveEntry[] {
  const list = safeParse<unknown>(localStorage.getItem(INBOX_KEY), []);
  return Array.isArray(list) ? (list as ArchiveEntry[]) : [];
}

export function saveInbox(entries: ArchiveEntry[]) {
  localStorage.setItem(INBOX_KEY, JSON.stringify(entries));
}

export function appendSubmission(nickname: string, note: string): string {
  const entries = loadInbox();
  const id =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `id-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  entries.push({
    id,
    nickname: nickname.trim() || "익명",
    note: note.trim(),
    submittedAt: Date.now(),
  });
  saveInbox(entries);
  return id;
}

export function loadPublishedIds(): string[] {
  const ids = safeParse<unknown>(localStorage.getItem(PUBLISHED_IDS_KEY), []);
  return Array.isArray(ids) ? (ids as string[]) : [];
}

export function savePublishedIds(ids: string[]) {
  localStorage.setItem(PUBLISHED_IDS_KEY, JSON.stringify(ids));
}

export function publishEntry(id: string) {
  const ids = loadPublishedIds();
  if (!ids.includes(id)) {
    ids.push(id);
    savePublishedIds(ids);
  }
}

export function unpublishEntry(id: string) {
  savePublishedIds(loadPublishedIds().filter((x) => x !== id));
}

export function deleteEntry(id: string) {
  saveInbox(loadInbox().filter((entry) => entry.id !== id));
  unpublishEntry(id);
}
