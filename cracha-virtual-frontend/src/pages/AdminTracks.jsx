import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tracksAPI, eventsAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Plus, Pencil, Trash2, Loader2, Search, Link as LinkIcon, X, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '../components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { getAssetUrl } from '../lib/utils';

const AdminTracks = () => {
    const queryClient = useQueryClient();
    // const { notify } = useNotification(); // Removido
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTrack, setEditingTrack] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    // Estados do formulário
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        imageUrl: '',
        eventIds: []
    });

    // Buscar todas as trilhas
    const { data: tracks, isLoading: loadingTracks } = useQuery({
        queryKey: ['admin-tracks'],
        queryFn: async () => {
            const resp = await tracksAPI.getAll();
            return Array.isArray(resp.data) ? resp.data : [];
        }
    });

    // Buscar todos os eventos (para vincular)
    const { data: eventsData, isLoading: loadingEvents } = useQuery({
        queryKey: ['admin-events-list'],
        queryFn: async () => {
            const resp = await eventsAPI.getAll({ limit: 100 });
            return resp.data.events;
        }
    });

    // Mutação para criar/atualizar
    const saveMutation = useMutation({
        mutationFn: (data) => {
            if (editingTrack) return tracksAPI.update(editingTrack.id, data);
            return tracksAPI.create(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-tracks']);
            toast.success(editingTrack ? 'Trilha atualizada!' : 'Trilha criada!');
            closeDialog();
        },
        onError: (err) => {
            const errorMsg = err.response?.data?.details
                ? `${err.response.data.error}: ${err.response.data.details}`
                : (err.response?.data?.error || 'Erro ao salvar trilha');
            toast.error(errorMsg);
        }
    });

    // Mutação para deletar
    const deleteMutation = useMutation({
        mutationFn: (id) => tracksAPI.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-tracks']);
            toast.success('Trilha removida!');
        }
    });

    const openDialog = (track = null) => {
        if (track) {
            setEditingTrack(track);
            // O track da API vem com events: [{ eventId, order, event: {...} }]
            setFormData({
                title: track.title,
                description: track.description,
                imageUrl: track.imageUrl || '',
                eventIds: track.events?.map(e => e.eventId) || []
            });
        } else {
            setEditingTrack(null);
            setFormData({ title: '', description: '', imageUrl: '', eventIds: [] });
            setSelectedFile(null);
            setImagePreview(null);
        }
        setIsDialogOpen(true);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const closeDialog = () => {
        setIsDialogOpen(false);
        setEditingTrack(null);
        setSelectedFile(null);
        setImagePreview(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const data = new FormData();
        data.append('title', formData.title);
        data.append('description', formData.description);
        data.append('eventIds', JSON.stringify(formData.eventIds));

        if (selectedFile) {
            data.append('trackThumbnail', selectedFile);
        } else if (formData.imageUrl) {
            data.append('imageUrl', formData.imageUrl);
        }

        saveMutation.mutate(data);
    };

    const toggleEventSelection = (eventId) => {
        setFormData(prev => {
            const isSelected = prev.eventIds.includes(eventId);
            if (isSelected) {
                return { ...prev, eventIds: prev.eventIds.filter(id => id !== eventId) };
            } else {
                return { ...prev, eventIds: [...prev.eventIds, eventId] };
            }
        });
    };

    return (
        <div className="container mx-auto py-8 px-4 max-w-7xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Gerenciar Trilhas</h1>
                    <p className="text-slate-500">Crie e organize trilhas de formação continuada.</p>
                </div>
                <Button onClick={() => openDialog()} className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-6">
                    <Plus className="w-5 h-5 mr-2" /> Nova Trilha
                </Button>
            </div>

            <Card className="border-slate-200 dark:border-slate-800 overflow-hidden rounded-2xl">
                <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                        <TableRow>
                            <TableHead className="font-bold">Trilha</TableHead>
                            <TableHead className="font-bold text-center">Eventos</TableHead>
                            <TableHead className="font-bold text-center">Inscritos</TableHead>
                            <TableHead className="font-bold">Criada em</TableHead>
                            <TableHead className="text-right font-bold">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loadingTracks ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-10">
                                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
                                </TableCell>
                            </TableRow>
                        ) : tracks?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-10 text-slate-500 italic">
                                    Nenhuma trilha cadastrada.
                                </TableCell>
                            </TableRow>
                        ) : (
                            tracks?.map((track) => (
                                <TableRow key={track.id} className="group hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0">
                                                {track.imageUrl ? (
                                                    <img src={getAssetUrl(track.imageUrl)} className="w-full h-full object-cover" alt="" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                        <LinkIcon className="w-5 h-5" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 dark:text-white">{track.title}</div>
                                                <div className="text-xs text-slate-500 line-clamp-1 max-w-xs">{track.description}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="secondary" className="font-bold bg-slate-100 text-slate-700">
                                            {track._count.events} Etapas
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline" className="font-bold border-blue-200 text-blue-700 bg-blue-50/50">
                                            {track._count.enrollments} Alunos
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-slate-500 text-sm">
                                        {new Date(track.createdAt).toLocaleDateString('pt-BR')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Link to={`/admin/tracks/${track.id}/enrollments`}>
                                                <Button variant="ghost" size="icon" title="Ver Inscritos e Progresso" className="hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20">
                                                    <Users className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                            <Button variant="ghost" size="icon" onClick={() => openDialog(track)} className="hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20">
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    if (confirm('Deseja realmente excluir esta trilha?')) {
                                                        deleteMutation.mutate(track.id);
                                                    }
                                                }}
                                                className="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* DIALOG DE CRIAÇÃO/EDIÇÃO */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl w-full p-0 gap-0 overflow-hidden sm:rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-slate-900 mx-auto">
                    <DialogHeader className="p-10 pb-8 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-6">
                            <div className="bg-blue-600 text-white p-4 rounded-3xl shadow-lg shadow-blue-100 dark:shadow-none">
                                <LinkIcon className="h-7 w-7" />
                            </div>
                            <div>
                                <DialogTitle className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-tight">
                                    {editingTrack ? 'Editar Trilha' : 'Nova Trilha'}
                                </DialogTitle>
                                <DialogDescription className="font-bold text-slate-500 text-base mt-1">
                                    Configuração de formação continuada.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[80vh] bg-white dark:bg-slate-900">
                        <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                            <div className="space-y-8">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="h-6 w-1 bg-blue-600 rounded-full" />
                                        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">Metadados da Trilha</h3>
                                    </div>
                                    <div className="space-y-4">
                                        <Label className="font-black text-slate-700 dark:text-slate-300 ml-1 uppercase text-[10px] tracking-[0.2em]">Título da Trilha *</Label>
                                        <Input
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            placeholder="Ex: Formação em IA para Professores"
                                            className="h-14 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 transition-all font-bold text-slate-900 dark:text-white"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <Label className="font-black text-slate-700 dark:text-slate-300 ml-1 uppercase text-[10px] tracking-[0.2em]">Descrição Detalhada *</Label>
                                        <Textarea
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Descreva o objetivo da trilha, público-alvo e o que será abordado..."
                                            className="rounded-[2rem] border-slate-100 bg-slate-50/50 dark:bg-slate-800/50 p-6 min-h-[140px] resize-none focus-visible:ring-blue-500 transition-all shadow-inner font-medium"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="h-6 w-1 bg-emerald-500 rounded-full" />
                                        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">Identidade Visual</h3>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-center gap-8 p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-inner">
                                        <div className="w-28 h-28 rounded-3xl overflow-hidden border-4 border-white dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-800 flex-shrink-0 group relative cursor-pointer">
                                            {imagePreview || formData.imageUrl ? (
                                                <img src={imagePreview ? imagePreview : getAssetUrl(formData.imageUrl)} className="w-full h-full object-cover" alt="Preview" />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                                                    <ImageIcon className="w-8 h-8 opacity-20" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Upload className="w-6 h-6 text-white" />
                                            </div>
                                        </div>
                                        <div className="flex-1 w-full space-y-4">
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Upload da Capa</p>
                                            <Label htmlFor="track-image" className="flex h-12 w-full cursor-pointer items-center justify-center rounded-2xl border border-slate-200 bg-white dark:bg-slate-800 px-6 text-sm font-black text-slate-900 dark:text-white hover:bg-slate-50 transition-all shadow-sm">
                                                {selectedFile ? 'Trocar Arquivo' : 'Escolher Imagem...'}
                                                <Input
                                                    id="track-image"
                                                    type="file"
                                                    onChange={handleFileChange}
                                                    accept="image/*"
                                                    className="sr-only"
                                                />
                                            </Label>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight px-1 italic">Recomendado: 1200x630px • PNG ou WEBP</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-6 w-1 bg-amber-500 rounded-full" />
                                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">Eventos Vinculados</h3>
                                        </div>
                                        <Badge className="bg-blue-600 text-white border-none py-1.5 px-3 rounded-full font-black text-[10px] uppercase shadow-lg shadow-blue-100 dark:shadow-none">
                                            {formData.eventIds.length} {formData.eventIds.length === 1 ? 'Selecionado' : 'Selecionados'}
                                        </Badge>
                                    </div>

                                    <div className="border border-slate-100 dark:border-slate-800 rounded-[2rem] overflow-hidden bg-white dark:bg-slate-900 shadow-inner">
                                        <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800 custom-scrollbar">
                                            {loadingEvents ? (
                                                <div className="p-16 text-center">
                                                    <Loader2 className="w-10 h-10 animate-spin mx-auto text-blue-500 opacity-20" />
                                                </div>
                                            ) : eventsData?.length === 0 ? (
                                                <div className="p-16 text-center text-slate-400 italic text-sm font-medium">Nenhum evento disponível para vinculação.</div>
                                            ) : (
                                                eventsData?.map((event) => {
                                                    const isSelected = formData.eventIds.includes(event.id);
                                                    return (
                                                        <div
                                                            key={event.id}
                                                            onClick={() => toggleEventSelection(event.id)}
                                                            className={`p-6 flex items-center justify-between cursor-pointer group transition-all duration-300 ${isSelected ? 'bg-blue-50/40 dark:bg-blue-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}
                                                        >
                                                            <div className="flex items-center gap-5">
                                                                <div className={`w-7 h-7 rounded-xl border-2 transition-all flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-200 dark:shadow-none scale-110' : 'border-slate-200 group-hover:border-blue-400'}`}>
                                                                    {isSelected && <Plus className="w-4 h-4 text-white stroke-[4px]" />}
                                                                </div>
                                                                <div>
                                                                    <div className={`text-base font-black transition-colors ${isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-slate-700 dark:text-slate-300'}`}>{event.title}</div>
                                                                    <div className="flex items-center text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                                                                        <Users className="w-3 h-3 mr-1.5" />
                                                                        Data: {new Date(event.startDate).toLocaleDateString('pt-BR')}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="p-8 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4">
                            <Button type="button" variant="ghost" onClick={closeDialog} className="h-14 rounded-2xl font-black uppercase tracking-widest order-2 sm:order-1 sm:flex-1 text-slate-500 hover:text-slate-900">
                                Descartar
                            </Button>
                            <Button
                                type="submit"
                                disabled={saveMutation.isLoading}
                                className="h-14 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-2xl shadow-blue-100 dark:shadow-none active:scale-95 transition-all text-lg uppercase tracking-wider order-1 sm:order-2 sm:flex-[2]"
                            >
                                {saveMutation.isLoading ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : (editingTrack ? 'Salvar Alterações' : 'Confirmar e Criar')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminTracks;
