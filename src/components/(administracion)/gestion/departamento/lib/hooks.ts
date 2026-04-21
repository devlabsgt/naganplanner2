import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getDepartamentos, 
  createDepartamento, 
  updateDepartamento, 
  deleteDepartamento,
  getCandidatosJefatura, 
  asignarJefeDepartamento
} from "./action";
import { DepartamentoFormValues, DepartamentoRow, DepartamentoNode } from "./schemas";

const QUERY_KEY = ["departamentos"];

export function useDepartamentos(initialData?: DepartamentoRow[]) {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => await getDepartamentos(),
    initialData: initialData, 
    staleTime: 1000 * 60 * 6, 
    gcTime: 1000 * 60 * 10,   
    
    select: (data: DepartamentoRow[]) => {
      const buildTree = (items: DepartamentoRow[]): DepartamentoNode[] => {
        const itemMap = new Map<string, DepartamentoNode>();
        const rootItems: DepartamentoNode[] = [];

        items.forEach(item => {
          itemMap.set(item.id, { ...item, children: [] });
        });

        items.forEach(item => {
          const node = itemMap.get(item.id)!;
          if (item.parent_id && itemMap.has(item.parent_id)) {
            const parent = itemMap.get(item.parent_id);
            parent?.children?.push(node);
          } else {
            rootItems.push(node);
          }
        });

        // Ordenar cada nivel por el campo `orden`
        const sortLevel = (nodes: DepartamentoNode[]) => {
          nodes.sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
          nodes.forEach(n => n.children && sortLevel(n.children));
        };
        sortLevel(rootItems);

        return rootItems;
      };

      return { flat: data, tree: buildTree(data) };
    }
  });
}

export function useCreateDepartamento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: DepartamentoFormValues) => {
      const res = await createDepartamento(values);
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    }
  });
}

export function useUpdateDepartamento() { 
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: DepartamentoFormValues }) => {
       const res = await updateDepartamento(id, values);
       if (res.error) throw new Error(res.error);
       return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY })
  });
}

export function useDeleteDepartamento() { 
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteDepartamento(id);
      if (res.error) throw new Error(res.error);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    }
  });
}

export function useCandidatosJefatura() {
  return useQuery({
    queryKey: ["candidatos-jefatura"],
    queryFn: async () => {
      const res = await getCandidatosJefatura();
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    staleTime: 1000 * 60 * 5, 
  });
}

export function useAsignarJefe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ deptoId, jefeId }: { deptoId: string, jefeId: string | null }) => {
      const res = await asignarJefeDepartamento(deptoId, jefeId);
      if (res.error) throw new Error(res.error);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departamentos"] });
    }
  });
}