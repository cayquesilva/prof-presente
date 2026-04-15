import { useState, useEffect } from "react";
import api from "../lib/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import { Eye, EyeOff, Loader2, ChevronsUpDown, X, User, Briefcase } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "./ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "./ui/command";
import { Badge } from "./ui/badge";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { DatePicker } from "./ui/date-picker";
import { Separator } from "./ui/separator";
import { toast } from "sonner";

const workShiftOptions = [
    { value: "MANHA", label: "Manhã" },
    { value: "TARDE", label: "Tarde" },
    { value: "NOITE", label: "Noite" },
    { value: "INTEGRAL", label: "Integral" },
];

const teachingSegmentOptions = [
    { value: "SUPERIOR", label: "Superior" },
    { value: "ADMINISTRATIVO", label: "Administrativo" },
    { value: "INFANTIL", label: "Ed. Infantil" },
    { value: "FUNDAMENTAL1", label: "Fundamental I" },
    { value: "FUNDAMENTAL2", label: "Fundamental II" },
    { value: "EJA", label: "EJA" },
];

const professionOptions = [
    { value: "gestor", label: "Gestor" },
    { value: "gestor adjunto", label: "Gestor Adjunto" },
    { value: "secretário", label: "Secretário" },
    { value: "supervisor", label: "Supervisor" },
    { value: "educador social voluntário", label: "Educador Social Voluntário" },
    { value: "professor", label: "Professor" },
    { value: "merendeiro", label: "Merendeiro" },
    { value: "apoio", label: "Apoio" },
    { value: "organizador", label: "Organizador" },
];

const serieOptions = [
    { value: "bercário I", label: "Bercário I" },
    { value: "bercário II", label: "Bercário II" },
    { value: "maternal I", label: "Maternal I" },
    { value: "maternal II", label: "Maternal II" },
    { value: "pré I", label: "Pré I" },
    { value: "pré II", label: "Pré II" },
    { value: "1º ao 9º", label: "1º ao 9º" },
];

const subjectOptions = [
    { value: "Polivalente", label: "Polivalente" },
    { value: "Português", label: "Português" },
    { value: "Matemática", label: "Matemática" },
    { value: "História", label: "História" },
    { value: "Geografia", label: "Geografia" },
    { value: "Ciências", label: "Ciências" },
    { value: "Inglês", label: "Inglês" },
    { value: "Artes", label: "Artes" },
    { value: "Educação Física", label: "Educação Física" },
    { value: "Ensino Religioso", label: "Ensino Religioso" },
    { value: "Educação Especial", label: "Educação Especial" },
    { value: "Outros", label: "Outros" },
];

const FieldWrapper = ({ label, children, required = true, className = "" }) => (
    <div className={cn("space-y-2", className)}>
        <Label className="text-sm font-bold text-slate-700 ml-1">
            {label} {required && <span className="text-destructive font-black">*</span>}
        </Label>
        {children}
    </div>
);

const AdminUserRegister = ({ onSuccess, onCancel }) => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        cpf: "",
        birthDate: "",
        phone: "",
        address: "",
        neighborhood: "",
        professionName: "",
        workplaceIds: [],
        workShifts: [],
        contractType: "",
        teachingSegments: [],
        serie: "",
        subject: "",
        workload: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [workplaces, setWorkplaces] = useState([]);

    const [selectedWorkplaces, setSelectedWorkplaces] = useState([]);
    const [openWorkplacePopover, setOpenWorkplacePopover] = useState(false);
    const [selectedShifts, setSelectedShifts] = useState([]);
    const [openShiftPopover, setOpenShiftPopover] = useState(false);
    const [selectedSegments, setSelectedSegments] = useState([]);
    const [openSegmentPopover, setOpenSegmentPopover] = useState(false);

    useEffect(() => {
        const fetchWorkplaces = async () => {
            try {
                const response = await api.get("/workplaces?limit=500");
                setWorkplaces(response.data.workplaces || []);
            } catch (err) {
                console.error("Erro ao carregar localidades:", err);
            }
        };
        fetchWorkplaces();
    }, []);

    const handleChange = (e) => {
        let value = e.target.value;

        if (e.target.name === "cpf") {
            value = value
                .replace(/\D/g, "")
                .replace(/(\d{3})(\d)/, "$1.$2")
                .replace(/(\d{3})(\d)/, "$1.$2")
                .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
        }

        if (e.target.name === "phone") {
            value = value
                .replace(/\D/g, "")
                .replace(/(\d{2})(\d)/, "($1) $2")
                .replace(/(\d{5})(\d)/, "$1-$2");
        }

        setFormData({
            ...formData,
            [e.target.name]: value,
        });
    };

    const handleSelectChange = (name, value) => {
        setFormData({ ...formData, [name]: value });
    };

    const handleWorkplaceSelect = (workplace) => {
        if (!selectedWorkplaces.some((w) => w.id === workplace.id)) {
            const newSelection = [...selectedWorkplaces, workplace];
            setSelectedWorkplaces(newSelection);
            setFormData({ ...formData, workplaceIds: newSelection.map((w) => w.id) });
        }
        setOpenWorkplacePopover(false);
    };

    const handleWorkplaceRemove = (workplaceToRemove) => {
        const newSelection = selectedWorkplaces.filter(
            (w) => w.id !== workplaceToRemove.id
        );
        setSelectedWorkplaces(newSelection);
        setFormData({ ...formData, workplaceIds: newSelection.map((w) => w.id) });
    };

    const handleShiftSelect = (shift) => {
        if (!selectedShifts.some((s) => s.value === shift.value)) {
            const newSelection = [...selectedShifts, shift];
            setSelectedShifts(newSelection);
            setFormData({ ...formData, workShifts: newSelection.map((s) => s.value) });
        }
    };

    const handleShiftRemove = (shiftToRemove) => {
        const newSelection = selectedShifts.filter(
            (s) => s.value !== shiftToRemove.value
        );
        setSelectedShifts(newSelection);
        setFormData({ ...formData, workShifts: newSelection.map((s) => s.value) });
    };

    const handleSegmentSelect = (segment) => {
        if (!selectedSegments.some((s) => s.value === segment.value)) {
            const newSelection = [...selectedSegments, segment];
            setSelectedSegments(newSelection);
            setFormData({
                ...formData,
                teachingSegments: newSelection.map((s) => s.value),
            });
        }
    };

    const handleSegmentRemove = (segmentToRemove) => {
        const newSelection = selectedSegments.filter(
            (s) => s.value !== segmentToRemove.value
        );
        setSelectedSegments(newSelection);
        setFormData({
            ...formData,
            teachingSegments: newSelection.map((s) => s.value),
        });
    };

    const validateForm = () => {
        if (!formData.name.trim()) return "Nome completo é obrigatório";
        if (!formData.email.trim()) return "Email é obrigatório";
        if (formData.password.length < 6) return "A senha deve ter pelo menos 6 caracteres";

        // Validando campos obrigatórios
        if (!formData.cpf || formData.cpf.replace(/\D/g, "").length !== 11) return "CPF inválido (11 dígitos obrigatórios)";
        if (!formData.birthDate) return "Data de Nascimento é obrigatória";
        if (!formData.phone) return "Telefone é obrigatório";
        if (!formData.address) return "Endereço é obrigatório";
        if (!formData.neighborhood) return "Bairro é obrigatório";

        // No AdminUserRegister, profissão ainda não era obrigatória, mas os novos campos dependem dela
        if (formData.professionName === "professor") {
            if (!formData.serie) return "Série é obrigatória para professores";
            if (!formData.subject) return "Componente Curricular é obrigatório para professores";
        }

        // Dados profissionais agora são opcionais
        // if (!formData.professionName) return "Profissão é obrigatória";
        // if (!formData.contractType) return "Tipo de vínculo é obrigatório";
        // if (formData.workShifts.length === 0) return "Selecione pelo menos um turno de trabalho";
        // if (formData.teachingSegments.length === 0) return "Selecione pelo menos um segmento de ensino";
        // if (formData.workplaceIds.length === 0) return "Selecione pelo menos uma unidade educacional";

        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            setLoading(false);
            return;
        }

        try {
            const submissionData = { ...formData };
            delete submissionData.confirmPassword; // Remove confirmPassword

            // Call API direct to avoid auto-login
            await api.post("/auth/register", submissionData);

            toast.success("Usuário cadastrado com sucesso!");
            if (onSuccess) onSuccess();

        } catch (err) {
            console.error("Erro ao registrar:", err);
            // Captura mensagem de erro detalhada do backend
            const serverError = err.response?.data?.error;
            const validationErrors = err.response?.data?.details?.map(d => d.msg).join(", ");
            const errorMessage = validationErrors ? `${serverError}: ${validationErrors}` : (serverError || "Erro ao registrar usuário.");

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full bg-slate-50/30">
            <div className="flex-1 overflow-y-auto px-6 py-8 space-y-10 custom-scrollbar">
                {error && (
                    <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive rounded-2xl animate-in zoom-in-95 duration-300">
                        <AlertDescription className="font-bold">{error}</AlertDescription>
                    </Alert>
                )}

                {/* SEÇÃO 1: DADOS PESSOAIS */}
                <section className="bg-white p-6 rounded-3xl border shadow-sm space-y-6">
                    <div className="flex items-center gap-3 text-primary pb-2 border-b">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <User className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-black tracking-tight">Informações Pessoais</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FieldWrapper label="Nome Completo" className="md:col-span-2 lg:col-span-3">
                            <Input
                                name="name"
                                placeholder="Nome completo do servidor"
                                value={formData.name}
                                onChange={handleChange}
                                className="h-12 rounded-xl shadow-none focus-visible:ring-primary border-slate-200"
                            />
                        </FieldWrapper>

                        <FieldWrapper label="Data de Nascimento">
                            <DatePicker
                                value={formData.birthDate ? toZonedTime(formData.birthDate, "America/Sao_Paulo") : null}
                                onSelect={(date) => handleSelectChange("birthDate", date ? fromZonedTime(date, "America/Sao_Paulo") : "")}
                                disabled={false}
                            />
                        </FieldWrapper>

                        <FieldWrapper label="CPF">
                            <Input
                                name="cpf"
                                placeholder="000.000.000-00"
                                value={formData.cpf}
                                onChange={handleChange}
                                maxLength={14}
                                className="h-12 rounded-xl shadow-none border-slate-200"
                            />
                        </FieldWrapper>

                        <FieldWrapper label="Telefone / WhatsApp">
                            <Input
                                name="phone"
                                placeholder="(00) 00000-0000"
                                value={formData.phone}
                                onChange={handleChange}
                                maxLength={15}
                                className="h-12 rounded-xl shadow-none border-slate-200"
                            />
                        </FieldWrapper>

                        <FieldWrapper label="Endereço (Rua, Nº)" className="md:col-span-2">
                            <Input
                                name="address"
                                placeholder="Ex: Rua das Flores, 123"
                                value={formData.address}
                                onChange={handleChange}
                                className="h-12 rounded-xl shadow-none border-slate-200"
                            />
                        </FieldWrapper>

                        <FieldWrapper label="Bairro">
                            <Input
                                name="neighborhood"
                                placeholder="Bairro de residência"
                                value={formData.neighborhood}
                                onChange={handleChange}
                                className="h-12 rounded-xl shadow-none border-slate-200"
                            />
                        </FieldWrapper>
                    </div>
                </section>

                {/* SEÇÃO 2: DADOS DE ACESSO */}
                <section className="bg-white p-6 rounded-3xl border shadow-sm space-y-6">
                    <div className="flex items-center gap-3 text-primary pb-2 border-b">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <Key className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-black tracking-tight">Segurança e Acesso</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FieldWrapper label="Email Institucional">
                            <Input
                                name="email"
                                type="email"
                                placeholder="email@servidor.gov.br"
                                value={formData.email}
                                onChange={handleChange}
                                className="h-12 rounded-xl shadow-none border-slate-200"
                            />
                        </FieldWrapper>

                        <FieldWrapper label="Senha Provisória">
                            <div className="relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="Mínimo 6 caracteres"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="h-12 rounded-xl shadow-none pr-12 border-slate-200"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-slate-400"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </Button>
                            </div>
                        </FieldWrapper>
                    </div>
                </section>


                {/* SEÇÃO 3: DADOS PROFISSIONAIS */}
                <section className="bg-white p-6 rounded-3xl border shadow-sm space-y-6 mb-8">
                    <div className="flex items-center gap-3 text-primary pb-2 border-b">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <Briefcase className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-black tracking-tight">Atuação Profissional</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FieldWrapper label="Profissão / Cargo" className="lg:col-span-2">
                            <Select
                                value={formData.professionName}
                                onValueChange={(value) => handleSelectChange("professionName", value)}
                            >
                                <SelectTrigger className="h-12 rounded-xl border-slate-200">
                                    <SelectValue placeholder="Selecione o cargo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {professionOptions.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FieldWrapper>

                        <FieldWrapper label="Carga Horária">
                            <Input
                                name="workload"
                                placeholder="Ex: 40h"
                                value={formData.workload}
                                onChange={handleChange}
                                className="h-12 rounded-xl shadow-none border-slate-200"
                            />
                        </FieldWrapper>

                        {formData.professionName === "professor" && (
                            <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 animate-in slide-in-from-top-4 duration-500">
                                <FieldWrapper label="Série / Ano">
                                    <Select
                                        value={formData.serie}
                                        onValueChange={(value) => handleSelectChange("serie", value)}
                                    >
                                        <SelectTrigger className="h-12 rounded-xl bg-white border-slate-200">
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {serieOptions.map(opt => (
                                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FieldWrapper>

                                <FieldWrapper label="Componente Curricular">
                                    <Select
                                        value={formData.subject}
                                        onValueChange={(value) => handleSelectChange("subject", value)}
                                    >
                                        <SelectTrigger className="h-12 rounded-xl bg-white border-slate-200">
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {subjectOptions.map(opt => (
                                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FieldWrapper>
                            </div>
                        )}

                        <FieldWrapper label="Tipo de Vínculo">
                            <Select
                                value={formData.contractType}
                                onValueChange={(value) => handleSelectChange("contractType", value)}
                            >
                                <SelectTrigger className="h-12 rounded-xl border-slate-200">
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="EFETIVO">Efetivo</SelectItem>
                                    <SelectItem value="PRESTADOR">Prestador</SelectItem>
                                    <SelectItem value="ESTUDANTE">Estudante</SelectItem>
                                    <SelectItem value="EXTERNO">Externo</SelectItem>
                                </SelectContent>
                            </Select>
                        </FieldWrapper>

                        <FieldWrapper label="Turno(s) de Trabalho">
                            <Popover open={openShiftPopover} onOpenChange={setOpenShiftPopover}>
                                <PopoverTrigger asChild>
                                    <div className="flex h-12 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm cursor-pointer shadow-none">
                                        <div className="flex flex-wrap gap-1 overflow-hidden">
                                            {selectedShifts.length > 0 ? (
                                                selectedShifts.map((shift) => (
                                                    <Badge key={shift.value} variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-none px-2 rounded-lg text-[10px] font-bold">
                                                        {shift.label}
                                                        <span onClick={(e) => { e.stopPropagation(); handleShiftRemove(shift); }} className="ml-1 cursor-pointer hover:text-destructive"><X className="h-3 w-3" /></span>
                                                    </Badge>
                                                ))
                                            ) : <span className="text-slate-400 italic">Selecione...</span>}
                                        </div>
                                        <ChevronsUpDown className="h-4 w-4 opacity-50 ml-2" />
                                    </div>
                                </PopoverTrigger>
                                <PopoverContent className="p-0 rounded-2xl overflow-hidden shadow-xl border-slate-100" align="start">
                                    <Command>
                                        <CommandList>
                                            <CommandGroup>
                                                {workShiftOptions.map((opt) => (
                                                    <CommandItem key={opt.value} onSelect={() => handleShiftSelect(opt)} className="py-3 px-4">
                                                        {opt.label}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </FieldWrapper>

                        <FieldWrapper label="Segmento(s) Atuante(s)">
                            <Popover open={openSegmentPopover} onOpenChange={setOpenSegmentPopover}>
                                <PopoverTrigger asChild>
                                    <div className="flex h-12 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm cursor-pointer shadow-none">
                                        <div className="flex flex-wrap gap-1 overflow-hidden">
                                            {selectedSegments.length > 0 ? (
                                                selectedSegments.map((seg) => (
                                                    <Badge key={seg.value} variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-none px-2 rounded-lg text-[10px] font-bold">
                                                        {seg.label}
                                                        <span onClick={(e) => { e.stopPropagation(); handleSegmentRemove(seg); }} className="ml-1 cursor-pointer hover:text-destructive"><X className="h-3 w-3" /></span>
                                                    </Badge>
                                                ))
                                            ) : <span className="text-slate-400 italic">Selecione...</span>}
                                        </div>
                                        <ChevronsUpDown className="h-4 w-4 opacity-50 ml-2" />
                                    </div>
                                </PopoverTrigger>
                                <PopoverContent className="p-0 rounded-2xl overflow-hidden shadow-xl border-slate-100" align="start">
                                    <Command>
                                        <CommandList>
                                            <CommandGroup>
                                                {teachingSegmentOptions.map((opt) => (
                                                    <CommandItem key={opt.value} onSelect={() => handleSegmentSelect(opt)} className="py-3 px-4">
                                                        {opt.label}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </FieldWrapper>

                        <FieldWrapper label="Unidade(s) Educacional(is)" className="md:col-span-2 lg:col-span-3">
                            <Popover open={openWorkplacePopover} onOpenChange={setOpenWorkplacePopover}>
                                <PopoverTrigger asChild>
                                    <div className="flex min-h-[48px] w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm cursor-pointer shadow-none">
                                        <div className="flex flex-wrap gap-2">
                                            {selectedWorkplaces.length > 0 ? (
                                                selectedWorkplaces.map((w) => (
                                                    <Badge key={w.id} variant="secondary" className="bg-primary/5 text-primary hover:bg-primary/10 border border-primary/20 px-3 py-1 rounded-xl text-xs font-black">
                                                        {w.name}
                                                        <span onClick={(e) => { e.stopPropagation(); handleWorkplaceRemove(w); }} className="ml-2 cursor-pointer hover:text-destructive"><X className="h-3 w-3" /></span>
                                                    </Badge>
                                                ))
                                            ) : <span className="text-slate-400 italic">Pesquisar e selecionar unidades...</span>}
                                        </div>
                                        <ChevronsUpDown className="h-4 w-4 opacity-50 ml-2" />
                                    </div>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0 rounded-2xl overflow-hidden shadow-2xl border-slate-100" align="start">
                                    <Command>
                                        <CommandInput placeholder="Digite o nome da unidade..." className="h-12" />
                                        <CommandList className="max-h-[300px]">
                                            <CommandEmpty>Nenhuma unidade encontrada.</CommandEmpty>
                                            <CommandGroup>
                                                {workplaces.filter(w => !selectedWorkplaces.some(s => s.id === w.id)).map((w) => (
                                                    <CommandItem key={w.id} onSelect={() => handleWorkplaceSelect(w)} className="py-3 px-4 cursor-pointer">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-900">{w.name}</span>
                                                            <span className="text-[10px] text-slate-500 uppercase tracking-tighter">{w.city} - {w.type || 'Escola'}</span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </FieldWrapper>
                    </div>
                </section>
            </div >

            <div className="p-6 bg-white border-t flex flex-col sm:flex-row gap-4 items-center justify-end">
                <Button type="button" variant="ghost" onClick={onCancel} disabled={loading} className="w-full sm:w-32 rounded-xl font-bold hover:bg-slate-100">
                    Cancelar
                </Button>
                <Button type="submit" disabled={loading} className="w-full sm:px-12 h-12 rounded-xl font-black bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all active:scale-95">
                    {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Finalizar Cadastro"}
                </Button>
            </div>

        </form >
    );
};

export default AdminUserRegister;
