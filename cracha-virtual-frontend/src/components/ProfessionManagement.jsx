import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from "./ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { Plus, Edit, Trash2, Briefcase } from "lucide-react";

const ProfessionManagement = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProfession, setEditingProfession] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "" });

  // Hook para buscar as profissões
  const { data, isLoading } = useQuery({
    queryKey: ["professions"],
    queryFn: async () => {
      // ASSUMINDO QUE ESTE ENDPOINT SERÁ CRIADO
      const response = await api.get("/professions?limit=200");
      return response.data.professions;
    },
  });

  // Hooks de Mutação
  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries(["professions"]);
      setIsDialogOpen(false);
      setEditingProfession(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Ocorreu um erro");
    },
  };

  const createMutation = useMutation({
    mutationFn: (newData) => api.post("/professions", newData), // ASSUMINDO ROTA
    ...mutationOptions,
    onSuccess: () => {
      toast.success("Profissão criada com sucesso!");
      mutationOptions.onSuccess();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/professions/${id}`, data), // ASSUMINDO ROTA
    ...mutationOptions,
    onSuccess: () => {
      toast.success("Profissão atualizada com sucesso!");
      mutationOptions.onSuccess();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/professions/${id}`), // ASSUMINDO ROTA
    ...mutationOptions,
    onSuccess: () => {
      toast.success("Profissão excluída com sucesso!");
      queryClient.invalidateQueries(["professions"]);
    },
  });

  // Funções do formulário
  const resetForm = () => setFormData({ name: "", description: "" });

  const handleOpenDialog = (profession = null) => {
    if (profession) {
      setEditingProfession(profession);
      setFormData({
        name: profession.name,
        description: profession.description || "",
      });
    } else {
      setEditingProfession(null);
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingProfession) {
      updateMutation.mutate({ id: editingProfession.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Gerenciar Profissões</CardTitle>
          <CardDescription>
            Adicione, edite ou remova profissões.
          </CardDescription>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" /> Nova Profissão
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : (
              data?.map((profession) => (
                <TableRow key={profession.id}>
                  <TableCell className="font-medium">
                    {profession.name}
                  </TableCell>
                  <TableCell>{profession.description}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(profession)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(profession.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Dialog para Criar/Editar */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="p-0 gap-0 overflow-hidden sm:rounded-[2.5rem] border-none shadow-2xl max-w-[500px] w-full bg-white dark:bg-slate-900 mx-auto">
            <DialogHeader className="p-10 pb-8 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-left">
              <div className="flex items-center gap-6">
                <div className="bg-slate-900 text-white p-4 rounded-3xl shadow-lg border-2 border-slate-100 dark:border-slate-800">
                  <Briefcase className="h-7 w-7" />
                </div>
                <div>
                  <DialogTitle className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-tight">
                    {editingProfession ? "Editar Cargo" : "Novo Cargo"}
                  </DialogTitle>
                  <DialogDescription className="font-bold text-slate-500 text-base mt-1">
                    Gestão de especialidades.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col bg-white dark:bg-slate-900">
              <div className="p-10 space-y-8 bg-white dark:bg-slate-900">
                <div className="space-y-4">
                  <Label htmlFor="name" className="font-black text-slate-700 dark:text-slate-300 ml-1 uppercase text-[10px] tracking-[0.2em]">Nome da Profissão *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Ex: Professor de Matemática"
                    className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-700 focus:border-slate-900 transition-all font-bold text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div className="space-y-4">
                  <Label htmlFor="description" className="font-black text-slate-700 dark:text-slate-300 ml-1 uppercase text-[10px] tracking-[0.2em]">Descrição (Opcional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Breve descrição sobre a especialidade..."
                    rows={3}
                    className="rounded-[1.5rem] border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-6 min-h-[100px] resize-none focus-visible:ring-slate-900 transition-all shadow-inner font-medium text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <DialogFooter className="p-8 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4">
                <DialogClose asChild>
                  <Button type="button" variant="ghost" className="h-14 rounded-2xl font-black uppercase tracking-widest order-2 sm:order-1 sm:flex-1 text-slate-500 hover:text-slate-900">
                    Cancelar
                  </Button>
                </DialogClose>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="h-14 bg-slate-900 hover:bg-black text-white font-black rounded-2xl shadow-2xl shadow-slate-100 dark:shadow-none active:scale-95 transition-all text-lg uppercase tracking-wider order-1 sm:order-2 sm:flex-[2]"
                >
                  {createMutation.isPending || updateMutation.isPending ? "Salvando..." : (editingProfession ? "Salvar Alterações" : "Confirmar Cargo")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ProfessionManagement;
