import { type CSSProperties, type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createTask, deleteTask, fetchTasksForGantt, fetchUsers, moveTask, updateTask } from "../api";
import type { Task, User } from "../types";

type EditorState = {
  id?: number;
  id_padre?: number | null;
  id_user?: number | null;
  titulo: string;
  contenido: string;
  startline: string;
  deadline: string;
  completada: boolean;
};

const emptyEditor: EditorState = {
  titulo: "",
  contenido: "",
  startline: "",
  deadline: "",
  completada: false,
  id_padre: null,
  id_user: null,
};

const CONTENT_PREVIEW_LENGTH = 80;
const TIMELINE_DAY_WIDTH_PX = 24;
const ONE_DAY_MS = 86_400_000;

function toInputDate(raw?: string | null): string {
  if (!raw) return "";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function asUnix(value?: string | null): number {
  if (!value) return Number.NaN;
  const ts = new Date(value).getTime();
  return Number.isNaN(ts) ? Number.NaN : ts;
}

function toDayStartTs(ts: number): number {
  const date = new Date(ts);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function getAllDescendantIds(tasks: Task[], parentId: number): Set<number> {
  const result = new Set<number>();
  const queue = [parentId];
  while (queue.length) {
    const id = queue.shift()!;
    for (const t of tasks) {
      if (t.id_padre === id && !result.has(t.id)) {
        result.add(t.id);
        queue.push(t.id);
      }
    }
  }
  return result;
}

type FlatRow = { task: Task; depth: number };

function buildFlatTree(tasks: Task[], collapsed: Set<number>): FlatRow[] {
  const childrenOf = new Map<number | null, Task[]>();
  for (const t of tasks) {
    const key = t.id_padre ?? null;
    if (!childrenOf.has(key)) childrenOf.set(key, []);
    childrenOf.get(key)!.push(t);
  }
  for (const children of childrenOf.values()) {
    children.sort(
      (a, b) =>
        (asUnix(a.startline ?? a.created_at) || 0) -
        (asUnix(b.startline ?? b.created_at) || 0)
    );
  }
  const result: FlatRow[] = [];
  const walk = (parentId: number | null, depth: number) => {
    for (const task of childrenOf.get(parentId) ?? []) {
      result.push({ task, depth });
      if (!collapsed.has(task.id)) walk(task.id, depth + 1);
    }
  };
  walk(null, 0);
  return result;
}

type TimelineSegment = { label: string; width: number; key: string };
type TimelineLayout = {
  totalWidth: number;
  years: TimelineSegment[];
  months: TimelineSegment[];
  days: TimelineSegment[];
};

function buildTimelineLayout(stats: { min: number; max: number }): TimelineLayout {
  if (!stats.min || !stats.max) {
    return { totalWidth: TIMELINE_DAY_WIDTH_PX, years: [], months: [], days: [] };
  }

  const start = new Date(toDayStartTs(stats.min));
  const end = new Date(toDayStartTs(stats.max));
  if (end < start) {
    return { totalWidth: TIMELINE_DAY_WIDTH_PX, years: [], months: [], days: [] };
  }

  const years: TimelineSegment[] = [];
  const months: TimelineSegment[] = [];
  const days: TimelineSegment[] = [];

  let currentYear: number | null = null;
  let currentYearStart = 0;
  let currentMonthKey: string | null = null;
  let currentMonthStart = 0;
  let index = 0;
  const cur = new Date(start);

  while (cur <= end) {
    const year = cur.getFullYear();
    const month = cur.getMonth();
    const monthKey = `${year}-${month}`;

    if (currentYear === null) {
      currentYear = year;
      currentYearStart = index;
    }
    if (year !== currentYear) {
      years.push({
        label: String(currentYear),
        width: (index - currentYearStart) * TIMELINE_DAY_WIDTH_PX,
        key: `year-${currentYear}`,
      });
      currentYear = year;
      currentYearStart = index;
    }

    if (currentMonthKey === null) {
      currentMonthKey = monthKey;
      currentMonthStart = index;
    }
    if (monthKey !== currentMonthKey) {
      const [prevYear, prevMonth] = currentMonthKey.split("-").map(Number);
      months.push({
        label: new Date(prevYear, prevMonth, 1).toLocaleDateString("es", { month: "short" }),
        width: (index - currentMonthStart) * TIMELINE_DAY_WIDTH_PX,
        key: `month-${currentMonthKey}`,
      });
      currentMonthKey = monthKey;
      currentMonthStart = index;
    }

    days.push({
      label: String(cur.getDate()),
      width: TIMELINE_DAY_WIDTH_PX,
      key: `day-${year}-${month + 1}-${cur.getDate()}`,
    });

    cur.setDate(cur.getDate() + 1);
    index += 1;
  }

  if (currentYear !== null) {
    years.push({
      label: String(currentYear),
      width: (index - currentYearStart) * TIMELINE_DAY_WIDTH_PX,
      key: `year-${currentYear}-last`,
    });
  }
  if (currentMonthKey !== null) {
    const [lastYear, lastMonth] = currentMonthKey.split("-").map(Number);
    months.push({
      label: new Date(lastYear, lastMonth, 1).toLocaleDateString("es", { month: "short" }),
      width: (index - currentMonthStart) * TIMELINE_DAY_WIDTH_PX,
      key: `month-${currentMonthKey}-last`,
    });
  }

  return {
    totalWidth: Math.max(days.length * TIMELINE_DAY_WIDTH_PX, TIMELINE_DAY_WIDTH_PX),
    years,
    months,
    days,
  };
}

function GanttTimelineHeader({ layout }: { layout: TimelineLayout }) {
  return (
    <div className="gantt-timeline-header" style={{ minWidth: `${layout.totalWidth}px` }}>
      <div className="gantt-timeline-row years">
        {layout.years.map((cell) => (
          <span className="gantt-timeline-cell" key={cell.key} style={{ width: `${cell.width}px` }}>
            {cell.label}
          </span>
        ))}
      </div>
      <div className="gantt-timeline-row months">
        {layout.months.map((cell) => (
          <span className="gantt-timeline-cell" key={cell.key} style={{ width: `${cell.width}px` }}>
            {cell.label}
          </span>
        ))}
      </div>
      <div className="gantt-timeline-row days">
        {layout.days.map((cell) => (
          <span className="gantt-timeline-cell" key={cell.key} style={{ width: `${cell.width}px` }}>
            {cell.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function TasksManagementPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [editor, setEditor] = useState<EditorState>(emptyEditor);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dropTargetId, setDropTargetId] = useState<number | null>(null);
  const [expandedContentIds, setExpandedContentIds] = useState<Set<number>>(new Set());

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setTasks(await fetchTasksForGantt());
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las tareas");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      setUsers(await fetchUsers());
    } catch {
      setUsers([]);
    }
  }, []);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const flatRows = useMemo(() => buildFlatTree(tasks, collapsed), [tasks, collapsed]);

  const usersById = useMemo(() => {
    return new Map(
      users.map((user) => {
        const fullName = `${user.nombre} ${user.apellido}`.trim();
        return [user.id, fullName || user.email] as const;
      })
    );
  }, [users]);

  const timelineStats = useMemo(() => {
    if (!tasks.length) return { min: 0, max: 1, span: 1, dayMin: 0, dayMax: 0, totalDays: 1 };
    const starts = tasks.map((t) => asUnix(t.startline ?? t.created_at)).filter((v) => !Number.isNaN(v));
    const ends = tasks.map((t) => asUnix(t.deadline)).filter((v) => !Number.isNaN(v));
    if (!starts.length || !ends.length) {
      return { min: 0, max: 1, span: 1, dayMin: 0, dayMax: 0, totalDays: 1 };
    }
    const dayMin = toDayStartTs(Math.min(...starts));
    const dayMax = toDayStartTs(Math.max(...ends));
    const min = dayMin;
    const max = dayMax + ONE_DAY_MS;
    const span = Math.max(max - min, ONE_DAY_MS);
    const totalDays = Math.max(Math.floor((dayMax - dayMin) / ONE_DAY_MS) + 1, 1);
    return { min, max, span, dayMin, dayMax, totalDays };
  }, [tasks]);

  const timelineLayout = useMemo(() => buildTimelineLayout(timelineStats), [timelineStats]);

  const ganttTableStyle = useMemo(
    () =>
      ({
        "--timeline-days": `${timelineStats.totalDays}`,
        "--timeline-day-width": `${TIMELINE_DAY_WIDTH_PX}px`,
      }) as CSSProperties,
    [timelineStats.totalDays]
  );

  const hasChildren = useCallback((id: number) => tasks.some((t) => t.id_padre === id), [tasks]);

  const openCreate = (idPadre?: number | null) => {
    setEditor({ ...emptyEditor, id_padre: idPadre ?? null });
    setError("");
    setShowModal(true);
  };

  const openEdit = (task: Task) => {
    setEditor({
      id: task.id,
      id_padre: task.id_padre ?? null,
      id_user: task.id_user ?? null,
      titulo: task.titulo,
      contenido: task.contenido,
      startline: toInputDate(task.startline),
      deadline: toInputDate(task.deadline),
      completada: task.completada,
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
    if (!editor.titulo.trim() || !editor.contenido.trim() || !editor.deadline) {
      setError("Completa título, contenido y fecha fin.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (editor.id) {
        await updateTask(editor.id, {
          titulo: editor.titulo.trim(),
          contenido: editor.contenido.trim(),
          startline: editor.startline || null,
          deadline: editor.deadline,
          completada: editor.completada,
          id_padre: editor.id_padre,
          id_user: editor.id_user,
        });
      } else {
        await createTask({
          titulo: editor.titulo.trim(),
          contenido: editor.contenido.trim(),
          startline: editor.startline || null,
          deadline: editor.deadline,
          id_padre: editor.id_padre,
          id_user: editor.id_user,
        });
      }
      await loadTasks();
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la tarea");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: number) => {
    if (!window.confirm("¿Borrar esta tarea?")) return;
    try {
      await deleteTask(id);
      await loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo borrar la tarea");
    }
  };

  const toggleCollapse = (id: number) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleContent = (id: number) => {
    setExpandedContentIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const onDragEnd = () => {
    setDraggedId(null);
    setDropTargetId(null);
  };

  const onDrop = async (e: React.DragEvent, targetId: number | null) => {
    e.preventDefault();
    if (draggedId === null || draggedId === targetId) { onDragEnd(); return; }
    if (targetId !== null) {
      const descendants = getAllDescendantIds(tasks, draggedId);
      if (descendants.has(targetId)) { onDragEnd(); return; }
    }
    try {
      await moveTask(draggedId, targetId);
      await loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo mover la tarea");
    }
    onDragEnd();
  };

  return (
    <div className="gantt-page">
      <div className="gantt-toolbar">
        <p className="section-label">TasksManagement · Gantt</p>
        <button className="primary-btn" onClick={() => openCreate()} type="button">+ Nueva tarea</button>
        {error && <p className="error-line" style={{ margin: 0 }}>{error}</p>}
      </div>

      {loading ? (
        <p className="muted">Cargando tareas…</p>
      ) : (
        <div
          className={`gantt-table${dropTargetId === -1 ? " gantt-root-drop-active" : ""}`}
          style={ganttTableStyle}
          onDragLeave={() => { if (dropTargetId === -1) setDropTargetId(null); }}
          onDragOver={(e) => { e.preventDefault(); setDropTargetId(-1); }}
          onDrop={(e) => void onDrop(e, null)}
        >
          <div className="gantt-header-row">
            <div className="gantt-label-col gantt-label-header">Tarea</div>
            <div className="gantt-content-col gantt-label-header">Contenido</div>
            <div className="gantt-dates-col gantt-label-header">Fechas</div>
            <div className="gantt-bar-col"><GanttTimelineHeader layout={timelineLayout} /></div>
          </div>

          {flatRows.map(({ task, depth }) => {
            const start = asUnix(task.startline ?? task.created_at);
            const end = asUnix(task.deadline);
            const left = ((start - timelineStats.min) / timelineStats.span) * 100;
            const width = ((end - start) / timelineStats.span) * 100;
            const isParent = hasChildren(task.id);
            const isCollapsed = collapsed.has(task.id);
            const ownerName = task.id_user ? usersById.get(task.id_user) : undefined;
            const isContentExpanded = expandedContentIds.has(task.id);
            const hasLongContent = task.contenido.length > CONTENT_PREVIEW_LENGTH;
            const contentPreview = hasLongContent
              ? `${task.contenido.slice(0, CONTENT_PREVIEW_LENGTH)}...`
              : task.contenido;

            return (
              <div
                className={`gantt-tree-row${draggedId === task.id ? " dragging" : ""}${dropTargetId === task.id ? " drop-target" : ""}`}
                draggable
                key={task.id}
                onDragEnd={onDragEnd}
                onDragLeave={() => { if (dropTargetId === task.id) setDropTargetId(null); }}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDropTargetId(task.id); }}
                onDragStart={() => setDraggedId(task.id)}
                onDrop={(e) => { e.stopPropagation(); void onDrop(e, task.id); }}
              >
                <div className="gantt-label-col" style={{ paddingLeft: `${8 + depth * 22}px` }}>
                  {isParent ? (
                    <button className="gantt-toggle" onClick={() => toggleCollapse(task.id)} type="button">
                      {isCollapsed ? "▶" : "▼"}
                    </button>
                  ) : (
                    <span className="gantt-toggle-placeholder" />
                  )}
                  <div className="gantt-task-info">
                    <span className={`gantt-task-title${task.completada ? " done" : ""}`}>{task.titulo}</span>
                    <span className="gantt-task-owner">{ownerName ? `Responsable: ` : "Sin responsable"}</span>
                    <span className="gantt-task-owner">{ownerName ? `${ownerName}` : ""}</span>
                  </div>
                </div>

                <div className="gantt-content-col">
                  <span className={`gantt-task-content${isContentExpanded ? " expanded" : " expanded preview"}`}>
                    {isContentExpanded ? task.contenido : contentPreview}
                    {!isContentExpanded && hasLongContent && (
                      <>
                        {" "}
                        <button
                          aria-label="Expandir contenido"
                          className="gantt-content-more-link"
                          onClick={() => toggleContent(task.id)}
                          title="Ver contenido completo"
                          type="button"
                        >
                          (Ver más)
                        </button>
                      </>
                    )}
                  </span>
                  {hasLongContent && (
                    <button
                      aria-label={isContentExpanded ? "Contraer contenido" : "Expandir contenido"}
                      className="gantt-content-toggle"
                      onClick={() => toggleContent(task.id)}
                      title={isContentExpanded ? "Contraer contenido" : "Ver contenido completo"}
                      type="button"
                    >
                      {isContentExpanded ? "▴" : "▾"}
                    </button>
                  )}
                </div>

                <div className="gantt-dates-col">
                  <span className="gantt-task-dates">
                      {`${task.startline || task.created_at ? `Inicio: ${toInputDate(task.startline ?? task.created_at)}` : ""} →`}
                  </span>
                  <span className="gantt-task-dates">
                    {`Fin: ${toInputDate(task.deadline)}`}
                  </span>
                  <div className="gantt-actions-col">
                    <button className="chip-btn" onClick={() => openEdit(task)} title="Editar" type="button">✏️</button>
                    <button className="chip-btn" onClick={() => openCreate(task.id)} title="Añadir subtarea" type="button">➕</button>
                    <button className="chip-btn danger" onClick={() => void onDelete(task.id)} title="Borrar" type="button">🗑️</button>
                  </div>
                </div>

                <div className="gantt-bar-col">
                  <div className="gantt-bar-inner" style={{ minWidth: `${timelineLayout.totalWidth}px` }}>
                    <div className="gantt-track">
                      <span
                        className={`gantt-bar${task.completada ? " done" : ""}`}
                        style={{ left: `${Math.max(left, 0)}%`, width: `${Math.max(width, 1.5)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {!flatRows.length && (
            <p className="muted" style={{ padding: "18px 14px" }}>No hay tareas. Crea una con "+ Nueva tarea".</p>
          )}
        </div>
      )}

      {showModal && (
        <div
          className="product-modal-overlay"
          onClick={closeModal}
          onKeyDown={(e) => { if (e.key === "Escape") closeModal(); }}
          role="presentation"
        >
          <div className="product-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="product-modal-header">
              <h3>{editor.id ? `Editar tarea #${editor.id}` : "Nueva tarea"}</h3>
              <button className="product-modal-close" onClick={closeModal} type="button">✕</button>
            </div>

            {error && <p className="error-line">{error}</p>}

            <form className="stack" onSubmit={(e) => void onSubmit(e)}>
              <label className="field-label" htmlFor="titulo">Título</label>
              <input
                id="titulo"
                maxLength={100}
                onChange={(e) => setEditor((p) => ({ ...p, titulo: e.target.value }))}
                required
                value={editor.titulo}
              />

              <label className="field-label" htmlFor="contenido">Contenido</label>
              <textarea
                id="contenido"
                maxLength={200}
                onChange={(e) => setEditor((p) => ({ ...p, contenido: e.target.value }))}
                required
                rows={3}
                value={editor.contenido}
              />

              <label className="field-label" htmlFor="id_padre">Tarea padre</label>
              <select
                id="id_padre"
                onChange={(e) =>
                  setEditor((p) => ({
                    ...p,
                    id_padre: e.target.value === "" ? null : Number(e.target.value),
                  }))
                }
                value={editor.id_padre ?? ""}
              >
                <option value="">— Sin padre (raíz) —</option>
                {tasks
                  .filter((t) => t.id !== editor.id)
                  .map((t) => (
                    <option key={t.id} value={t.id}>{t.titulo}</option>
                  ))}
              </select>

              <label className="field-label" htmlFor="id_user">Responsable de la tarea</label>
              <select
                id="id_user"
                onChange={(e) =>
                  setEditor((p) => ({
                    ...p,
                    id_user: e.target.value === "" ? null : Number(e.target.value),
                  }))
                }
                value={editor.id_user ?? ""}
              >
                <option value="">— Sin responsable —</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{`${u.nombre} ${u.apellido}`.trim() || u.email}</option>
                ))}
              </select>

              <label className="field-label" htmlFor="startline">Fecha inicio</label>
              <input
                id="startline"
                onChange={(e) => setEditor((p) => ({ ...p, startline: e.target.value }))}
                type="date"
                value={editor.startline}
              />

              <label className="field-label" htmlFor="deadline">Fecha fin</label>
              <input
                id="deadline"
                onChange={(e) => setEditor((p) => ({ ...p, deadline: e.target.value }))}
                required
                type="date"
                value={editor.deadline}
              />

              <label className="toggle-row" htmlFor="completada">
                <input
                  checked={editor.completada}
                  id="completada"
                  onChange={(e) => setEditor((p) => ({ ...p, completada: e.target.checked }))}
                  type="checkbox"
                />
                Marcar completada
              </label>

              <div className="actions-row">
                <button className="primary-btn" disabled={saving} type="submit">
                  {saving ? "Guardando…" : editor.id ? "Actualizar" : "Crear tarea"}
                </button>
                <button className="chip-btn" onClick={closeModal} type="button">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
