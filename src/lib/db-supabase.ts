import { supabase } from "./supabase";

// Helper to convert Supabase response
function handleResponse<T>(response: { data: T | null; error: unknown }): T {
  if (response.error) {
    console.error("Supabase error:", response.error);
    throw new Error(String(response.error));
  }
  return response.data as T;
}

// Habits
export const habitsDb = {
  async getAll(includeArchived = false) {
    let query = supabase.from("Habit").select("*").order("order");
    if (!includeArchived) query = query.eq("archived", false);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from("Habit")
      .select("*, Entry(*)")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(data: {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    days?: string;
    isTemplate?: boolean;
    startTime?: string;
    endTime?: string;
    timeSlots?: string;
    categoryId?: string;
  }) {
    const { data: maxOrder } = await supabase
      .from("Habit")
      .select("order")
      .order("order", { ascending: false })
      .limit(1)
      .single();

    const { data: habit, error } = await supabase
      .from("Habit")
      .insert({
        ...data,
        order: (maxOrder?.order ?? -1) + 1,
        icon: data.icon || "💪",
        color: data.color || "#6366F1",
        days: data.days || "1,2,3,4,5,6,0",
        isTemplate: data.isTemplate !== undefined ? data.isTemplate : true,
      })
      .select()
      .single();

    if (error) throw error;
    return habit;
  },

  async update(id: string, data: Record<string, unknown>) {
    const { data: habit, error } = await supabase
      .from("Habit")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return habit;
  },

  async delete(id: string) {
    const { error } = await supabase.from("Habit").delete().eq("id", id);
    if (error) throw error;
  },
};

// Entries
export const entriesDb = {
  async getByDateRange(from: string, to: string) {
    const { data, error } = await supabase
      .from("Entry")
      .select("*, Habit(*)")
      .gte("date", from)
      .lte("date", to);
    if (error) throw error;
    return data;
  },

  async getByDate(date: string) {
    const { data, error } = await supabase
      .from("Entry")
      .select("*, Habit(*)")
      .eq("date", date);
    if (error) throw error;
    return data;
  },

  async upsert(habitId: string, date: string, completed: boolean, note?: string) {
    const { data, error } = await supabase
      .from("Entry")
      .upsert(
        { habitId, date, completed, note: note || null },
        { onConflict: "habitId,date" }
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, data: { completed?: boolean; note?: string }) {
    const { data: entry, error } = await supabase
      .from("Entry")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return entry;
  },
};

// Assignments
export const assignmentsDb = {
  async getAll(includeArchived = false) {
    let query = supabase.from("Assignment").select("*").order("order");
    if (!includeArchived) query = query.eq("archived", false);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getByDateRange(from: string, to: string) {
    const { data, error } = await supabase
      .from("Assignment")
      .select("*")
      .lte("startDate", to)
      .gte("dueDate", from)
      .eq("archived", false)
      .order("order");
    if (error) throw error;
    return data;
  },

  async create(data: {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    startDate: string;
    dueDate: string;
    note?: string;
  }) {
    const { data: maxOrder } = await supabase
      .from("Assignment")
      .select("order")
      .order("order", { ascending: false })
      .limit(1)
      .single();

    const { data: assignment, error } = await supabase
      .from("Assignment")
      .insert({
        ...data,
        order: (maxOrder?.order ?? -1) + 1,
        icon: data.icon || "📋",
        color: data.color || "#3B82F6",
      })
      .select()
      .single();

    if (error) throw error;
    return assignment;
  },

  async update(id: string, data: Record<string, unknown>) {
    const { data: assignment, error } = await supabase
      .from("Assignment")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return assignment;
  },

  async delete(id: string) {
    const { error } = await supabase.from("Assignment").delete().eq("id", id);
    if (error) throw error;
  },
};

// Errands
export const errandsDb = {
  async getAll(includeArchived = false) {
    let query = supabase.from("Errand").select("*").order("order");
    if (!includeArchived) query = query.eq("archived", false);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getByDateRange(from: string, to: string) {
    const { data, error } = await supabase
      .from("Errand")
      .select("*")
      .gte("date", from)
      .lte("date", to)
      .eq("archived", false)
      .order("order");
    if (error) throw error;
    return data;
  },

  async create(data: {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    date: string;
    time?: string;
    note?: string;
  }) {
    const { data: maxOrder } = await supabase
      .from("Errand")
      .select("order")
      .order("order", { ascending: false })
      .limit(1)
      .single();

    const { data: errand, error } = await supabase
      .from("Errand")
      .insert({
        ...data,
        order: (maxOrder?.order ?? -1) + 1,
        icon: data.icon || "📌",
        color: data.color || "#F59E0B",
      })
      .select()
      .single();

    if (error) throw error;
    return errand;
  },

  async update(id: string, data: Record<string, unknown>) {
    const { data: errand, error } = await supabase
      .from("Errand")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return errand;
  },

  async delete(id: string) {
    const { error } = await supabase.from("Errand").delete().eq("id", id);
    if (error) throw error;
  },
};
