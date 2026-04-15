import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { categoriesAPI } from "../lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Edit2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { HexColorPicker } from "react-colorful";

export default function AdminCategories() {
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    const [formData, setFormData] = useState({
        name: "",
        color: "#137fec"
    });
    const [showColorPicker, setShowColorPicker] = useState(false);

    const { data: categories, isLoading } = useQuery({
        queryKey: ["categories"],
        queryFn: async () => {
            const response = await categoriesAPI.getAll();
            return response.data;
        }
    });

    const createMutation = useMutation({
        mutationFn: (data) => categoriesAPI.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries(["categories"]);
            toast.success("Categoria criada com sucesso!");
            setIsDialogOpen(false);
            resetForm();
        },
        onError: (error) => {
            toast.error(error.response?.data?.error || "Erro ao criar categoria");
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => categoriesAPI.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(["categories"]);
            toast.success("Categoria atualizada com sucesso!");
            setIsDialogOpen(false);
            resetForm();
        },
        onError: (error) => {
            toast.error(error.response?.data?.error || "Erro ao atualizar categoria");
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => categoriesAPI.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries(["categories"]);
            toast.success("Categoria removida com sucesso!");
        },
        onError: (error) => {
            toast.error(error.response?.data?.error || "Erro ao remover categoria");
        }
    });

    const resetForm = () => {
        setFormData({ name: "", color: "#137fec" });
        setEditingCategory(null);
        setShowColorPicker(false);
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            color: category.color || "#137fec"
        });
        setIsDialogOpen(true);
    };

    const handleDelete = (category) => {
        if (category._count?.events > 0) {
            toast.error("Não é possível remover categoria com eventos vinculados.");
            return;
        }
        if (window.confirm("Deseja realmente remover esta categoria?")) {
            deleteMutation.mutate(category.id);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingCategory) {
            updateMutation.mutate({ id: editingCategory.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flexjustify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold">Gerenciar Categorias</h2>
                    <p className="text-muted-foreground">Crie e edite as categorias dos eventos</p>
                </div>
                <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Categoria
                </Button>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="p-0 gap-0 overflow-hidden sm:rounded-[2.5rem] border-none shadow-2xl max-w-[500px] w-full bg-white dark:bg-slate-900 mx-auto">
                    <DialogHeader className="p-10 pb-8 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-6">
                            <div className="bg-indigo-600 text-white p-4 rounded-3xl shadow-lg shadow-indigo-100 dark:shadow-none">
                                <Tag className="h-7 w-7" />
                            </div>
                            <div>
                                <DialogTitle className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-tight">
                                    {editingCategory ? "Editar Categoria" : "Nova Categoria"}
                                </DialogTitle>
                                <DialogDescription className="font-bold text-slate-500 text-base mt-1">
                                    Organização temática de eventos.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="flex flex-col bg-white dark:bg-slate-900">
                        <div className="p-10 space-y-10 custom-scrollbar overflow-y-auto max-h-[70vh]">
                            <div className="space-y-4">
                                <Label htmlFor="name" className="font-black text-slate-700 dark:text-slate-300 ml-1 uppercase text-[10px] tracking-[0.2em]">Nome da Categoria *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ex: Tecnologia, Educação, Gestão"
                                    className="h-14 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-indigo-500 transition-all font-bold text-slate-900 dark:text-white"
                                    required
                                />
                            </div>

                            <div className="space-y-4">
                                <Label className="font-black text-slate-700 dark:text-slate-300 ml-1 uppercase text-[10px] tracking-[0.2em]">Identificação Visual (Cor)</Label>
                                <div className="flex items-center gap-6 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-inner">
                                    <button
                                        type="button"
                                        className="w-20 h-20 rounded-[1.5rem] border-4 border-white dark:border-slate-800 shadow-2xl cursor-pointer transition-transform hover:scale-110 active:scale-95 flex-shrink-0"
                                        style={{ backgroundColor: formData.color }}
                                        onClick={() => setShowColorPicker(!showColorPicker)}
                                        title="Abrir seletor de cores"
                                    />
                                    <div className="flex-1 space-y-3">
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">HEX</div>
                                            <Input
                                                value={formData.color.replace('#', '')}
                                                onChange={(e) => setFormData({ ...formData, color: `#${e.target.value.replace('#', '')}` })}
                                                placeholder="FFFFFF"
                                                className="h-12 rounded-xl border-slate-200 pl-12 font-mono uppercase text-slate-900 dark:text-white font-black"
                                                maxLength={7}
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight px-1 italic">Clique no quadrado para selecionar visualmente</p>
                                    </div>
                                </div>
                                
                                {showColorPicker && (
                                    <div className="mt-4 p-8 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] bg-slate-50 dark:bg-slate-800/30 shadow-inner w-full flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-300">
                                        <div className="w-full flex justify-center">
                                            <HexColorPicker 
                                                color={formData.color} 
                                                onChange={(val) => setFormData({ ...formData, color: val })} 
                                                className="!w-full !max-w-[240px] !h-[200px]"
                                            />
                                        </div>
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => setShowColorPicker(false)}
                                            className="rounded-full font-black text-[10px] uppercase tracking-widest px-6 h-8"
                                        >
                                            Concluído
                                        </Button>
                                    </div>
                                )}
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
                                disabled={createMutation.isLoading || updateMutation.isLoading}
                                className="h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-2xl shadow-indigo-100 dark:shadow-none active:scale-95 transition-all text-lg uppercase tracking-wider order-1 sm:order-2 sm:flex-[2]"
                            >
                                {createMutation.isLoading || updateMutation.isLoading ? "Processando..." : editingCategory ? "Salvar Alterações" : "Confirmar Categoria"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Cor</TableHead>
                                <TableHead>Nome</TableHead>
                                <TableHead>Eventos Vinculados</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-4">Carregando...</TableCell>
                                </TableRow>
                            ) : categories?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                                        Nenhuma categoria encontrada
                                    </TableCell>
                                </TableRow>
                            ) : (
                                categories?.map((category) => (
                                    <TableRow key={category.id}>
                                        <TableCell>
                                            <div
                                                className="w-6 h-6 rounded-full border shadow-sm"
                                                style={{ backgroundColor: category.color }}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">{category.name}</TableCell>
                                        <TableCell>{category._count?.events || 0}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEdit(category)}
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleDelete(category)}
                                                    disabled={category._count?.events > 0}
                                                >
                                                    <Trash2 className="h-4 w-4" />
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
        </div>
    );
}
