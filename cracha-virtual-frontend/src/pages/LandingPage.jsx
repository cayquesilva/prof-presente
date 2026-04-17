import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { eventsAPI, tracksAPI, proposalsAPI, categoriesAPI } from "../lib/api";
import { getAssetUrl } from "../lib/utils";
import { useAuth } from "../hooks/useAuth.jsx";
import { useTheme } from "../contexts/ThemeContext";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
    Search,
    Moon,
    Sun,
    Calendar,
    MapPin,
    Video,
    ArrowRight,
    LayoutGrid,
    GraduationCap,
    Laptop,
    Palette,
    Users,
    FlaskConical,
    ChevronRight,
    ChevronLeft,
    Share2,
    Mail,
    Menu,
    X,
    Loader2
} from "lucide-react";
import HeroCarousel from "../components/HeroCarousel";
import { useBranding } from "../contexts/BrandingContext";
import LogoDefault from "../assets/logo-prof-presente.svg";
import { Calendar as CalendarUI } from "../components/ui/calendar";
import { toast } from "sonner";
import { isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

import { useDebounce } from "../hooks/useDebounce";

const getMonthAbbr = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
};

const getDay = (dateString) => {
    const date = new Date(dateString);
    return date.getDate();
};

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric"
    });
};

const LandingPage = () => {
    const { user } = useAuth();
    const { platformName, logoUrl } = useBranding();
    const { theme, toggleTheme } = useTheme();
    const isDarkMode = theme === 'dark';
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchModalOpen, setSearchModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const [proposalModalOpen, setProposalModalOpen] = useState(false);
    const [proposalForm, setProposalForm] = useState({ name: "", email: "", phone: "", topic: "", description: "" });
    const [proposalLoading, setProposalLoading] = useState(false);

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [dateEventsModalOpen, setDateEventsModalOpen] = useState(false);
    const [selectedDateEvents, setSelectedDateEvents] = useState([]);

    const handleProposalSubmit = async (e) => {
        e.preventDefault();
        setProposalLoading(true);
        try {
            await proposalsAPI.submit(proposalForm);
            toast.success("Proposta enviada com sucesso!");
            setProposalModalOpen(false);
            setProposalForm({ name: "", email: "", phone: "", topic: "", description: "" });
        } catch (err) {
            toast.error("Erro ao enviar proposta. Tente novamente.");
        } finally {
            setProposalLoading(false);
        }
    };

    const handleDateSelect = (date) => {
        if (!date) return;
        setSelectedDate(date);

        // Find events for this date
        if (allEvents) {
            const eventsOnDate = allEvents.filter(event => {
                if (!event.startDate) return false;
                const eventDate = parseISO(event.startDate);
                return isSameDay(eventDate, date);
            });

            if (eventsOnDate.length > 0) {
                setSelectedDateEvents(eventsOnDate);
                setDateEventsModalOpen(true);
            }
        }
    };

    const handleShareTrack = async (track) => {
        const url = `${window.location.origin}/dashboard`;
        const title = track.title || "Trilha EduAgenda";
        const text = `Confira esta trilha de aprendizado: ${title}`;

        if (navigator.share) {
            try {
                await navigator.share({ title, text, url });
            } catch (err) {
                console.log("Erro ao compartilhar", err);
            }
        } else {
            try {
                await navigator.clipboard.writeText(url);
                alert("Link copiado para a área de transferência!");
            } catch (err) {
                alert("Não foi possível copiar o link.");
            }
        }
    };




    // Fetch Public Events
    const { data: allEvents, isLoading, isError, error } = useQuery({
        queryKey: ["landing-public-events"],
        queryFn: async () => {
            const response = await eventsAPI.getAll({ public: true, upcoming: true, limit: 100 });
            const data = response.data?.events || response.data;
            return Array.isArray(data) ? data : [];
        },
        staleTime: 30000, // 30 seconds
    });

    // Fetch Public Tracks
    const { data: allTracks, isLoading: tracksLoading } = useQuery({
        queryKey: ["landing-public-tracks"],
        queryFn: async () => {
            const response = await tracksAPI.getAll();
            return Array.isArray(response.data) ? response.data : [];
        },
        staleTime: 30000,
    });

    // Fetch Categories
    const { data: categoriesArray } = useQuery({
        queryKey: ["landing-categories"],
        queryFn: async () => {
            const response = await categoriesAPI.getAll();
            return response.data;
        },
        staleTime: 30000,
    });

    // Client-side filtering for MODAL
    const searchResults = allEvents?.filter(event => {
        if (!debouncedSearchTerm) return false; // Don't show anything if empty in modal logic usually, or show all? User said "ao pesquisar...", assuming results appear as typed.
        const term = debouncedSearchTerm.toLowerCase();
        return (
            event.title?.toLowerCase().includes(term) ||
            event.description?.toLowerCase().includes(term) ||
            event.location?.toLowerCase().includes(term)
        );
    }) || [];

    // Main grid: Show events that are either in progress or upcoming
    const upcomingEvents = allEvents?.filter(e => {
        if (!e.endDate) return false;
        const now = new Date();
        const endDate = new Date(e.endDate);

        // DEBUG: Se o título contém "Passado", removemos sumariamente
        if (e.title?.toLowerCase().includes("passado")) return false;
        if (e.title?.toLowerCase().includes("mock")) return false;

        // Filtro de tempo restrito
        return endDate.getTime() > now.getTime();
    })
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
        .slice(0, 6) || [];

    const handleSearchClick = () => {
        setSearchModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] text-[#0d141b] dark:text-slate-100 transition-colors duration-300 font-sans">

            {/* SEARCH MODAL */}
            <Dialog open={searchModalOpen} onOpenChange={setSearchModalOpen} modal>
                {/* Controlled by custom trigger usually, but we can wrap or use state. We used DialogTrigger or controlled state? 
                     Let's use a controlled Dialog with `searchModalOpen` state. 
                 */}
                <DialogContent className="p-0 gap-0 overflow-hidden sm:rounded-[2.5rem] border-none shadow-2xl max-w-[650px] w-full bg-white dark:bg-slate-900 mx-auto">
                    <div className="p-6 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
                        <div className="bg-blue-600 text-white p-2.5 rounded-2xl shadow-lg shadow-blue-100 dark:shadow-none">
                            <Search className="w-5 h-5" />
                        </div>
                        <Input
                            className="border-none shadow-none focus-visible:ring-0 px-0 text-xl font-black bg-transparent placeholder:text-slate-400 placeholder:font-bold"
                            placeholder="O que você quer aprender hoje?"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                        {searchTerm && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSearchTerm("")}
                                className="rounded-full hover:bg-slate-200"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </Button>
                        )}
                    </div>

                    <div className="max-h-[70vh] overflow-y-auto p-4 custom-scrollbar bg-white dark:bg-slate-900">
                        {isLoading ? (
                            <div className="py-20 flex flex-col items-center justify-center space-y-4">
                                <Loader2 className="animate-spin text-blue-600 w-10 h-10" />
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Buscando conhecimento...</p>
                            </div>
                        ) : isError ? (
                            <div className="py-20 text-center space-y-2">
                                <p className="text-red-500 font-bold">Erro ao carregar eventos.</p>
                                <p className="text-xs text-slate-400">Verifique sua conexão e tente novamente.</p>
                            </div>
                        ) : searchTerm === "" ? (
                            <div className="py-20 text-center space-y-4">
                                <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
                                    <Search className="w-10 h-10 text-slate-300" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-slate-900 dark:text-white font-black text-lg">Inicie sua busca</p>
                                    <p className="text-slate-400 text-sm max-w-[250px] mx-auto italic">Digite o nome de uma palestra, workshop ou tema de interesse.</p>
                                </div>
                            </div>
                        ) : searchResults.length === 0 ? (
                            <div className="py-20 text-center space-y-4">
                                <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
                                    <FlaskConical className="w-10 h-10 text-slate-300" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-slate-900 dark:text-white font-black text-lg">Nenhum resultado</p>
                                    <p className="text-slate-400 text-sm max-w-[250px] mx-auto italic">Não encontramos nada para "{searchTerm}". Tente outros termos.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-2">
                                <div className="px-3 py-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{searchResults.length} Resultados encontrados</span>
                                </div>
                                {searchResults.map(event => (
                                    <Link
                                        to={`/events/${event.id}`}
                                        key={event.id}
                                        className="flex items-center gap-4 p-4 rounded-[1.5rem] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group border border-transparent hover:border-blue-100 dark:hover:border-blue-900/30"
                                        onClick={() => setSearchModalOpen(false)}
                                    >
                                        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 shrink-0 overflow-hidden shadow-inner">
                                            <img
                                                src={event.imageUrl ? getAssetUrl(event.imageUrl) : "https://images.unsplash.com/photo-1544531586-fde5298cdd40?q=80&w=2070&auto=format&fit=crop"}
                                                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                                alt=""
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge className="bg-blue-50 text-blue-600 border-blue-100 text-[9px] uppercase font-black tracking-widest px-2 py-0">Evento</Badge>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{formatDate(event.startDate)}</span>
                                            </div>
                                            <h4 className="font-black text-slate-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">{event.title}</h4>
                                            <p className="text-xs text-slate-500 font-medium truncate flex items-center gap-1 mt-0.5">
                                                <MapPin className="w-3 h-3 text-blue-500" />
                                                {event.location || "Evento Online"}
                                            </p>
                                        </div>
                                        <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all text-slate-400">
                                            <ArrowRight className="w-4 h-4" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Dica: Use palavras-chave como "Tecnologia" ou "Metodologia"</p>
                        <Button variant="ghost" size="sm" onClick={() => setSearchModalOpen(false)} className="text-xs font-bold rounded-lg uppercase tracking-wider">Fechar</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* HEADER */}
            <header className="sticky top-0 z-50 w-full border-b border-[#e7edf3] dark:border-slate-800 bg-white/80 dark:bg-[#101922]/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

                    {/* LOGO */}
                    <Link to="/" className="flex items-center gap-2 shrink-0 group">
                        {logoUrl ? (
                            <img src={logoUrl} alt={platformName} className="h-10 w-auto object-contain" />
                        ) : (
                            <div className="bg-[#137fec] p-1.5 rounded-lg text-white group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                    <path clipRule="evenodd" d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z" fill="currentColor" fillRule="evenodd"></path>
                                </svg>
                            </div>
                        )}
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                            {platformName}
                        </h1>
                    </Link>

                    {/* SEARCH BAR (Desktop Trigger) */}
                    <div className="flex-1 max-w-xl hidden lg:block">
                        <div
                            className="relative group cursor-text"
                            onClick={() => setSearchModalOpen(true)}
                        >
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-hover:text-[#137fec] transition-colors" />
                            <div className="w-full bg-slate-100 dark:bg-slate-800/50 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-500 dark:text-slate-400 border border-transparent group-hover:border-[#137fec]/30 transition-all">
                                Buscar eventos...
                            </div>
                        </div>
                    </div>

                    {/* DESKTOP ACTIONS */}
                    <div className="hidden lg:flex items-center gap-3">
                        <nav className="flex items-center gap-4 text-sm font-semibold mr-4 text-slate-600 dark:text-slate-400">
                            <Link to="/" className="hover:text-[#137fec] transition-colors">Início</Link>
                            <Link to="/events" className="hover:text-[#137fec] transition-colors">Eventos</Link>
                            <Link to="/tracks" className="hover:text-[#137fec] transition-colors">Trilhas</Link>
                            <a href="#" className="hover:text-[#137fec] transition-colors">Sobre</a>
                        </nav>

                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                            title="Alternar tema"
                        >
                            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        </button>

                        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>

                        <Link to={user ? "/dashboard" : "/login"}>
                            <Button className="bg-[#137fec] hover:bg-[#137fec]/90 text-white rounded-lg font-bold shadow-lg shadow-[#137fec]/20 transition-all whitespace-nowrap">
                                {user ? "Acessar Painel" : "Entrar / Cadastrar-se"}
                            </Button>
                        </Link>
                    </div>

                    {/* MOBILE ACTIONS */}
                    <div className="flex items-center gap-2 lg:hidden">
                        <button
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                            onClick={() => setSearchModalOpen(true)}
                        >
                            <Search className="h-6 w-6" />
                        </button>

                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                        >
                            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        </button>
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                        >
                            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>

                {/* MOBILE MENU DROPDOWN */}
                {mobileMenuOpen && (
                    <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101922] p-4 space-y-4 absolute w-full shadow-xl animate-in slide-in-from-top-5">
                        <nav className="flex flex-col gap-2 font-medium text-slate-600 dark:text-slate-300">
                            <Link to="/" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg" onClick={() => setMobileMenuOpen(false)}>Início</Link>
                            <Link to="/events" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg" onClick={() => setMobileMenuOpen(false)}>Eventos</Link>
                            <Link to="/tracks" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg" onClick={() => setMobileMenuOpen(false)}>Trilhas</Link>
                            <a href="#" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg" onClick={() => setMobileMenuOpen(false)}>Sobre</a>
                        </nav>
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                            <Link to={user ? "/dashboard" : "/login"} className="w-full block" onClick={() => setMobileMenuOpen(false)}>
                                <Button className="w-full bg-[#137fec] hover:bg-[#137fec]/90 text-white font-bold">
                                    {user ? "Acessar Painel" : "Entrar / Cadastrar-se"}
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
            </header>

            <main className="max-w-7xl mx-auto px-4 py-6 space-y-8 md:space-y-12">

                {/* HERO SECTION */}
                <HeroCarousel />

                {/* CATEGORY TABS (Dynamic) */}
                <section className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                    <Link to="/events">
                        <Button className={`rounded-full gap-2 px-6 ${!searchTerm ? 'bg-[#137fec] text-white' : 'variant-outline text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800'}`}>
                            <LayoutGrid className="h-5 w-5" /> Todos os Eventos
                        </Button>
                    </Link>
                    {categoriesArray?.map((cat) => {
                        // Map category name to icon
                        let Icon = GraduationCap;
                        if (cat.name.toLowerCase().includes('tecnologia')) Icon = Laptop;
                        if (cat.name.toLowerCase().includes('arte') || cat.name.toLowerCase().includes('cultura')) Icon = Palette;
                        if (cat.name.toLowerCase().includes('gestão')) Icon = Users;
                        if (cat.name.toLowerCase().includes('ciência')) Icon = FlaskConical;

                        return (
                            <Link to={`/events?category=${cat.id}`} key={cat.id}>
                                <Button
                                    variant="outline"
                                    className="rounded-full border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 gap-2 px-6 text-slate-700 dark:text-slate-200 border-none"
                                >
                                    <Icon className="h-4 w-4" style={{ color: cat.color }} />
                                    {cat.name}
                                </Button>
                            </Link>
                        );
                    })}
                </section>

                {/* LEARNING TRACKS SECTION (BENTO GRID) */}
                <section id="tracks" className="space-y-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div className="space-y-2">
                            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-[0.2em]">Formação Continuada</span>
                            <h3 className="text-3xl font-black tracking-tight drop-shadow-sm">Trilhas de Aprendizado</h3>
                            <p className="text-slate-500 max-w-xl">Sequências completas de eventos desenhadas para sua especialização profissional.</p>
                        </div>
                        <Link to="/tracks" className="text-[#137fec] text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
                            Ver Todas as Trilhas <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {tracksLoading ? (
                            <div className="col-span-1 md:col-span-4 flex justify-center py-20">
                                <Loader2 className="h-10 w-10 animate-spin text-[#137fec]" />
                            </div>
                        ) : allTracks?.length === 0 ? (
                            <div className="col-span-1 md:col-span-4 text-center py-20 bg-slate-50 dark:bg-white/5 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                                <GraduationCap className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                                <p className="text-slate-500 italic">Nenhuma trilha disponível no momento.</p>
                            </div>
                        ) : (
                            allTracks?.map((track, trackIdx) => (
                                <div
                                    key={track.id}
                                    className={`relative overflow-hidden group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col ${trackIdx === 0 ? 'md:col-span-2 md:row-span-2' : 'md:col-span-2 lg:col-span-1'
                                        }`}
                                >
                                    {/* Track Header/Badge */}
                                    <div className="absolute top-6 left-6 z-10">
                                        <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-2xl flex items-center gap-2 border border-white/10">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                            <span className="text-[10px] font-bold text-white uppercase tracking-widest">{track._count?.events || 0} Etapas</span>
                                        </div>
                                    </div>

                                    <div className="absolute top-6 right-6 z-10">
                                        <button
                                            onClick={(e) => { e.preventDefault(); handleShareTrack(track); }}
                                            className="bg-black/50 hover:bg-black/70 backdrop-blur-md p-2 rounded-full flex items-center justify-center border border-white/10 text-white transition-colors"
                                            title="Compartilhar Trilha"
                                        >
                                            <Share2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Image Container */}
                                    <div className={`relative overflow-hidden ${trackIdx === 0 ? 'h-64 md:h-80' : 'h-48'}`}>
                                        <img
                                            src={track.imageUrl ? getAssetUrl(track.imageUrl) : "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop"}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            alt={track.title}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-slate-900 via-transparent to-transparent"></div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-8 flex-1 flex flex-col">
                                        <h4 className="text-2xl font-black mb-3 tracking-tight group-hover:text-blue-500 transition-colors">{track.title}</h4>
                                        <p className="text-slate-500 text-sm line-clamp-2 mb-6 leading-relaxed">
                                            {track.description}
                                        </p>

                                        {/* Journey Preview */}
                                        <div className="space-y-4 mb-8">
                                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Sua Jornada:</p>
                                            <div className="space-y-2">
                                                {track.events?.slice(0, 3).map((te, idx) => (
                                                    <div key={te.id} className="flex items-center gap-3 group/item">
                                                        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500 group-hover/item:bg-blue-500 group-hover/item:text-white transition-colors shrink-0">
                                                            {idx + 1}
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 truncate group-hover/item:text-slate-900 dark:group-hover/item:text-white transition-colors">
                                                            {te.event?.title}
                                                        </span>
                                                    </div>
                                                ))}
                                                {(track._count?.events || 0) > 3 && (
                                                    <p className="pl-9 text-[10px] font-bold text-blue-500">+ {(track._count?.events || 0) - 3} outros eventos</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-auto">
                                            <Link to={`/tracks/${track.id}`} className="block w-full">
                                                <Button className="w-full h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white rounded-2xl font-black text-base shadow-xl shadow-slate-200 dark:shadow-none transition-all flex items-center justify-center gap-2 group-hover:scale-[1.02]">
                                                    Ver Detalhes
                                                    <ArrowRight className="w-5 h-5" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent my-12"></div>
                </section>

                {/* EVENTS GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="events">

                    <div className="lg:col-span-8 space-y-6">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-3xl font-black tracking-tight drop-shadow-sm flex items-center gap-2">
                                Próximos Eventos
                            </h3>
                            <Link to="/events" className="text-[#137fec] hover:underline text-sm font-bold flex items-center gap-1 group">
                                Ver Todos <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {isLoading ? (
                                <div className="col-span-1 md:col-span-2 flex justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-[#137fec]" />
                                </div>
                            ) : isError ? (
                                <div className="col-span-1 md:col-span-2 text-center py-12 text-red-500">
                                    <p>Não foi possível carregar os eventos. Tente novamente mais tarde.</p>
                                    {error?.message && <p className="text-xs mt-2 text-slate-400">{error.message}</p>}
                                </div>
                            ) : upcomingEvents.length === 0 ? (
                                <div className="col-span-1 md:col-span-2 text-center py-12 text-slate-500">
                                    <p>Nenhum evento disponível no momento.</p>
                                </div>
                            ) : (
                                upcomingEvents.map(event => (
                                    <div key={event.id} className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden hover:border-[#137fec]/50 transition-all hover:scale-[1.02] shadow-sm hover:shadow-lg group cursor-pointer">
                                        <div className="relative h-48 bg-slate-200 flex items-center justify-center overflow-hidden">
                                            {event.imageUrl ? (
                                                <img
                                                    src={getAssetUrl(event.imageUrl)}
                                                    alt={event.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <img
                                                    src="/placeholder-event.jpg"
                                                    alt="Placeholder"
                                                    className="w-full h-full object-cover opacity-50"
                                                    onError={(e) => {
                                                        e.target.src = "https://images.unsplash.com/photo-1544531586-fde5298cdd40?q=80&w=2070&auto=format&fit=crop";
                                                    }}
                                                />
                                            )}
                                            <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-lg text-center shadow-lg">
                                                <span className="block text-xs font-bold text-[#137fec] uppercase">{getMonthAbbr(event.startDate)}</span>
                                                <span className="block text-lg font-black dark:text-white leading-tight">{getDay(event.startDate)}</span>
                                            </div>
                                            {!event.location && event.isOnline && (
                                                <div className="absolute top-3 left-3 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg uppercase">Online</div>
                                            )}
                                        </div>
                                        <div className="p-5 space-y-3">
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                                <MapPin className="h-3.5 w-3.5" /> Local: {event.location || "Online"}
                                            </div>
                                            <h4 className="text-lg font-bold leading-tight line-clamp-2 min-h-[3.5rem]">{event.title}</h4>
                                            <div className="flex items-center justify-between pt-2">
                                                {/* Mock price/free logic */}
                                                <span className="text-emerald-500 font-bold">Gratuito</span>
                                                <Link to={`/events/${event.id}`}>
                                                    <Button size="sm" className="bg-[#137fec]/10 hover:bg-[#137fec] text-[#137fec] hover:text-white rounded-lg text-xs font-bold transition-colors">
                                                        Ver Detalhes
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* SIDEBAR (Calendar & Widgets) */}
                    <aside className="lg:col-span-4 space-y-8">
                        {/* Calendar Widget */}
                        <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold flex items-center gap-2"><Calendar className="w-5 h-5 text-[#137fec]" /> Calendário de Eventos</h3>
                            </div>
                            <div className="calendar-container -mx-3">
                                <CalendarUI
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={handleDateSelect}
                                    locale={ptBR}
                                    className="rounded-md border-0 w-full"
                                    modifiers={{
                                        hasEvent: (date) => {
                                            if (!allEvents) return false;
                                            return allEvents.some(event => {
                                                if (!event.startDate) return false;
                                                return isSameDay(parseISO(event.startDate), date);
                                            });
                                        }
                                    }}
                                    modifiersStyles={{
                                        hasEvent: {
                                            fontWeight: 'bold',
                                            backgroundColor: 'rgba(19, 127, 236, 0.15)',
                                            color: '#137fec',
                                            textDecoration: 'none'
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        {/* CTA Widget */}
                        <div className="bg-[#137fec]/10 border border-[#137fec]/20 rounded-xl p-6 space-y-4">
                            <h3 className="font-bold text-lg text-[#137fec]">Compartilhe seu saber!</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Tem um workshop ou palestra incrível? Envie sua proposta para fazer parte do nosso próximo grande evento.
                            </p>
                            <Button onClick={() => setProposalModalOpen(true)} className="w-full bg-[#137fec] hover:bg-[#137fec]/90 text-white text-sm font-bold">
                                Enviar Proposta
                            </Button>
                        </div>
                    </aside>

                </div>
            </main>

            {/* EVENTOS DA DATA SELECIONADA MODAL */}
            <Dialog open={dateEventsModalOpen} onOpenChange={setDateEventsModalOpen}>
                <DialogContent className="p-0 gap-0 overflow-hidden sm:rounded-3xl border-none shadow-2xl max-w-lg w-full bg-white dark:bg-slate-900 mx-auto">
                    <DialogHeader className="p-8 pb-4 bg-slate-50/50 dark:bg-slate-800/50">
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-600 text-white p-3 rounded-2xl shadow-lg shadow-blue-100 dark:shadow-none">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
                                    Eventos do Dia
                                </DialogTitle>
                                <DialogDescription className="font-medium text-blue-600 dark:text-blue-400">
                                    {selectedDate && formatDate(selectedDate)}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-8 pb-4 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900">
                        {selectedDateEvents.length > 0 ? (
                            selectedDateEvents.map((event) => (
                                <div key={event.id} className="p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 hover:border-blue-100 dark:hover:border-blue-900/30 transition-all group">
                                    <h4 className="font-black text-lg text-slate-900 dark:text-white mb-3 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{event.title}</h4>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            <Calendar className="w-3.5 h-3.5 text-blue-500" />
                                            Começa às: {new Date(event.startDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            <MapPin className="w-3.5 h-3.5 text-blue-500" />
                                            Local: {event.location || "Online"}
                                        </div>
                                    </div>
                                    <div className="mt-6">
                                        <Link to={`/events/${event.id}`}>
                                            <Button className="w-full h-12 bg-white hover:bg-blue-600 text-slate-900 hover:text-white border-slate-200 hover:border-blue-600 rounded-xl font-black text-sm shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2">
                                                Ver Detalhes do Evento
                                                <ArrowRight className="w-4 h-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-12 text-center text-slate-500 italic">
                                Nenhum evento programado para esta data.
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={proposalModalOpen} onOpenChange={setProposalModalOpen}>
                <DialogContent className="p-0 gap-0 overflow-hidden sm:rounded-3xl border-none shadow-2xl max-w-[550px] w-full bg-white dark:bg-slate-900 mx-auto">
                    <DialogHeader className="p-8 pb-4 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-4">
                            <div className="bg-[#137fec] text-white p-3 rounded-2xl shadow-lg shadow-blue-100">
                                <FlaskConical className="w-6 h-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
                                    Enviar Proposta
                                </DialogTitle>
                                <DialogDescription className="font-medium text-slate-500">
                                    Compartilhe seu saber com a nossa comunidade educativa.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-8 space-y-6 bg-white dark:bg-slate-900">
                        <form onSubmit={handleProposalSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label className="font-bold text-slate-700 dark:text-slate-300 ml-1">Seu Nome *</Label>
                                <Input
                                    required
                                    value={proposalForm.name}
                                    onChange={e => setProposalForm({ ...proposalForm, name: e.target.value })}
                                    placeholder="Como gostaria de ser chamado?"
                                    className="h-11 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 focus:border-blue-500 transition-all font-medium text-slate-900 dark:text-white"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="font-bold text-slate-700 dark:text-slate-300 ml-1">E-mail Corporativo *</Label>
                                    <Input
                                        required
                                        type="email"
                                        value={proposalForm.email}
                                        onChange={e => setProposalForm({ ...proposalForm, email: e.target.value })}
                                        placeholder="seu@email.com"
                                        className="h-11 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 focus:border-blue-500 transition-all font-medium text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-bold text-slate-700 dark:text-slate-300 ml-1">WhatsApp / Telefone</Label>
                                    <Input
                                        value={proposalForm.phone}
                                        onChange={e => setProposalForm({ ...proposalForm, phone: e.target.value })}
                                        placeholder="(00) 00000-0000"
                                        className="h-11 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 focus:border-blue-500 transition-all font-medium text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="font-bold text-slate-700 dark:text-slate-300 ml-1">Tema da Palestra ou Workshop *</Label>
                                <Input
                                    required
                                    value={proposalForm.topic}
                                    onChange={e => setProposalForm({ ...proposalForm, topic: e.target.value })}
                                    placeholder="Ex: Novos Rumos da Educação 4.0"
                                    className="h-11 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 focus:border-blue-500 transition-all font-bold text-blue-600 dark:text-blue-400"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="font-bold text-slate-700 dark:text-slate-300 ml-1">Resumo da sua Proposta *</Label>
                                <textarea
                                    required
                                    value={proposalForm.description}
                                    onChange={e => setProposalForm({ ...proposalForm, description: e.target.value })}
                                    className="w-full flex min-h-[120px] rounded-2xl border border-slate-100 bg-slate-50/50 dark:bg-slate-800/50 px-4 py-3 text-sm font-medium shadow-inner placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all"
                                    placeholder="Conte-nos brevemente sobre o que você gostaria de apresentar, objetivos e público-alvo."
                                ></textarea>
                            </div>

                            <div className="pt-4 flex flex-col sm:flex-row justify-end gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setProposalModalOpen(false)}
                                    className="h-12 rounded-xl font-bold order-2 sm:order-1"
                                >
                                    Agora não
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={proposalLoading}
                                    className="h-12 px-8 bg-[#137fec] text-white hover:bg-blue-600 rounded-xl font-black shadow-xl shadow-blue-100 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2 order-1 sm:order-2"
                                >
                                    {proposalLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                    Enviar para Curadoria
                                </Button>
                            </div>
                        </form>
                    </div>

                    <div className="p-6 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800 text-center">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic font-sans">Sua ideia pode transformar a educação.</p>
                    </div>
                </DialogContent>
            </Dialog>

            {/* FOOTER */}
            <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-12 mt-12 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="col-span-1 md:col-span-1 space-y-4">
                        <div className="flex items-center gap-2">
                            {logoUrl ? (
                                <img src={logoUrl} alt={platformName} className="h-8 w-auto object-contain" />
                            ) : (
                                <div className="bg-[#137fec] p-1.5 rounded-lg text-white">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                        <path clipRule="evenodd" d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z" fill="currentColor" fillRule="evenodd"></path>
                                    </svg>
                                </div>
                            )}
                            <h1 className="text-lg font-bold tracking-tight">{platformName}</h1>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Portal oficial de eventos e formação continuada.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold mb-4">Links Rápidos</h4>
                        <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                            <li><a href="#" className="hover:text-[#137fec]">Próximos Eventos</a></li>
                            <li><a href="#" className="hover:text-[#137fec]">Workshops em Destaque</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold mb-4">Suporte</h4>
                        <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                            <li><a href="#" className="hover:text-[#137fec]">Central de Ajuda</a></li>
                            <li><a href="#" className="hover:text-[#137fec]">Política de Privacidade</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold mb-4">Contato</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                            Rua Getúlio Vargas, 123<br />Centro, Campina Grande - PB
                        </p>
                        <div className="flex gap-4">
                            <button className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-[#137fec] transition-colors"><Share2 className="h-4 w-4" /></button>
                            <button className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-[#137fec] transition-colors"><Mail className="h-4 w-4" /></button>
                        </div>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                    © 2026 {platformName}. Desenvolvido para Excelência Educacional.
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
