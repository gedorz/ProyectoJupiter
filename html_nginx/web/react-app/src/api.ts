import type {
  AnalyzeResponse,
  Product,
  ProductCreatePayload,
  ProductUpdatePayload,
  Task,
  TaskCreatePayload,
  TaskUpdatePayload,
  User,
  UserCreatePayload,
  UserUpdatePayload
} from "./types";

const API_BASE = "/api";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options?.headers ?? {})
    },
    ...options
  });

  const raw = await response.text();
  let parsed: unknown = null;

  if (raw) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = raw;
    }
  }

  if (!response.ok) {
    const detail = typeof parsed === "string" ? parsed : JSON.stringify(parsed, null, 2);
    throw new Error(detail || `HTTP ${response.status}`);
  }

  return parsed as T;
}

export async function analyzeWithSystemPrompt(prompt: string): Promise<AnalyzeResponse> {
  const url = `${API_BASE}/analyze-system?prompt=${encodeURIComponent(prompt)}`;
  return request<AnalyzeResponse>(url, { method: "POST", headers: { "Content-Type": "application/json" } });
}

export async function fetchTasksForGantt(): Promise<Task[]> {
  return request<Task[]>(`${API_BASE}/tasks/gantt`, { method: "GET" });
}

export async function createTask(payload: TaskCreatePayload): Promise<Task> {
  return request<Task>(`${API_BASE}/tasks/`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateTask(taskId: number, payload: TaskUpdatePayload): Promise<Task> {
  return request<Task>(`${API_BASE}/tasks/${taskId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export async function deleteTask(taskId: number): Promise<void> {
  await request<void>(`${API_BASE}/tasks/${taskId}`, { method: "DELETE" });
}

export async function moveTask(taskId: number, idPadre: number | null): Promise<Task> {
  return request<Task>(`${API_BASE}/tasks/${taskId}/move`, {
    method: "PATCH",
    body: JSON.stringify({ id_padre: idPadre })
  });
}

// User API endpoints
export async function fetchUsers(): Promise<User[]> {
  return request<User[]>(`${API_BASE}/users/`, { method: "GET" });
}

export async function createUser(payload: UserCreatePayload): Promise<User> {
  return request<User>(`${API_BASE}/users/`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateUser(userId: number, payload: UserUpdatePayload): Promise<User> {
  return request<User>(`${API_BASE}/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export async function deleteUser(userId: number): Promise<void> {
  await request<void>(`${API_BASE}/users/${userId}`, { method: "DELETE" });
}

// Products API endpoints
export async function fetchProducts(): Promise<Product[]> {
  return request<Product[]>(`${API_BASE}/products/`, { method: "GET" });
}

export async function createProduct(payload: ProductCreatePayload): Promise<Product> {
  return request<Product>(`${API_BASE}/products/`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateProduct(productId: number, payload: ProductUpdatePayload): Promise<Product> {
  return request<Product>(`${API_BASE}/products/${productId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export async function deleteProduct(productId: number): Promise<void> {
  await request<void>(`${API_BASE}/products/${productId}`, { method: "DELETE" });
}
