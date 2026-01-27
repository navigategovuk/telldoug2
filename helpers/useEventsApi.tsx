import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { getEventsList, InputType as ListInput, OutputType as ListOutput } from "../endpoints/events/list_GET.schema";
import { createEvent, InputType as CreateInput, OutputType as CreateOutput } from "../endpoints/events/create_POST.schema";
import { updateEvent, InputType as UpdateInput, OutputType as UpdateOutput } from "../endpoints/events/update_POST.schema";
import { deleteEvent, InputType as DeleteInput, OutputType as DeleteOutput } from "../endpoints/events/delete_POST.schema";

export const EVENTS_QUERY_KEY = ["events"];

export function useEventsList(input: ListInput = {}, options?: Omit<UseQueryOptions<ListOutput>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: [...EVENTS_QUERY_KEY, input],
    queryFn: () => getEventsList(input),
    placeholderData: (prev) => prev,
    ...options,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInput) => createEvent(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEY });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateInput) => updateEvent(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEY });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DeleteInput) => deleteEvent(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEY });
    },
  });
}