export async function askAI(question) {
  const response = await fetch("http://127.0.0.1:8000/ask-ai", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question }),
  });

  if (!response.ok) {
    let message = "Erreur serveur";
    try {
      const err = await response.json();
      message = err.detail || err.message || message;
    } catch (_) {}
    throw new Error(message);
  }

  const data = await response.json();
  return data.answer;
}