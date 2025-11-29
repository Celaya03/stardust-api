const API_URL = "https://stardust-api-8rnp.onrender.com";

export async function apiGet(path) {
  const res = await fetch(`${API_URL}${path}`);
  return res.json();
}

export async function apiPost(path, data) {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}
