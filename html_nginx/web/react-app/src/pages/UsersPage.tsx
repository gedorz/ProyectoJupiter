import { type FormEvent, useCallback, useEffect, useState } from "react";
import { createUser, deleteUser, fetchUsers, updateUser } from "../api";
import type { User, UserCreatePayload, UserUpdatePayload } from "../types";

type EditorState = {
  id?: number;
  nombre: string;
  apellido: string;
  email: string;
  descripcion: string;
  password: string;
  status: number;
  startline: string;
  deadline: string;
};

const emptyEditor: EditorState = {
  nombre: "",
  apellido: "",
  email: "",
  descripcion: "",
  password: "",
  status: 1,
  startline: "",
  deadline: "",
};

function toInputDate(raw?: string | null): string {
  if (!raw) return "";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function formatDisplayDate(raw?: string | null): string {
  if (!raw) return "-";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("es-ES");
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editor, setEditor] = useState<EditorState>(emptyEditor);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los usuarios");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const openCreate = () => {
    setEditor(emptyEditor);
    setError("");
    setShowModal(true);
  };

  const openEdit = (user: User) => {
    setEditor({
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      descripcion: user.descripcion,
      password: user.password,
      status: user.status,
      startline: toInputDate(user.startline),
      deadline: toInputDate(user.deadline),
    });
    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditor(emptyEditor);
    setError("");
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (
      !editor.nombre.trim() ||
      !editor.apellido.trim() ||
      !editor.email.trim() ||
      !editor.descripcion.trim() ||
      !editor.password.trim()
    ) {
      setError("Por favor completa todos los campos obligatorios.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      if (editor.id) {
        const payload: UserUpdatePayload = {
          nombre: editor.nombre.trim(),
          apellido: editor.apellido.trim(),
          email: editor.email.trim(),
          descripcion: editor.descripcion.trim(),
          password: editor.password.trim(),
          status: editor.status,
          startline: editor.startline || null,
          deadline: editor.deadline || null,
        };
        await updateUser(editor.id, payload);
      } else {
        const payload: UserCreatePayload = {
          nombre: editor.nombre.trim(),
          apellido: editor.apellido.trim(),
          email: editor.email.trim(),
          descripcion: editor.descripcion.trim(),
          password: editor.password.trim(),
          status: editor.status,
          startline: editor.startline || null,
          deadline: editor.deadline || null,
        };
        await createUser(payload);
      }
      await loadUsers();
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el usuario");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: number, nombre: string) => {
    if (!window.confirm(`¿Borrar a ${nombre}?`)) return;
    try {
      await deleteUser(id);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo borrar el usuario");
    }
  };

  return (
    <div className="users-page">
      <div className="users-toolbar">
        <p className="section-label">Gestión de Usuarios</p>
        <button className="primary-btn" onClick={openCreate} type="button">
          + Nuevo usuario
        </button>
        {error && <p className="error-line" style={{ margin: 0 }}>{error}</p>}
      </div>

      {loading ? (
        <p className="muted">Cargando usuarios…</p>
      ) : (
        <div className="users-table-wrapper">
          {users.length === 0 ? (
            <p className="muted" style={{ padding: "18px 14px" }}>
              No hay usuarios. Crea uno con "+ Nuevo usuario".
            </p>
          ) : (
            <table className="users-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Apellido</th>
                  <th>Email</th>
                  <th>Descripción</th>
                  <th>Estado</th>
                  <th>Fecha Inicio</th>
                  <th>Fecha Vencimiento</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.nombre}</td>
                    <td>{user.apellido}</td>
                    <td>{user.email}</td>
                    <td>{user.descripcion}</td>
                    <td>{user.status === 1 ? "Activo" : "Inactivo"}</td>
                    <td>{formatDisplayDate(user.startline)}</td>
                    <td>{formatDisplayDate(user.deadline)}</td>
                    <td className="actions-cell">
                      <button
                        className="chip-btn"
                        onClick={() => openEdit(user)}
                        title="Editar"
                        type="button"
                      >
                        ✏️
                      </button>
                      <button
                        className="chip-btn danger"
                        onClick={() => void onDelete(user.id, `${user.nombre} ${user.apellido}`)}
                        title="Borrar"
                        type="button"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showModal && (
        <div
          className="product-modal-overlay"
          onClick={closeModal}
          onKeyDown={(e) => {
            if (e.key === "Escape") closeModal();
          }}
          role="presentation"
        >
          <div
            className="product-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="product-modal-header">
              <h3>{editor.id ? `Editar usuario #${editor.id}` : "Nuevo usuario"}</h3>
              <button className="product-modal-close" onClick={closeModal} type="button">
                ✕
              </button>
            </div>

            {error && <p className="error-line">{error}</p>}

            <form className="stack" onSubmit={(e) => void onSubmit(e)}>
              <label className="field-label" htmlFor="nombre">
                Nombre
              </label>
              <input
                id="nombre"
                maxLength={100}
                onChange={(e) => setEditor((p) => ({ ...p, nombre: e.target.value }))}
                placeholder="Ej. Juan"
                required
                value={editor.nombre}
              />

              <label className="field-label" htmlFor="apellido">
                Apellido
              </label>
              <input
                id="apellido"
                maxLength={100}
                onChange={(e) => setEditor((p) => ({ ...p, apellido: e.target.value }))}
                placeholder="Ej. Pérez"
                required
                value={editor.apellido}
              />

              <label className="field-label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                maxLength={100}
                onChange={(e) => setEditor((p) => ({ ...p, email: e.target.value }))}
                placeholder="Ej. juan@ejemplo.com"
                required
                type="email"
                value={editor.email}
              />

              <label className="field-label" htmlFor="descripcion">
                Descripción
              </label>
              <textarea
                id="descripcion"
                maxLength={200}
                onChange={(e) => setEditor((p) => ({ ...p, descripcion: e.target.value }))}
                placeholder="Ej. Gerente de proyectos"
                required
                rows={2}
                value={editor.descripcion}
              />

              <label className="field-label" htmlFor="password">
                Contraseña
              </label>
              <input
                id="password"
                maxLength={100}
                minLength={6}
                onChange={(e) => setEditor((p) => ({ ...p, password: e.target.value }))}
                placeholder="Mínimo 6 caracteres"
                required
                type="password"
                value={editor.password}
              />

              <label className="field-label" htmlFor="status">
                Estado
              </label>
              <select
                id="status"
                onChange={(e) => setEditor((p) => ({ ...p, status: Number(e.target.value) }))}
                value={editor.status}
              >
                <option value="1">Activo</option>
                <option value="0">Inactivo</option>
              </select>

              <label className="field-label" htmlFor="startline">
                Fecha de inicio (opcional)
              </label>
              <input
                id="startline"
                onChange={(e) => setEditor((p) => ({ ...p, startline: e.target.value }))}
                type="date"
                value={editor.startline}
              />

              <label className="field-label" htmlFor="deadline">
                Fecha de vencimiento (opcional)
              </label>
              <input
                id="deadline"
                onChange={(e) => setEditor((p) => ({ ...p, deadline: e.target.value }))}
                type="date"
                value={editor.deadline}
              />

              <div className="actions-row">
                <button className="primary-btn" disabled={saving} type="submit">
                  {saving ? "Guardando…" : editor.id ? "Actualizar" : "Crear usuario"}
                </button>
                <button className="chip-btn" onClick={closeModal} type="button">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
