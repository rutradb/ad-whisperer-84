import { useMutation } from "@tanstack/react-query";
import { generateAdCopy } from "@/lib/anthropic-api";
import type { CopyGeneratorInput } from "@/lib/anthropic-api";
import { useToast } from "@/hooks/use-toast";

export function useGenerateCopy() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: (input: CopyGeneratorInput) => generateAdCopy(input),
    onError: (err: Error) => {
      toast({ title: "Erro ao gerar copy", description: err.message, variant: "destructive" });
    },
  });
}
