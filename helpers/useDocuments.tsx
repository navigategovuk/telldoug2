import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getDocuments } from "../endpoints/documents/list_GET.schema";
import {
  postCreateUploadUrl,
  InputType as CreateUploadInput,
} from "../endpoints/documents/create-upload-url_POST.schema";
import {
  postAttachDocument,
  InputType as AttachDocumentInput,
} from "../endpoints/documents/attach_POST.schema";
import {
  postRequestDocumentRecheck,
  InputType as RequestRecheckInput,
} from "../endpoints/documents/request-recheck_POST.schema";

export const DOCUMENTS_QUERY_KEY = ["documents", "list"] as const;

export function useDocuments() {
  return useQuery({
    queryKey: DOCUMENTS_QUERY_KEY,
    queryFn: () => getDocuments(),
  });
}

export function useCreateUploadUrl() {
  return useMutation({
    mutationFn: (data: CreateUploadInput) => postCreateUploadUrl(data),
  });
}

export function useAttachDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AttachDocumentInput) => postAttachDocument(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY });
    },
  });
}

export function useRequestDocumentRecheck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RequestRecheckInput) => postRequestDocumentRecheck(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY });
    },
  });
}
