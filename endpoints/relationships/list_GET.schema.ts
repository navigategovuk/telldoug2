import { z } from "zod";
import superjson from 'superjson';
import { Selectable } from "kysely";
import { Relationships, EntityTypeArrayValues } from "../../helpers/schema";

export const schema = z.object({
  sourceType: z.enum(EntityTypeArrayValues).optional(),
  sourceId: z.string().optional(),
  targetType: z.enum(EntityTypeArrayValues).optional(),
  targetId: z.string().optional(),
}).refine(data => {
  // Either source pair or target pair should be present for meaningful filtering, 
  // but we can allow listing all if needed. However, usually we list by entity.
  // Let's keep it optional but logic in endpoint prioritizes source then target.
  return true;
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  relationships: Selectable<Relationships>[];
};

export const getRelationshipsList = async (input: InputType, init?: RequestInit): Promise<OutputType> => {
  const params = new URLSearchParams();
  if (input.sourceType) {params.append("sourceType", input.sourceType);}
  if (input.sourceId) {params.append("sourceId", input.sourceId);}
  if (input.targetType) {params.append("targetType", input.targetType);}
  if (input.targetId) {params.append("targetId", input.targetId);}

  const result = await fetch(`/_api/relationships/list?${params.toString()}`, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorObject = superjson.parse<{ error: string }>(await result.text());
    throw new Error(errorObject.error);
  }
  return superjson.parse<OutputType>(await result.text());
};