export default function ConfigPage() {
  return (
    <div className="card single-card">
      <p className="section-label">Configuracion</p>
      <h3>Estado de los servicios</h3>
      <ul className="status-list">
        <li><strong>Frontend:</strong> React + TypeScript servido por Nginx</li>
        <li><strong>API:</strong> FastAPI detras de /api</li>
        <li><strong>Tasks:</strong> CRUD y endpoint Gantt disponibles</li>
        <li><strong>Ollama:</strong> Integrado por el endpoint /api/analyze-system</li>
      </ul>
    </div>
  );
}
