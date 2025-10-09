import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Eye, EyeOff, Loader2, ChevronsUpDown, X } from "lucide-react";
import Logo from "../assets/logo-prof-presente-white.svg"; // Importe o seu logo
import api from "../lib/api";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../components/ui/command";
import { Badge } from "../components/ui/badge.jsx";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { DatePicker } from "../components/ui/date-picker";

// NOVAS: Opções para os novos selects múltiplos
const workShiftOptions = [
  { value: "MANHA", label: "Manhã" },
  { value: "TARDE", label: "Tarde" },
  { value: "NOITE", label: "Noite" },
  { value: "INTEGRAL", label: "Integral" },
];

const teachingSegmentOptions = [
  { value: "ADMINISTRATIVO", label: "Administrativo" },
  { value: "INFANTIL", label: "Ed. Infantil" },
  { value: "FUNDAMENTAL1", label: "Fundamental I" },
  { value: "FUNDAMENTAL2", label: "Fundamental II" },
  { value: "EJA", label: "EJA" },
];

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    cpf: "",
    birthDate: "",
    phone: "",
    address: "",
    neighborhood: "", // NOVO
    professionName: "", // NOVO CAMPO PARA PROFISSÃO DIGITADA
    workplaceIds: [], // <-- MUDOU para array de IDs
    workShifts: [], // <-- MUDOU para array
    contractType: "", // NOVO
    teachingSegments: [], // <-- MUDOU para array
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [workplaces, setWorkplaces] = useState([]);

  const [selectedWorkplaces, setSelectedWorkplaces] = useState([]);
  const [openWorkplacePopover, setOpenWorkplacePopover] = useState(false);
  const [selectedShifts, setSelectedShifts] = useState([]);
  const [openShiftPopover, setOpenShiftPopover] = useState(false);
  const [selectedSegments, setSelectedSegments] = useState([]);
  const [openSegmentPopover, setOpenSegmentPopover] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

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

  // Função para lidar com a mudança nos Selects
  const handleSelectChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleWorkplaceSelect = (workplace) => {
    const newSelection = [...selectedWorkplaces, workplace];
    setSelectedWorkplaces(newSelection);
    setFormData({ ...formData, workplaceIds: newSelection.map((w) => w.id) });
  };

  const handleWorkplaceRemove = (workplaceToRemove) => {
    const newSelection = selectedWorkplaces.filter(
      (w) => w.id !== workplaceToRemove.id
    );
    setSelectedWorkplaces(newSelection);
    setFormData({ ...formData, workplaceIds: newSelection.map((w) => w.id) });
  };

  // NOVAS Funções para TURNOS
  const handleShiftSelect = (shift) => {
    const newSelection = [...selectedShifts, shift];
    setSelectedShifts(newSelection);
    setFormData({ ...formData, workShifts: newSelection.map((s) => s.value) });
  };
  const handleShiftRemove = (shiftToRemove) => {
    const newSelection = selectedShifts.filter(
      (s) => s.value !== shiftToRemove.value
    );
    setSelectedShifts(newSelection);
    setFormData({ ...formData, workShifts: newSelection.map((s) => s.value) });
  };

  // NOVAS Funções para SEGMENTOS
  const handleSegmentSelect = (segment) => {
    const newSelection = [...selectedSegments, segment];
    setSelectedSegments(newSelection);
    setFormData({
      ...formData,
      teachingSegments: newSelection.map((s) => s.value),
    });
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
    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não coincidem");
      return false;
    }
    if (formData.password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return false;
    }
    if (formData.cpf && formData.cpf.replace(/\D/g, "").length !== 11) {
      setError("CPF deve ter 11 dígitos");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    // 1. Criamos uma cópia do objeto formData para não alterar o estado original.
    const submissionData = { ...formData };
    // 2. Deletamos a propriedade que não será enviada para a API.
    delete submissionData.confirmPassword;

    const result = await register(submissionData); // O hook register agora recebe um FormData

    if (result.success) {
      setSuccess("Conta criada com sucesso! Redirecionando para o login...");
      setTimeout(() => navigate("/login"), 2000);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card-container max-w-2xl">
        <div className="text-center mb-8">
          <img
            src={Logo}
            alt="Prof Presente Logo"
            className="w-48 mx-auto mb-4"
          />
          <p className="text-gray-400">
            Crie sua conta para começar a registrar sua presença.
          </p>
        </div>

        <Card className="bg-card/80 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle>Formulário de Cadastro</CardTitle>
            <CardDescription>
              Campos marcados com * são obrigatórios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Seu nome completo"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Senha *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirme sua senha"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    name="cpf"
                    type="text"
                    placeholder="000.000.000-00"
                    value={formData.cpf}
                    onChange={handleChange}
                    maxLength={14}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data de Nascimento *</Label>
                  <DatePicker
                    // CORREÇÃO 1: Converte a string YYYY-MM-DD para uma data no fuso local
                    value={
                      formData.birthDate
                        ? toZonedTime(formData.birthDate, "UTC")
                        : null
                    }
                    onSelect={(date) =>
                      handleSelectChange(
                        "birthDate",
                        // CORREÇÃO 2: Converte a data selecionada (local) de volta para YYYY-MM-DD em UTC
                        date ? fromZonedTime(date, "UTC") : ""
                      )
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="text"
                    placeholder="(00) 00000-0000"
                    value={formData.phone}
                    onChange={handleChange}
                    maxLength={15}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço (Rua e Número)</Label>
                  <Input
                    id="address"
                    name="address"
                    type="text"
                    placeholder="Sua rua e número"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    name="neighborhood"
                    value={formData.neighborhood}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="professionName">Profissão</Label>
                  <Input
                    id="professionName"
                    name="professionName"
                    placeholder="Ex: Professor(a), Coordenador(a)"
                    value={formData.professionName}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Unidade(s) Educacional(is)</Label>
                <Popover
                  open={openWorkplacePopover}
                  onOpenChange={setOpenWorkplacePopover}
                >
                  <PopoverTrigger asChild>
                    <div className="flex min-h-[40px] w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                      <div className="flex flex-wrap gap-1">
                        {selectedWorkplaces.map((w) => (
                          <Badge key={w.id} variant="secondary">
                            {w.name}
                            <button
                              type="button"
                              onClick={() => handleWorkplaceRemove(w)}
                              className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            >
                              <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Pesquisar unidade..." />
                      <CommandList>
                        <CommandEmpty>Nenhuma unidade encontrada.</CommandEmpty>
                        <CommandGroup>
                          {workplaces
                            .filter(
                              (w) =>
                                !selectedWorkplaces.some((s) => s.id === w.id)
                            )
                            .map((workplace) => (
                              <CommandItem
                                key={workplace.id}
                                onSelect={() =>
                                  handleWorkplaceSelect(workplace)
                                }
                              >
                                {workplace.name} - {workplace.city}
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Turno(s)</Label>
                  <Popover
                    open={openShiftPopover}
                    onOpenChange={setOpenShiftPopover}
                  >
                    <PopoverTrigger asChild>
                      <div className="flex min-h-[40px] w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                        <div className="flex flex-wrap gap-1">
                          {selectedShifts.length > 0 ? (
                            selectedShifts.map((shift) => (
                              <Badge
                                key={shift.value}
                                variant="outline"
                                className="mr-1"
                              >
                                {shift.label}
                                <button
                                  type="button"
                                  onClick={() => handleShiftRemove(shift)}
                                  className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                >
                                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                </button>
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground">
                              Selecione o turno
                            </span>
                          )}
                        </div>
                        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandList>
                          <CommandEmpty>Nenhuma opção.</CommandEmpty>
                          <CommandGroup>
                            {workShiftOptions
                              .filter(
                                (opt) =>
                                  !selectedShifts.some(
                                    (s) => s.value === opt.value
                                  )
                              )
                              .map((option) => (
                                <CommandItem
                                  key={option.value}
                                  onSelect={() => handleShiftSelect(option)}
                                >
                                  {option.label}
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contractType">Vínculo</Label>
                  <Select
                    value={formData.contractType}
                    onValueChange={(value) =>
                      handleSelectChange("contractType", value)
                    }
                  >
                    <SelectTrigger className="min-h-[40px] w-full">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EFETIVO">Efetivo</SelectItem>
                      <SelectItem value="PRESTADOR">Prestador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Segmento(s) de Ensino</Label>
                  <Popover
                    open={openSegmentPopover}
                    onOpenChange={setOpenSegmentPopover}
                  >
                    <PopoverTrigger asChild>
                      <div className="flex min-h-[40px] w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                        <div className="flex flex-wrap gap-1">
                          {" "}
                          {selectedSegments.length > 0 ? (
                            selectedSegments.map((segment) => (
                              <Badge
                                key={segment.value}
                                variant="outline"
                                className="mr-1"
                              >
                                {segment.label}
                                <button
                                  type="button"
                                  onClick={() => handleSegmentRemove(segment)}
                                  className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                >
                                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                </button>
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground">
                              Selecione o segmento
                            </span>
                          )}
                        </div>
                        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandList>
                          <CommandEmpty>Nenhuma opção.</CommandEmpty>
                          <CommandGroup>
                            {teachingSegmentOptions
                              .filter(
                                (opt) =>
                                  !selectedSegments.some(
                                    (s) => s.value === opt.value
                                  )
                              )
                              .map((option) => (
                                <CommandItem
                                  key={option.value}
                                  onSelect={() => handleSegmentSelect(option)}
                                >
                                  {option.label}
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Conta
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Já tem uma conta?{" "}
                <Link
                  to="/login"
                  className="font-medium text-primary hover:underline"
                >
                  Faça login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            © 2024 Prof Presente. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
