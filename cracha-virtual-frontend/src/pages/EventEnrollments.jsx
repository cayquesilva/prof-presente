import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../components/ui/table";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "../components/ui/card";
import {
    ArrowLeft,
    Mail,
    Search,
    Download,
    MoreHorizontal,
    CheckCircle2,
    XCircle,
    Clock,
    Trash2,
    ArrowRightLeft,
    MapPin,
} from "lucide-react";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { getAssetUrl } from "../lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
    DialogTrigger,
} from "../components/ui/dialog";
import { Checkbox } from "../components/ui/checkbox";

const EventEnrollments = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);
    const limit = 20;

    const [checkinFilter, setCheckinFilter] = useState("ALL");
    const [selectedEnrollments, setSelectedEnrollments] = useState([]);

    useEffect(() => {
        setSelectedEnrollments([]);
    }, [page, debouncedSearch, checkinFilter]);

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1); // Reset page on search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Fetch Event Details
    const { data: event, isLoading: isLoadingEvent } = useQuery({
        queryKey: ["event", id],
        queryFn: async () => {
            const res = await api.get(`/events/${id}`);
            return res.data;
        },
    });

    // Fetch Enrollments
    const { data: enrollmentsData, isLoading: isLoadingEnrollments } = useQuery({
        queryKey: ["event-enrollments", id, page, debouncedSearch],
        queryFn: async () => {
            const res = await api.get(`/enrollments/events/${id}`, {
                params: {
                    page,
                    limit,
                    search: debouncedSearch,
                    checkinStatus: checkinFilter !== "ALL" ? checkinFilter : undefined
                }
            });
            return res.data;
        },
    });

    const enrollments = enrollmentsData?.enrollments || [];
    const pagination = enrollmentsData?.pagination || { page: 1, pages: 1, total: 0 };

    // CSV Export
    const handleExportCSV = async () => {
        try {
            toast.loading("Gerando arquivo CSV...", { id: "export-csv" });
            const response = await api.get(`/enrollments/events/${id}/export`, {
                params: {
                    search: debouncedSearch,
                    checkinStatus: checkinFilter !== "ALL" ? checkinFilter : undefined
                },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const filename = `inscritos_evento_${id}.csv`;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success("CSV exportado com sucesso!", { id: "export-csv" });
        } catch (error) {
            console.error("Erro ao exportar CSV:", error);
            toast.error("Erro ao exportar planilha.", { id: "export-csv" });
        }
    };

    // Resend Email Mutation
    const resendEmailMutation = useMutation({
        mutationFn: async (enrollmentId) => {
            await api.post(`/enrollments/${enrollmentId}/resend-confirmation`);
        },
        onSuccess: () => {
            toast.success("E-mail reenviado com sucesso!");
        },
        onError: (error) => {
            toast.error(error.response?.data?.error || "Erro ao reenviar e-mail.");
        },
    });

    const handleResendEmail = (enrollmentId) => {
        if (window.confirm("Deseja reenviar o e-mail de confirmação para este usuário?")) {
            resendEmailMutation.mutate(enrollmentId);
        }
    };

    // Delete Participant Mutation
    const deleteParticipantMutation = useMutation({
        mutationFn: async (enrollmentId) => {
            await api.delete(`/enrollments/${enrollmentId}/permanent`);
        },
        onSuccess: () => {
            toast.success("Inscrição excluída permanentemente!");
            queryClient.invalidateQueries(["event-enrollments", id]);
            queryClient.invalidateQueries(["event", id]);
        },
        onError: (error) => {
            toast.error(error.response?.data?.error || "Erro ao excluir participante.");
        },
    });

    const handleDeleteParticipant = (enrollmentId) => {
        if (window.confirm("ATENÇÃO: Isso excluirá permanentemente a inscrição e liberará a vaga. Esta ação não pode ser desfeita. Deseja continuar?")) {
            deleteParticipantMutation.mutate(enrollmentId);
        }
    };

    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedEnrollments(enrollments.map(e => e.id));
        } else {
            setSelectedEnrollments([]);
        }
    };

    const handleSelectOne = (checked, enrollmentId) => {
        if (checked) {
            setSelectedEnrollments(prev => [...prev, enrollmentId]);
        } else {
            setSelectedEnrollments(prev => prev.filter(id => id !== enrollmentId));
        }
    };

    const handleBulkMove = () => {
        if (selectedEnrollments.length === 0) return;
        setIsMoveModalOpen(true);
        setSelectedEnrollment(null); // indica que é em massa
    };

    // Move Participant Logic
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
    const [selectedEnrollment, setSelectedEnrollment] = useState(null);
    const [targetEventId, setTargetEventId] = useState("");
    const [eventSearch, setEventSearch] = useState("");

    const { data: eventsList } = useQuery({
        queryKey: ["admin-events-list", eventSearch],
        queryFn: async () => {
            const res = await api.get("/events", {
                params: { search: eventSearch, limit: 5 }
            });
            return res.data.events;
        },
        enabled: isMoveModalOpen
    });

    const moveParticipantMutation = useMutation({
        mutationFn: async ({ enrollmentId, targetEventId }) => {
            if (enrollmentId === "BULK") {
                await Promise.all(
                    selectedEnrollments.map((paramId) =>
                        api.patch(`/enrollments/${paramId}/move`, { targetEventId })
                    )
                );
            } else {
                await api.patch(`/enrollments/${enrollmentId}/move`, { targetEventId });
            }
        },
        onSuccess: () => {
            toast.success(selectedEnrollment ? "Participante movido com sucesso!" : "Participantes movidos com sucesso!");
            setIsMoveModalOpen(false);
            setTargetEventId("");
            setSelectedEnrollments([]);
            queryClient.invalidateQueries(["event-enrollments", id]);
            queryClient.invalidateQueries(["event", id]);
        },
        onError: (error) => {
            toast.error(error.response?.data?.error || "Erro ao mover participante.");
        },
    });

    const handleMoveParticipant = (enrollment) => {
        setSelectedEnrollment(enrollment);
        setIsMoveModalOpen(true);
    };

    if (isLoadingEvent) {
        return <div className="p-8 text-center">Carregando evento...</div>;
    }

    if (!event) {
        return <div className="p-8 text-center text-red-500">Evento não encontrado.</div>;
    }

    return (
        <div className="container mx-auto py-8 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
                    <p className="text-muted-foreground">Gerenciamento de Inscrições</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle>Participantes ({pagination.total})</CardTitle>
                            <CardDescription>
                                Visualize e gerencie os inscritos neste evento.
                            </CardDescription>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {selectedEnrollments.length > 0 && (
                                <Button variant="secondary" size="sm" onClick={handleBulkMove} className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200">
                                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                                    Mover ({selectedEnrollments.length})
                                </Button>
                            )}
                            <select
                                value={checkinFilter}
                                onChange={(e) => setCheckinFilter(e.target.value)}
                                className="px-3 py-2 border rounded-md bg-background text-sm text-muted-foreground outline-none"
                            >
                                <option value="ALL">Todos os Status</option>
                                <option value="WITH_CHECKIN">Com Check-in</option>
                                <option value="WITHOUT_CHECKIN">Sem Check-in</option>
                            </select>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por nome ou email..."
                                    className="pl-8 w-[250px] or w-full"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" size="sm" onClick={handleExportCSV}>
                                <Download className="h-4 w-4 mr-2" />
                                Exportar CSV
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoadingEnrollments ? (
                        <div className="p-8 text-center">Carregando inscrições...</div>
                    ) : enrollments.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">Nenhuma inscrição encontrada{debouncedSearch && " para a busca atual"}.</div>
                    ) : (
                        <div className="space-y-4">
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12">
                                                <Checkbox
                                                    checked={enrollments.length > 0 && selectedEnrollments.length === enrollments.length}
                                                    onCheckedChange={handleSelectAll}
                                                    aria-label="Selecionar tudo"
                                                />
                                            </TableHead>
                                            <TableHead>Nome</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Check-in</TableHead>
                                            <TableHead>Data Inscrição</TableHead>
                                            <TableHead className="text-right">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {enrollments.map((enrollment) => (
                                            <TableRow key={enrollment.id}>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedEnrollments.includes(enrollment.id)}
                                                        onCheckedChange={(checked) => handleSelectOne(checked, enrollment.id)}
                                                        aria-label={`Selecionar ${enrollment.user.name}`}
                                                    />
                                                </TableCell>
                                                <TableCell className="font-medium">{enrollment.user.name}</TableCell>
                                                <TableCell>{enrollment.user.email}</TableCell>
                                                <TableCell>
                                                    <Badge variant={enrollment.status === 'APPROVED' ? 'default' : 'secondary'}>
                                                        {enrollment.status === 'APPROVED' ? 'Confirmado' : enrollment.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {enrollment.checkInTime ? (
                                                        <span className="text-green-600 font-medium whitespace-nowrap text-sm">
                                                            Presente ({new Date(enrollment.checkInTime).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })})
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>{new Date(enrollment.createdAt).toLocaleDateString()}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {enrollment.status === 'APPROVED' && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleResendEmail(enrollment.id)}
                                                                disabled={resendEmailMutation.isPending}
                                                                title="Reenviar E-mail de Confirmação"
                                                            >
                                                                <Mail className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-blue-600 hover:text-blue-700"
                                                            onClick={() => handleMoveParticipant(enrollment)}
                                                            title="Mover Participante"
                                                        >
                                                            <ArrowRightLeft className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-red-600 hover:text-red-700"
                                                            onClick={() => handleDeleteParticipant(enrollment.id)}
                                                            disabled={deleteParticipantMutation.isPending}
                                                            title="Excluir Participante (Libera Vaga)"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {pagination.pages > 1 && (
                                <div className="flex items-center justify-between py-4">
                                    <div className="text-sm text-muted-foreground">
                                        Página {pagination.page} de {pagination.pages}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                        >
                                            Anterior
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                                            disabled={page === pagination.pages}
                                        >
                                            Próxima
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Move Participant Modal */}
            <Dialog open={isMoveModalOpen} onOpenChange={setIsMoveModalOpen}>
                <DialogContent className="p-0 gap-0 overflow-hidden sm:rounded-3xl border-none shadow-2xl max-w-[500px] w-full bg-white dark:bg-slate-900 mx-auto">
                    <DialogHeader className="p-8 pb-4 bg-slate-50/50 dark:bg-slate-800/50">
                        <DialogTitle className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Mover Participante</DialogTitle>
                        <DialogDescription className="font-medium text-slate-600 dark:text-slate-400">
                            {selectedEnrollment ? (
                                <>Selecione o evento de destino para <strong>{selectedEnrollment?.user.name}</strong>.</>
                            ) : (
                                <>Selecione o evento de destino para os <strong>{selectedEnrollments.length} participantes selecionados</strong>.</>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-8 space-y-6 bg-white dark:bg-slate-900">
                        <div className="space-y-2">
                            <Label className="font-bold text-slate-700 dark:text-slate-300 ml-1">Buscar Evento de Destino</Label>
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <Input
                                    placeholder="Digite o nome do evento..."
                                    className="pl-10 h-11 rounded-xl border-slate-200 focus:border-blue-500 transition-all"
                                    value={eventSearch}
                                    onChange={(e) => setEventSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Resultados da busca</Label>
                            <div className="border border-slate-100 rounded-2xl max-h-[250px] overflow-y-auto custom-scrollbar divide-y divide-slate-50">
                                {eventsList?.map((ev) => (
                                    <div
                                        key={ev.id}
                                        className={`p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 flex justify-between items-center transition-all ${targetEventId === ev.id ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                        onClick={() => setTargetEventId(ev.id)}
                                    >
                                        <div className="min-w-0 pr-4">
                                            <p className={`font-bold text-sm truncate ${targetEventId === ev.id ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>{ev.title}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <MapPin className="h-3 w-3 text-slate-400" />
                                                <p className="text-xs text-slate-500 truncate">{ev.location}</p>
                                            </div>
                                        </div>
                                        {targetEventId === ev.id && (
                                            <div className="bg-blue-600 text-white p-1 rounded-full shadow-lg shadow-blue-200">
                                                <CheckCircle2 className="h-4 w-4" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {eventsList?.length === 0 && (
                                    <div className="p-8 text-center bg-slate-50/30">
                                        <p className="text-sm text-slate-400 italic">Nenhum evento encontrado.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-6 bg-slate-50 dark:bg-slate-800 flex flex-col sm:flex-row gap-3">
                        <Button 
                            variant="ghost" 
                            className="h-11 rounded-xl font-bold order-2 sm:order-1"
                            onClick={() => setIsMoveModalOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            className="h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-xl shadow-blue-100 transition-all active:scale-95 disabled:opacity-50 order-1 sm:order-2"
                            disabled={!targetEventId || moveParticipantMutation.isPending}
                            onClick={() => moveParticipantMutation.mutate({
                                enrollmentId: selectedEnrollment ? selectedEnrollment.id : "BULK",
                                targetEventId
                            })}
                        >
                            {moveParticipantMutation.isPending ? "Movendo..." : "Confirmar Mudança"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default EventEnrollments;
