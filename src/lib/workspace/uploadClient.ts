const MAX_BYTES = 5 * 1024 * 1024;

export async function uploadWorkspaceFile(file: File) {
  if (file.size > MAX_BYTES) {
    throw new Error("File is larger than 5MB");
  }
  const res = await fetch("/api/workspace/files", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: file.name, size: file.size, type: file.type }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    path?: string;
    token?: string;
    url?: string;
    name?: string;
  };
  if (!res.ok || !data.path || !data.token || !data.url) {
    throw new Error(data.error || "upload");
  }
  const { createBrowserSupabase } = await import("@/lib/supabase/browser");
  const supabase = createBrowserSupabase();
  const { error } = await supabase.storage.from("workspace").uploadToSignedUrl(data.path, data.token, file, {
    contentType: file.type || "application/octet-stream",
  });
  if (error) throw error;
  return { url: data.url, name: data.name || file.name };
}
