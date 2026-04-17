import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card, CardContent } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "./ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Plus, Edit, Trash2, Trophy, Upload } from "lucide-react";
import { toast } from "sonner";
import { getAssetUrl } from "../lib/utils"; // NOVO: Para resolver a URL da imagem


const AwardManagement = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAward, setEditingAward] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", criteria: "" });
  const [insigniaFile, setInsigniaFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // 1. Busca todas as premiações para exibir na tabela
  const { data: awards, isLoading } = useQuery({
    queryKey: ["admin-awards"],
    queryFn: () => api.get("/awards").then((res) => res.data.awards),
  });

  // 2. Mutação para criar ou atualizar uma premiação
  const createOrUpdateMutation = useMutation({
    mutationFn: (formData) => {
      return editingAward
        ? api.put(`/awards/${editingAward.id}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          })
        : api.post("/awards", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
    },
    onSuccess: () => {
      toast.success(
        `Premiação ${editingAward ? "atualizada" : "criada"} com sucesso!`
      );
      queryClient.invalidateQueries(["admin-awards"]);
      setIsDialogOpen(false);
    },
    onError: (err) =>
      toast.error(err.response?.data?.error || "Erro ao salvar premiação."),
  });

  // 3. Mutação para deletar uma premiação
  const deleteMutation = useMutation({
    mutationFn: (awardId) => api.delete(`/awards/${awardId}`),
    onSuccess: () => {
      toast.success("Premiação deletada com sucesso!");
      queryClient.invalidateQueries(["admin-awards"]);
    },
    onError: (err) =>
      toast.error(err.response?.data?.error || "Erro ao deletar premiação."),
  });

  const handleOpenDialog = (award = null) => {
    setEditingAward(award);
    if (award) {
      setForm({
        name: award.name,
        description: award.description,
        criteria: award.criteria,
      });
      setPreviewUrl(award.imageUrl ? getAssetUrl(award.imageUrl) : null);
    } else {
      setForm({ name: "", description: "", criteria: "" });
      setPreviewUrl(null);
    }
    setInsigniaFile(null);
    setIsDialogOpen(true);
  };

  const handleDelete = (awardId) => {
    if (window.confirm("Tem certeza que deseja excluir esta premiação?")) {
      deleteMutation.mutate(awardId);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setInsigniaFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("description", form.description);
    formData.append("criteria", form.criteria);
    if (insigniaFile) {
      formData.append("imageUrl", insigniaFile);
    }
    createOrUpdateMutation.mutate(formData);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gerenciar Premiações</h2>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" /> Nova Premiação
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Critério</TableHead>
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
                awards?.map((award) => (
                  <TableRow key={award.id}>
                    <TableCell className="font-medium">{award.name}</TableCell>
                    <TableCell>{award.criteria}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(award)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(award.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="p-0 gap-0 overflow-hidden sm:rounded-[2.5rem] border-none shadow-2xl max-w-[600px] w-full bg-white dark:bg-slate-900 mx-auto">
          <DialogHeader className="p-10 pb-8 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-6">
              <div className="bg-amber-500 text-white p-4 rounded-3xl shadow-lg shadow-amber-100 dark:shadow-none">
                <Trophy className="h-7 w-7" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-tight">
                  {editingAward ? "Editar Premiação" : "Nova Premiação"}
                </DialogTitle>
                <DialogDescription className="font-bold text-slate-500 text-base mt-1">
                  Reconhecimento de mérito e conquistas educacionais.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col bg-white dark:bg-slate-900">
            <div className="p-10 space-y-10 bg-white dark:bg-slate-900 overflow-y-auto max-h-[70vh] custom-scrollbar">
              <div className="space-y-4">
                <Label htmlFor="name" className="font-black text-slate-700 dark:text-slate-300 ml-1 uppercase text-[10px] tracking-[0.2em]">Nome da Premiação *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Mestre Engajador 2026"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-700 focus:border-amber-500 transition-all font-bold text-slate-900 dark:text-white"
                  required
                />
              </div>
              <div className="space-y-4">
                <Label htmlFor="description" className="font-black text-slate-700 dark:text-slate-300 ml-1 uppercase text-[10px] tracking-[0.2em]">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva o propósito desta premiação..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="rounded-[1.5rem] border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-6 min-h-[100px] resize-none focus-visible:ring-amber-500 transition-all shadow-inner font-medium text-slate-900 dark:text-white"
                  rows={2}
                />
              </div>
              <div className="space-y-4">
                <Label htmlFor="criteria" className="font-black text-slate-700 dark:text-slate-300 ml-1 uppercase text-[10px] tracking-[0.2em]">Critérios de Conquista *</Label>
                <Textarea
                  id="criteria"
                  placeholder="Ex: Realizar check-in em todos os eventos da trilha de Tecnologia."
                  value={form.criteria}
                  onChange={(e) => setForm({ ...form, criteria: e.target.value })}
                  className="rounded-[1.5rem] border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-6 min-h-[100px] resize-none focus-visible:ring-amber-500 transition-all shadow-inner font-medium focus:border-amber-500 text-slate-900 dark:text-white"
                  rows={2}
                  required
                />
              </div>

              <div className="space-y-4 pt-2">
                <Label className="font-black text-slate-700 dark:text-slate-300 ml-1 uppercase text-[10px] tracking-[0.2em]">Insígnia Visual (Medalha)</Label>
                <div className="flex flex-col sm:flex-row items-center gap-8 p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-inner">
                  <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-800 flex-shrink-0 group relative cursor-pointer flex items-center justify-center">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Pré-visualização"
                        className="h-20 w-20 object-contain animate-in zoom-in-75 duration-500"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-300">
                        <Trophy className="h-10 w-10 opacity-20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Upload className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-4 w-full">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Insígnia do Prêmio</p>
                    <Label
                      htmlFor="insignia-image"
                      className="flex h-12 w-full cursor-pointer items-center justify-center rounded-2xl border border-slate-200 bg-white dark:bg-slate-800 px-6 text-sm font-black text-slate-900 dark:text-white hover:bg-slate-50 transition-all shadow-sm"
                    >
                      <Plus className="mr-2 h-5 w-5 text-slate-400" />
                      {insigniaFile ? "Trocar Imagem" : "Escolher Arquivo..."}
                      <Input
                        id="insignia-image"
                        type="file"
                        className="sr-only"
                        onChange={handleFileChange}
                        accept="image/png, image/jpeg, image/svg+xml"
                      />
                    </Label>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight px-1 italic leading-tight">Envie um arquivo PNG ou SVG com fundo transparente para melhor acabamento.</p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="p-8 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsDialogOpen(false)}
                className="h-14 rounded-2xl font-black uppercase tracking-widest order-2 sm:order-1 sm:flex-1 text-slate-500 hover:text-slate-900"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createOrUpdateMutation.isPending}
                className="h-14 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-2xl shadow-2xl shadow-amber-100 dark:shadow-none active:scale-95 transition-all text-lg uppercase tracking-wider order-1 sm:order-2 sm:flex-[2]"
              >
                {createOrUpdateMutation.isPending ? "Processando..." : (editingAward ? "Salvar Alterações" : "Confirmar Premiação")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AwardManagement;
