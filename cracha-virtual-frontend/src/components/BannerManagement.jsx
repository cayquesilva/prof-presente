import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bannersAPI } from "../lib/api";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "./ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "./ui/table";
import {
    Plus,
    Trash2,
    Edit,
    Image as ImageIcon,
    ExternalLink,
    Upload,
} from "lucide-react";
import { toast } from "sonner";
import { getAssetUrl } from "../lib/utils";
import { Switch } from "./ui/switch";

const BannerManagement = () => {
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [imageFile, setImageFile] = useState(null);

    const [form, setForm] = useState({
        title: "",
        description: "",
        linkUrl: "",
        order: "0",
        isActive: true,
    });

    const { data: banners, isLoading } = useQuery({
        queryKey: ["admin-banners"],
        queryFn: async () => {
            const response = await bannersAPI.getAll();
            return Array.isArray(response.data) ? response.data : [];
        },
    });

    const createMutation = useMutation({
        mutationFn: (formData) => bannersAPI.create(formData),
        onSuccess: () => {
            queryClient.invalidateQueries(["admin-banners"]);
            toast.success("Banner criado com sucesso!");
            closeDialog();
        },
        onError: (error) => {
            toast.error(error.response?.data?.error || "Erro ao criar banner");
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, formData }) => bannersAPI.update(id, formData),
        onSuccess: () => {
            queryClient.invalidateQueries(["admin-banners"]);
            toast.success("Banner atualizado com sucesso!");
            closeDialog();
        },
        onError: (error) => {
            toast.error(error.response?.data?.error || "Erro ao atualizar banner");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => bannersAPI.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries(["admin-banners"]);
            toast.success("Banner excluído com sucesso!");
        },
        onError: (error) => {
            toast.error(error.response?.data?.error || "Erro ao excluir banner");
        },
    });

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("title", form.title);
        formData.append("description", form.description);
        formData.append("linkUrl", form.linkUrl);
        formData.append("order", form.order);
        formData.append("isActive", form.isActive);
        if (imageFile) {
            formData.append("bannerThumbnail", imageFile);
        }

        if (editingBanner) {
            updateMutation.mutate({ id: editingBanner.id, formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleEdit = (banner) => {
        setEditingBanner(banner);
        setForm({
            title: banner.title,
            description: banner.description || "",
            linkUrl: banner.linkUrl || "",
            order: banner.order.toString(),
            isActive: banner.isActive,
        });
        setPreviewUrl(getAssetUrl(banner.imageUrl));
        setIsDialogOpen(true);
    };

    const handleDelete = (id) => {
        if (window.confirm("Tem certeza que deseja excluir este banner?")) {
            deleteMutation.mutate(id);
        }
    };

    const closeDialog = () => {
        setIsDialogOpen(false);
        setEditingBanner(null);
        setPreviewUrl(null);
        setImageFile(null);
        setForm({
            title: "",
            description: "",
            linkUrl: "",
            order: "0",
            isActive: true,
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Gerenciamento de Banners</h2>
                    <p className="text-muted-foreground">Adicione e gerencie os banners da página inicial.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => !open && closeDialog()}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setIsDialogOpen(true)} className="h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black text-white shadow-xl shadow-blue-100 active:scale-95 transition-all px-6">
                            <Plus className="mr-2 h-5 w-5" /> Novo Banner
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="p-0 gap-0 overflow-hidden sm:rounded-[2.5rem] border-none shadow-2xl max-w-[650px] w-full bg-white dark:bg-slate-900 mx-auto">
                        <DialogHeader className="p-10 pb-8 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-6">
                                <div className="bg-blue-600 text-white p-4 rounded-3xl shadow-lg shadow-blue-100 dark:shadow-none">
                                    <ImageIcon className="h-7 w-7" />
                                </div>
                                <div>
                                    <DialogTitle className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-tight">
                                        {editingBanner ? "Editar Banner" : "Novo Banner"}
                                    </DialogTitle>
                                    <DialogDescription className="font-bold text-slate-500 text-base mt-1">
                                        Destaques visuais para a página inicial.
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="flex flex-col bg-white dark:bg-slate-900 max-h-[85vh]">
                            <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar bg-white dark:bg-slate-900">
                                <div className="space-y-4">
                                    <Label htmlFor="title" className="font-black text-slate-700 dark:text-slate-300 ml-1 uppercase text-[10px] tracking-[0.2em]">Título do Destaque *</Label>
                                    <Input
                                        id="title"
                                        value={form.title}
                                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                                        placeholder="Ex: Inscrições Abertas - Jornada 2026"
                                        className="h-14 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 transition-all font-bold text-slate-900 dark:text-white"
                                        required
                                    />
                                </div>

                                <div className="space-y-4">
                                    <Label htmlFor="description" className="font-black text-slate-700 dark:text-slate-300 ml-1 uppercase text-[10px] tracking-[0.2em]">Breve Legenda (Opcional)</Label>
                                    <Textarea
                                        id="description"
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        placeholder="Texto que aparecerá sobre a imagem do banner..."
                                        rows={2}
                                        className="rounded-[1.5rem] border-slate-100 bg-slate-50/50 dark:bg-slate-800/50 p-6 min-h-[80px] resize-none focus-visible:ring-blue-500 transition-all shadow-inner font-medium"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <Label htmlFor="linkUrl" className="font-black text-slate-700 dark:text-slate-300 ml-1 uppercase text-[10px] tracking-[0.2em]">Link de Redirecionamento</Label>
                                    <div className="relative group">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                            <ExternalLink className="h-5 w-5" />
                                        </div>
                                        <Input
                                            id="linkUrl"
                                            value={form.linkUrl}
                                            onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                                            placeholder="https://exemplo.com/evento-especifico"
                                            className="h-14 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 transition-all font-bold text-slate-900 dark:text-white pl-14"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <Label htmlFor="order" className="font-black text-slate-700 dark:text-slate-300 ml-1 uppercase text-[10px] tracking-[0.2em]">Prioridade (Ordem)</Label>
                                        <Input
                                            id="order"
                                            type="number"
                                            value={form.order}
                                            onChange={(e) => setForm({ ...form, order: e.target.value })}
                                            className="h-14 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 transition-all font-bold text-slate-900 dark:text-white"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between p-4 px-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner h-14 mt-auto">
                                        <div className="flex flex-col">
                                            <Label htmlFor="is-active" className="font-black text-slate-400 uppercase text-[9px] tracking-widest">Exibição</Label>
                                            <span className="font-black text-slate-900 dark:text-white text-xs uppercase">{form.isActive ? 'Ativo' : 'Pausado'}</span>
                                        </div>
                                        <Switch
                                            id="is-active"
                                            checked={form.isActive}
                                            onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
                                            className="data-[state=checked]:bg-emerald-500"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <Label className="font-black text-slate-700 dark:text-slate-300 ml-1 uppercase text-[10px] tracking-[0.2em]">Imagem do Banner *</Label>
                                    <div className="flex flex-col gap-6">
                                        <div className={`relative w-full aspect-[21/9] rounded-[2rem] overflow-hidden border-4 border-white dark:border-slate-800 shadow-2xl flex items-center justify-center bg-slate-50 dark:bg-slate-800 group transition-all duration-500 ${!previewUrl ? 'border-dashed border-slate-200' : ''}`}>
                                            {previewUrl ? (
                                                <img
                                                    src={previewUrl}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover animate-in fade-in duration-700"
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center text-slate-300">
                                                    <ImageIcon className="h-14 w-14 mb-3 opacity-20" />
                                                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">Nenhuma Imagem</p>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                                <Upload className="h-10 w-10 text-white animate-bounce" />
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-center gap-4">
                                            <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-tight leading-relaxed italic">
                                                Resolução ideal: 1920x800px (21:9) • Máx: 5MB
                                            </p>
                                            <Label
                                                htmlFor="banner-image"
                                                className="flex h-12 w-full max-w-[300px] cursor-pointer items-center justify-center rounded-2xl border border-slate-200 bg-white dark:bg-slate-800 px-8 text-sm font-black text-slate-900 dark:text-white hover:bg-slate-50 transition-all shadow-sm"
                                            >
                                                <Upload className="mr-2 h-5 w-5 text-blue-500" />
                                                {imageFile ? "Trocar Imagem" : "Escolher Arquivo..."}
                                                <Input
                                                    id="banner-image"
                                                    type="file"
                                                    className="sr-only"
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                />
                                            </Label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="p-8 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4">
                                <Button type="button" variant="ghost" onClick={closeDialog} className="h-14 rounded-2xl font-black uppercase tracking-widest order-2 sm:order-1 sm:flex-1 text-slate-500 hover:text-slate-900">
                                    Cancelar
                                </Button>
                                <Button 
                                    type="submit" 
                                    disabled={createMutation.isPending || updateMutation.isPending} 
                                    className="h-14 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-2xl shadow-blue-100 dark:shadow-none active:scale-95 transition-all text-lg uppercase tracking-wider order-1 sm:order-2 sm:flex-[2]"
                                >
                                    {createMutation.isPending || updateMutation.isPending ? <Loader2 className="animate-spin h-6 w-6 mr-2" /> : (editingBanner ? "Salvar Alterações" : "Publicar Banner")}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Imagem</TableHead>
                                <TableHead>Título</TableHead>
                                <TableHead>Ordem</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        Carregando banners...
                                    </TableCell>
                                </TableRow>
                            ) : banners?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        Nenhum banner cadastrado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                banners?.map((banner) => (
                                    <TableRow key={banner.id}>
                                        <TableCell>
                                            <img
                                                src={getAssetUrl(banner.imageUrl)}
                                                alt={banner.title}
                                                className="w-20 aspect-video object-cover rounded border"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{banner.title}</div>
                                            {banner.description && (
                                                <div className="text-xs text-muted-foreground line-clamp-1">
                                                    {banner.description}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 font-mono">{banner.order}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div
                                                className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${banner.isActive
                                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                    }`}
                                            >
                                                {banner.isActive ? "Ativo" : "Inativo"}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {banner.linkUrl && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        asChild
                                                        title="Ver Link"
                                                    >
                                                        <a href={banner.linkUrl} target="_blank" rel="noreferrer">
                                                            <ExternalLink className="h-4 w-4" />
                                                        </a>
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(banner)}
                                                    title="Editar"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(banner.id)}
                                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
                                                    title="Excluir"
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
};

export default BannerManagement;
