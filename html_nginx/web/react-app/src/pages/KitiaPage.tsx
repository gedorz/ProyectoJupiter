import { FormEvent, useState } from "react";
import { analyzeWithSystemPrompt } from "../api";

const quickPrompts = ["hola", "resume este texto", "analiza este producto"]; 

function normalizeAiText(payload: unknown): string {
  if (payload && typeof payload === "object" && "response" in payload) {
    const value = (payload as { response?: unknown }).response;
    return typeof value === "string" ? value : JSON.stringify(value, null, 2);
  }

  if (typeof payload === "string") {
    return payload;
  }

  return JSON.stringify(payload, null, 2);
}

export default function IAjupiterPage() {
  const [prompt, setPrompt] = useState("hola");
  const [status, setStatus] = useState("Listo para consultar");
  const [isLoading, setIsLoading] = useState(false);
  const [output, setOutput] = useState("Aqui aparecera la respuesta del modelo.");

  const runPrompt = async (nextPrompt: string) => {
    const safePrompt = nextPrompt.trim();
    if (!safePrompt) {
      setStatus("Debes escribir un prompt valido.");
      return;
    }

    setIsLoading(true);
    setStatus("Consultando a IAjupiter en /api/analyze-system ...");
    setOutput("Cargando respuesta...");

    try {
      const response = await analyzeWithSystemPrompt(safePrompt);
      setOutput(normalizeAiText(response));
      setStatus("Respuesta recibida correctamente.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      setOutput(message);
      setStatus("Fallo la consulta.");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await runPrompt(prompt);
  };

  return (
    <div className="grid two-columns">
      <article className="card">
        <p className="section-label">Interacción con IAjupiter V01</p>
        <h3>Conector a Ollama DeepSeek</h3>
        <p className="muted">Para comunicarte con IAjupiter, utiliza los prompts rápidos o escribe tu propio prompt.</p>

        <form className="stack" onSubmit={onSubmit}>
          <label className="field-label" htmlFor="prompt-input">Prompt</label>
          <input
            id="prompt-input"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Escribe la pregunta que quieras enviar"
            required
          />

          <button className="primary-btn" disabled={isLoading} type="submit">
            {isLoading ? "Consultando..." : "Consultar a IAjupiter"}
          </button>
        </form>

        <div className="quick-row">
          {quickPrompts.map((item) => (
            <button
              className="chip-btn"
              disabled={isLoading}
              key={item}
              onClick={() => {
                setPrompt(item);
                void runPrompt(item);
              }}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>

        <p className="status-line">{status}</p>
      </article>

      <article className="card">
        <p className="section-label">Respuesta</p>
        <h3>Salida del modelo</h3>
        <pre>{output}</pre>
      </article>
    </div>
  );
}
