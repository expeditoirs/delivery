import api from "../core/api";

export async function listarStories() {
  const { data } = await api.get("/story/");
  return Array.isArray(data) ? data : [];
}
