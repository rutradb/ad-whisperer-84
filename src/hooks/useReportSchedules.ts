import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { STALE_TIMES } from "@/lib/queryKeys";

export interface ReportSchedule {
  id: string;
  user_id: string;
  report_id: string;
  frequency: "daily" | "weekly" | "monthly";
  day_of_week?: number;
  day_of_month?: number;
  time_of_day: string;
  timezone: string;
  delivery_method: "email" | "webhook";
  delivery_target: string;
  is_active: boolean;
  last_sent_at?: string;
  next_send_at?: string;
  created_at: string;
}

export function useReportSchedules() {
  return useQuery({
    queryKey: ["report-schedules"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await (supabase as any)
        .from("report_schedules")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ReportSchedule[];
    },
    staleTime: STALE_TIMES.SLOW_CHANGING,
  });
}

export function useCreateReportSchedule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (schedule: {
      report_id: string;
      frequency: "daily" | "weekly" | "monthly";
      day_of_week?: number;
      day_of_month?: number;
      time_of_day?: string;
      delivery_method?: "email" | "webhook";
      delivery_target: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const { data, error } = await (supabase as any)
        .from("report_schedules")
        .insert({
          user_id: user.id,
          report_id: schedule.report_id,
          frequency: schedule.frequency,
          day_of_week: schedule.day_of_week,
          day_of_month: schedule.day_of_month,
          time_of_day: schedule.time_of_day || "08:00",
          delivery_method: schedule.delivery_method || "email",
          delivery_target: schedule.delivery_target,
        })
        .select()
        .single();
      if (error) throw error;
      return data as ReportSchedule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-schedules"] });
      toast({ title: "Agendamento criado" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao criar agendamento", description: err.message, variant: "destructive" });
    },
  });
}

export function useToggleReportSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await (supabase as any)
        .from("report_schedules")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-schedules"] });
    },
  });
}

export function useDeleteReportSchedule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("report_schedules")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-schedules"] });
      toast({ title: "Agendamento removido" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao remover", description: err.message, variant: "destructive" });
    },
  });
}
