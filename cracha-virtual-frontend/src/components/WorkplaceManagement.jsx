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
  DialogTrigger,
  DialogDescription,
  DialogFooter,
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
import { Plus, Edit, Trash2, Upload, MapPin } from "lucide-react";

const WorkplaceManagement = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWorkplace, setEditingWorkplace] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    city: "",
    state: "",
  });

  // NOVO: Estados para o dialog de importação
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState(null);

  // Hook para buscar as localidades
  const { data, isLoading } = useQuery({
    queryKey: ["workplaces"],
    queryFn: async () => {
      const response = await api.get("/workplaces?limit=200"); // Aumentando o limite
      return response.data.workplaces;
    },
  });

  // Hooks de Mutação (Criar, Atualizar, Deletar)
  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries(["workplaces"]);
      setIsDialogOpen(false);
      setEditingWorkplace(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Ocorreu um erro");
    },
  };

  const createMutation = useMutation({
    mutationFn: (newData) => api.post("/workplaces", newData),
    ...mutationOptions,
    onSuccess: () => {
      toast.success("Localidade criada com sucesso!");
      mutationOptions.onSuccess();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/workplaces/${id}`, data),
    ...mutationOptions,
    onSuccess: () => {
      toast.success("Localidade atualizada com sucesso!");
      mutationOptions.onSuccess();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/workplaces/${id}`),
    ...mutationOptions,
    onSuccess: () => {
      toast.success("Localidade excluída com sucesso!");
      queryClient.invalidateQueries(["workplaces"]); // Apenas invalida, sem fechar dialog
    },
  });

  // NOVO: Mutação para importar o CSV
  const importMutation = useMutation({
    mutationFn: (formData) =>
      api.post("/workplaces/import/csv", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    onSuccess: (data) => {
      const { imported, skipped, total } = data.data.summary;
      toast.success("Importação Concluída!", {
        description: `${imported} de ${total} localidades importadas. ${skipped} ignoradas (duplicadas ou com erro).`,
      });
      queryClient.invalidateQueries(["workplaces"]);
      setIsImportDialogOpen(false);
      setCsvFile(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Erro ao importar arquivo.");
    },
  });

  // Funções de manipulação do formulário
  const resetForm = () => {
    setFormData({ name: "", description: "", city: "", state: "" });
  };

  const handleOpenDialog = (workplace = null) => {
    if (workplace) {
      setEditingWorkplace(workplace);
      setFormData({
        name: workplace.name,
        description: workplace.description || "",
        city: workplace.city,
        state: workplace.state,
      });
    } else {
      setEditingWorkplace(null);
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingWorkplace) {
      updateMutation.mutate({ id: editingWorkplace.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // NOVO: Função para lidar com o envio do CSV
  const handleImportSubmit = (e) => {
    e.preventDefault();
    if (!csvFile) {
      toast.error("Por favor, selecione um arquivo CSV.");
      return;
    }
    const formData = new FormData();
    formData.append("file", csvFile);
    importMutation.mutate(formData);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Gerenciar Localidades</CardTitle>
          <CardDescription>
            Adicione, edite ou remova unidades educacionais.
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" /> Importar CSV
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Nova Localidade
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Cidade/Estado</TableHead>
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
              data?.map((workplace) => (
                <TableRow key={workplace.id}>
                  <TableCell className="font-medium">
                    {workplace.name}
                  </TableCell>
                  <TableCell>{`${workplace.city}/${workplace.state}`}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(workplace)}
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
                            Esta ação não pode ser desfeita. Isso irá remover
                            permanentemente a localidade.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(workplace.id)}
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
          <DialogContent className="p-0 gap-0 overflow-hidden sm:rounded-[2.5rem] border-none shadow-2xl max-w-[600px] w-full bg-white dark:bg-slate-900 mx-auto">
            <DialogHeader className="p-10 pb-8 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-6">
                <div className="bg-blue-600 text-white p-4 rounded-3xl shadow-lg shadow-blue-100 dark:shadow-none">
                  <MapPin className="h-7 w-7" />
                </div>
                <div>
                  <DialogTitle className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-tight">
                    {editingWorkplace ? "Editar Unidade" : "Nova Unidade"}
                  </DialogTitle>
                  <DialogDescription className="font-bold text-slate-500 text-base mt-1">
                    Gestão de localidades educacionais.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col bg-white dark:bg-slate-900">
              <div className="p-10 space-y-10 bg-white dark:bg-slate-900">
                <div className="space-y-4">
                  <Label htmlFor="name" className="font-black text-slate-700 dark:text-slate-300 ml-1 uppercase text-[10px] tracking-[0.2em]">Nome da Unidade *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Ex: EEEFM Professor José Lins"
                    className="h-14 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 transition-all font-bold text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div className="space-y-4">
                  <Label htmlFor="description" className="font-black text-slate-700 dark:text-slate-300 ml-1 uppercase text-[10px] tracking-[0.2em]">Descrição/Observações</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Informações adicionais sobre o local..."
                    rows={2}
                    className="rounded-[1.5rem] border-slate-100 bg-slate-50/50 dark:bg-slate-800/50 p-6 min-h-[80px] resize-none focus-visible:ring-blue-500 transition-all shadow-inner font-medium"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <Label htmlFor="city" className="font-black text-slate-700 dark:text-slate-300 ml-1 uppercase text-[10px] tracking-[0.2em]">Cidade *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      placeholder="Ex: João Pessoa"
                      className="h-14 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 transition-all font-bold text-slate-900 dark:text-white"
                      required
                    />
                  </div>
                  <div className="space-y-4">
                    <Label htmlFor="state" className="font-black text-slate-700 dark:text-slate-300 ml-1 uppercase text-[10px] tracking-[0.2em]">Estado (UF) *</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) =>
                        setFormData({ ...formData, state: e.target.value })
                      }
                      placeholder="PB"
                      className="h-14 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 transition-all font-bold text-slate-900 dark:text-white uppercase"
                      required
                      maxLength={2}
                    />
                  </div>
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
                  className="h-14 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-2xl shadow-blue-100 dark:shadow-none active:scale-95 transition-all text-lg uppercase tracking-wider order-1 sm:order-2 sm:flex-[2]"
                >
                  {createMutation.isPending || updateMutation.isPending ? "Processando..." : (editingWorkplace ? "Salvar Alterações" : "Confirmar Unidade")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
          <DialogContent className="p-0 gap-0 overflow-hidden sm:rounded-[2.5rem] border-none shadow-2xl max-w-[500px] w-full bg-white dark:bg-slate-900 mx-auto">
            <DialogHeader className="p-10 pb-8 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-6">
                <div className="bg-emerald-500 text-white p-4 rounded-3xl shadow-lg shadow-emerald-100 dark:shadow-none">
                  <Upload className="h-7 w-7" />
                </div>
                <div>
                  <DialogTitle className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-tight">
                    Importação
                  </DialogTitle>
                  <DialogDescription className="font-bold text-slate-500 text-base mt-1">
                    Carga lotérica via CSV.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <form onSubmit={handleImportSubmit} className="flex flex-col bg-white dark:bg-slate-900">
              <div className="p-10 space-y-8 bg-white dark:bg-slate-900">
                <div className="p-6 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-[2rem] space-y-3">
                  <p className="font-black text-blue-900 dark:text-blue-200 uppercase text-[10px] tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Estrutura do Arquivo
                  </p>
                  <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed font-bold uppercase tracking-tight">
                    Colunas: name, description, city, state.
                  </p>
                </div>
                <div className="space-y-4">
                  <Label htmlFor="csvFile" className="font-black text-slate-700 dark:text-slate-300 ml-1 uppercase text-[10px] tracking-[0.2em]">Selecione o Arquivo CSV</Label>
                  <div className="flex flex-col gap-4">
                    <Label
                      htmlFor="csvFile"
                      className="flex h-16 w-full cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 dark:bg-slate-800 px-6 text-sm font-black text-slate-900 dark:text-white hover:bg-slate-100 transition-all group"
                    >
                      <Upload className="mr-3 h-6 w-6 text-slate-400 group-hover:text-blue-500 transition-colors" />
                      {csvFile ? csvFile.name : "Clique para escolher o arquivo"}
                      <Input
                        id="csvFile"
                        type="file"
                        accept=".csv"
                        className="sr-only"
                        onChange={(e) => setCsvFile(e.target.files[0])}
                        required
                      />
                    </Label>
                    <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-tight italic">O arquivo será processado imediatamente após a confirmação.</p>
                  </div>
                </div>
              </div>
              <DialogFooter className="p-8 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4">
                <DialogClose asChild>
                  <Button type="button" variant="ghost" className="h-14 rounded-2xl font-black uppercase tracking-widest order-2 sm:order-1 sm:flex-1 text-slate-500 hover:text-slate-900">
                    Cancelar
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={importMutation.isPending} className="h-14 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl shadow-2xl shadow-emerald-100 dark:shadow-none active:scale-95 transition-all text-lg uppercase tracking-wider order-1 sm:order-2 sm:flex-[2]">
                  {importMutation.isPending ? "Processando..." : "Iniciar Importação"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default WorkplaceManagement;
