import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { tracksAPI } from "../lib/api";
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
    DialogFooter
} from "../components/ui/dialog";
import {
    ArrowLeft,
    Search,
    Download,
    Users,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Eye,
    CheckCircle2,
    Circle,
    Calendar
} from "lucide-react";
import { toast } from "sonner";
import { Progress } from "../components/ui/progress";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";

const TrackEnrollments = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1); // Reset page on search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Fetch Track Details
    const { data: track, isLoading: isLoadingTrack } = useQuery({
        queryKey: ["admin-track", id],
        queryFn: () => tracksAPI.getById(id).then(res => res.data),
    });

    // Fetch Enrollments
    const { data: enrollmentsData, isLoading: isLoadingEnrollments } = useQuery({
        queryKey: ["track-enrollments", id, page, debouncedSearch, limit],
        queryFn: async () => {
            const res = await tracksAPI.getEnrollments(id, {
                page,
                limit,
                search: debouncedSearch,
            });
            return res.data;
        },
    });

    const enrollments = enrollmentsData?.enrollments || [];
    const pagination = enrollmentsData?.pagination || { page: 1, pages: 1, total: 0 };

    // Export CSV
    const handleExportCSV = async () => {
        try {
            toast.loading("Gerando CSV...", { id: "export-csv" });
            const response = await tracksAPI.exportEnrollments(id, {
                search: debouncedSearch
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `inscritos_trilha_${id}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success("CSV exportado com sucesso!", { id: "export-csv" });
        } catch (error) {
            console.error("Erro ao exportar CSV:", error);
            toast.error("Erro ao exportar planilha.", { id: "export-csv" });
        }
    };

    if (isLoadingTrack) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 space-y-6 px-4">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/admin/tracks")} className="rounded-full">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-black tracking-tight uppercase">{track?.title}</h1>
                    <p className="text-slate-500">Gestão de Participantes e Progresso</p>
                </div>
            </div>

            <Card className="border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-xl">
                                <Users className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold">Inscritos ({pagination.total})</CardTitle>
                                <CardDescription>Acompanhe o andamento dos alunos na trilha.</CardDescription>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Nome ou email..."
                                    className="pl-10 w-full md:w-[250px] rounded-xl border-slate-200"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-400 uppercase hidden sm:inline">Exibir:</span>
                                <Select
                                    value={limit.toString()}
                                    onValueChange={(val) => {
                                        setLimit(parseInt(val));
                                        setPage(1);
                                    }}
                                >
                                    <SelectTrigger className="w-[80px] h-10 rounded-xl border-slate-200">
                                        <SelectValue placeholder="20" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="20">20</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button variant="outline" size="sm" onClick={handleExportCSV} className="rounded-xl font-bold border-slate-200">
                                <Download className="h-4 w-4 mr-2" />
                                Exportar CSV
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoadingEnrollments ? (
                        <div className="p-12 text-center">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
                        </div>
                    ) : enrollments.length === 0 ? (
                        <div className="p-20 text-center">
                            <Users className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                            <p className="text-slate-500 font-medium">Nenhum aluno inscrito nesta trilha.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                                        <TableHead className="font-bold py-4">Aluno</TableHead>
                                        <TableHead className="font-bold">E-mail</TableHead>
                                        <TableHead className="font-bold text-center">Progresso</TableHead>
                                        <TableHead className="font-bold">Status</TableHead>
                                        <TableHead className="font-bold text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {enrollments.map((enrollment) => (
                                        <TableRow key={enrollment.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 border-slate-100 dark:border-slate-800 transition-colors">
                                            <TableCell className="py-4">
                                                <div className="font-bold text-slate-900 dark:text-white">{enrollment.user.name}</div>
                                                <div className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider">{enrollment.user.profession?.name || 'Participante'}</div>
                                            </TableCell>
                                            <TableCell className="text-slate-600 dark:text-slate-400 text-sm">
                                                {enrollment.user.email}
                                            </TableCell>
                                            <TableCell className="min-w-[200px]">
                                                <div className="space-y-1.5 max-w-[180px] mx-auto">
                                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                        <span>{Math.round(enrollment.progress)}% ({enrollment.checkinCount}/{enrollment.totalEvents})</span>
                                                        {enrollment.progress >= 100 && <span className="text-green-500">Completo</span>}
                                                    </div>
                                                    <Progress value={enrollment.progress} className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800" indicatorClassName={enrollment.progress >= 100 ? "bg-green-500" : "bg-blue-500"} />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={enrollment.progress >= 100 ? "bg-green-100 text-green-700 border-green-200" : "bg-blue-100 text-blue-700 border-blue-200"}>
                                                    {enrollment.progress >= 100 ? 'Concluído' : 'Em Andamento'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="rounded-xl gap-2 hover:bg-blue-50 text-slate-600 hover:text-blue-600 font-bold transition-all active:scale-95">
                                                            <Eye className="w-4 h-4" />
                                                            Detalhes
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="p-0 gap-0 overflow-hidden sm:rounded-3xl border-none shadow-2xl max-w-md w-full bg-white dark:bg-slate-900 mx-auto">
                                                        <DialogHeader className="p-8 pb-4 bg-slate-50/50 dark:bg-slate-800/50">
                                                            <div className="flex items-center gap-4">
                                                                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl text-blue-600">
                                                                    <Users className="w-6 h-6" />
                                                                </div>
                                                                <div>
                                                                    <DialogTitle className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
                                                                        {enrollment.user.name}
                                                                    </DialogTitle>
                                                                    <DialogDescription className="font-medium text-slate-500">
                                                                        Progresso na Trilha de Aprendizagem
                                                                    </DialogDescription>
                                                                </div>
                                                            </div>
                                                        </DialogHeader>

                                                        <div className="p-8 space-y-8 bg-white dark:bg-slate-900 overflow-y-auto max-h-[70vh] custom-scrollbar">
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center shadow-inner">
                                                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Conclusão</div>
                                                                    <div className="text-3xl font-black text-slate-900 dark:text-white">{Math.round(enrollment.progress)}%</div>
                                                                </div>
                                                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center shadow-inner">
                                                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Etapas</div>
                                                                    <div className="text-3xl font-black text-blue-600">{enrollment.checkinCount} / {enrollment.totalEvents}</div>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-4">
                                                                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 ml-1">
                                                                    <Calendar className="w-3.5 h-3.5" />
                                                                    Status por Evento
                                                                </h4>
                                                                <div className="space-y-3 pr-1">
                                                                    {enrollment.eventStatuses?.map((status, idx) => (
                                                                        <div key={idx} className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${status.checkedIn ? 'bg-emerald-50/30 border-emerald-100' : 'bg-white border-slate-100 dark:bg-slate-900 dark:border-slate-800'}`}>
                                                                            <div className="flex items-center gap-3 min-w-0">
                                                                                {status.checkedIn ? (
                                                                                    <div className="bg-emerald-500 text-white p-1 rounded-full shadow-lg shadow-emerald-100">
                                                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="text-slate-200 p-1 rounded-full border-2 border-slate-100">
                                                                                        <Circle className="w-3.5 h-3.5 fill-current opacity-20" />
                                                                                    </div>
                                                                                )}
                                                                                <span className={`text-sm font-bold truncate ${status.checkedIn ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                                                                    {status.title}
                                                                                </span>
                                                                            </div>
                                                                            <Badge variant="ghost" className={`text-[9px] px-2 py-0.5 rounded-lg uppercase font-black shrink-0 ${status.checkedIn ? 'text-emerald-600 bg-emerald-100/50' : 'text-slate-400 bg-slate-100/50'}`}>
                                                                                {status.checkedIn ? 'OK' : 'Pendente'}
                                                                            </Badge>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="p-6 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 text-center">
                                                            <p className="text-xs text-slate-400 font-medium italic">Acompanhamento institucional ProfPresente.</p>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {pagination.pages > 1 && (
                <div className="flex items-center justify-between px-2">
                    <p className="text-sm text-slate-500 font-medium">
                        Página {pagination.page} de {pagination.pages}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="rounded-xl border-slate-200"
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                            disabled={page === pagination.pages}
                            className="rounded-xl border-slate-200"
                        >
                            Próxima <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                    <div className="hidden md:flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 uppercase">Itens por página:</span>
                        <Select
                            value={limit.toString()}
                            onValueChange={(val) => {
                                setLimit(parseInt(val));
                                setPage(1);
                            }}
                        >
                            <SelectTrigger className="w-[70px] h-8 text-xs rounded-lg border-slate-200">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="20">20</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrackEnrollments;
