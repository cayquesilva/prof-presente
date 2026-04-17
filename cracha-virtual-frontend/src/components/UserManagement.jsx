import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import { useDebounce } from "../hooks/useDebounce"; // Hook para debounce
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "./ui/pagination";
import { Badge } from "./ui/badge";
import { Shield, Key, Search, Plus, UserPlus, Calendar, MapPin, Clock, Trash2 } from "lucide-react";
import { toast } from "sonner";
import AdminUserRegister from "./AdminUserRegister";
import { DatePicker } from "./ui/date-picker";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { Separator } from "./ui/separator";

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

const formatCPF = (v) => {
  if (!v) return "";
  v = v.replace(/\D/g, "");
  if (v.length > 11) v = v.slice(0, 11);
  return v.replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

const UserManagement = () => {
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearchTerm = useDebounce(searchTerm, 300); // 300ms de delay

  const [selectedUser, setSelectedUser] = useState(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false); // NOVO
  const [newRole, setNewRole] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedUserForEnrollments, setSelectedUserForEnrollments] = useState(null);
  const [isEnrollmentsDialogOpen, setIsEnrollmentsDialogOpen] = useState(false);

  // Edit User State
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editProfession, setEditProfession] = useState("");
  const [editSerie, setEditSerie] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editWorkload, setEditWorkload] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCpf, setEditCpf] = useState("");
  const [editBirthDate, setEditBirthDate] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editNeighborhood, setEditNeighborhood] = useState("");

  // QUERY: Histórico de inscrições do usuário
  const { data: userEnrollments, isLoading: isLoadingEnrollments } = useQuery({
    queryKey: ["user-enrollments", selectedUserForEnrollments?.id],
    queryFn: async () => {
      if (!selectedUserForEnrollments) return [];
      const response = await api.get(`/users/${selectedUserForEnrollments.id}/enrollments`);
      return response.data;
    },
    enabled: !!selectedUserForEnrollments,
  });

  // QUERY ATUALIZADA para paginação e busca
  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", page, debouncedSearchTerm],
    queryFn: async () => {
      const response = await api.get("/users", {
        params: {
          page,
          limit: 10, // Define quantos usuários por página
          search: debouncedSearchTerm,
        },
      });
      return response.data;
    },
    // Mantém os dados antigos visíveis enquanto a nova página carrega
    keepPreviousData: true,
  });

  const users = data?.users ?? [];
  const pagination = data?.pagination;

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }) => {
      const response = await api.patch(`/users/${userId}/role`, { role });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-users"]);
      toast.success("Tipo de usuário atualizado com sucesso!");
      setIsRoleDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.error || "Erro ao atualizar tipo de usuário"
      );
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }) => {
      const response = await api.post(`/users/${userId}/reset-password`, {
        newPassword,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Senha redefinida com sucesso!");
      setIsPasswordDialogOpen(false);
      setSelectedUser(null);
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Erro ao redefinir senha");
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }) => {
      const response = await api.put(`/users/${userId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-users"]);
      toast.success("Dados do usuário atualizados com sucesso!");
      setIsEditDialogOpen(false);
      setUserToEdit(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Erro ao atualizar usuário");
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId) => {
      const response = await api.delete(`/users/${userId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-users"]);
      toast.success("Usuário excluído com sucesso!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Erro ao excluir usuário");
    },
  });

  const handleRoleChange = () => {
    if (!newRole) {
      toast.error("Selecione um tipo de usuário");
      return;
    }
    updateRoleMutation.mutate({ userId: selectedUser.id, role: newRole });
  };

  const handleEditClick = (user) => {
    setUserToEdit(user);
    setEditName(user.name || "");
    setEditEmail(user.email || "");
    setEditProfession(user.professionName?.toLowerCase() || "");
    setEditSerie(user.serie || "");
    setEditSubject(user.subject || "");
    setEditWorkload(user.workload || "");
    setEditPhone(user.phone || "");
    setEditCpf(formatCPF(user.cpf));
    setEditBirthDate(user.birthDate || "");
    setEditAddress(user.address || "");
    setEditNeighborhood(user.neighborhood || "");
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = () => {
    if (!editName.trim() || !editEmail.trim()) {
      toast.error("Nome e Email são obrigatórios");
      return;
    }
    updateUserMutation.mutate({
      userId: userToEdit.id,
      data: {
        name: editName,
        email: editEmail,
        professionName: editProfession,
        serie: editSerie,
        subject: editSubject,
        workload: editWorkload,
        phone: editPhone,
        cpf: editCpf,
        birthDate: editBirthDate,
        address: editAddress,
        neighborhood: editNeighborhood
      }
    });
  };

  const handleDeleteUser = (user) => {
    if (window.confirm(`Tem certeza que deseja excluir o usuário "${user.name}"? Esta ação não pode ser desfeita.`)) {
      deleteUserMutation.mutate(user.id);
    }
  };


  const handlePasswordReset = () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
    resetPasswordMutation.mutate({ userId: selectedUser.id, newPassword });
  };

  const openRoleDialog = (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setIsRoleDialogOpen(true);
  };

  const openPasswordDialog = (user) => {
    setSelectedUser(user);
    setNewPassword("");
    setConfirmPassword("");
    setIsPasswordDialogOpen(true);
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      ADMIN: { label: "Administrador", variant: "destructive" },
      GESTOR_ESCOLA: { label: "Gestor Educacional", variant: "outline" },
      ORGANIZER: { label: "Organizador", variant: "default" },
      CHECKIN_COORDINATOR: { label: "Coord. Check-in", variant: "secondary" },
      TEACHER: { label: "Professor", variant: "outline" },
      USER: { label: "Usuário", variant: "outline" },
      SPEAKER: { label: "Palestrante", variant: "default" }, // Usando variant default para destaque
    };
    const config = roleConfig[role] || roleConfig.USER;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading && page === 1 && !searchTerm) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-gray-500">Carregando usuários...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Usuários</CardTitle>
          <CardDescription>
            Gerencie tipos de usuário e redefina senhas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="relative w-full sm:w-auto flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1); // Reseta para a primeira página ao buscar
                }}
                className="pl-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-indigo-500"
              />
            </div>
            <Button onClick={() => setIsRegisterDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          </div>

          <div className="rounded-md border-none md:border">
            {/* MOBILE VIEW: Cards */}
            <div className="md:hidden space-y-4">
              {isLoading ? (
                <div className="text-center p-4">Carregando...</div>
              ) : users.length === 0 ? (
                <div className="text-center p-4 text-gray-500">Nenhum usuário encontrado</div>
              ) : (
                users.map((user) => (
                  <Card key={user.id} className="overflow-hidden border dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                    <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2 border-b dark:border-slate-700 flex justify-between items-center">
                      <span className="font-semibold truncate max-w-[200px]">{user.name}</span>
                      {getRoleBadge(user.role)}
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <p className="text-muted-foreground text-xs font-medium uppercase">Email</p>
                        <p className="text-sm break-all">{user.email}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {user.professionName && (
                          <div>
                            <p className="text-muted-foreground font-medium uppercase">Profissão</p>
                            <p className="capitalize">{user.professionName}</p>
                          </div>
                        )}
                        {user.workload && (
                          <div>
                            <p className="text-muted-foreground font-medium uppercase">Carga H.</p>
                            <p>{user.workload}</p>
                          </div>
                        )}
                        {user.serie && (
                          <div>
                            <p className="text-muted-foreground font-medium uppercase">Série</p>
                            <p className="capitalize">{user.serie}</p>
                          </div>
                        )}
                        {user.subject && (
                          <div>
                            <p className="text-muted-foreground font-medium uppercase">Comp. Curr.</p>
                            <p className="capitalize">{user.subject}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t">
                        {isAdmin && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openRoleDialog(user)}
                            className="h-8"
                          >
                            <Shield className="h-4 w-4 mr-1" />
                            Tipo
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openPasswordDialog(user)}
                          className="h-8"
                        >
                          <Key className="h-4 w-4 mr-1" />
                          Senha
                        </Button>
                        {isAdmin && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteUser(user)}
                            className="h-8"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Excluir
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* DESKTOP VIEW: Table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Profissão</TableHead>
                    <TableHead>Série</TableHead>
                    <TableHead>Componente</TableHead>
                    <TableHead>Carga H.</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        Buscando...
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        Nenhum usuário encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell className="capitalize text-xs">{user.professionName || "-"}</TableCell>
                        <TableCell className="capitalize text-xs">{user.serie || "-"}</TableCell>
                        <TableCell className="capitalize text-xs">{user.subject || "-"}</TableCell>
                        <TableCell className="text-xs">{user.workload || "-"}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditClick(user)}
                            title="Editar"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil mr-1"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                            Editar
                          </Button>
                          {isAdmin && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openRoleDialog(user)}
                            >
                              <Shield className="h-4 w-4 mr-1" />
                              Tipo
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openPasswordDialog(user)}
                          >
                            <Key className="h-4 w-4 mr-1" />
                            Senha
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUserForEnrollments(user);
                              setIsEnrollmentsDialogOpen(true);
                            }}
                            title="Ver Inscrições"
                          >
                            <Calendar className="h-4 w-4 mr-1" />
                            Histórico
                          </Button>
                          {isAdmin && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteUser(user)}
                              title="Excluir Usuário"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Excluir
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* COMPONENTE DE PAGINAÇÃO */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Total: {pagination?.total || 0} usuário(s)
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPage((old) => Math.max(old - 1, 1));
                    }}
                    disabled={page === 1}
                  />
                </PaginationItem>
                <PaginationItem>
                  <span className="px-4 text-sm">
                    Página {pagination?.page} de {pagination?.pages}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (pagination && page < pagination.pages) {
                        setPage((old) => old + 1);
                      }
                    }}
                    disabled={!pagination || page >= pagination.pages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>

      {/* Dialog para alterar tipo de usuário */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="p-0 gap-0 overflow-hidden sm:rounded-[2.5rem] border-none shadow-2xl max-w-[450px] w-full bg-white dark:bg-slate-900 mx-auto">
          <DialogHeader className="p-10 pb-8 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-left">
            <div className="flex items-center gap-6">
              <div className="bg-indigo-600 text-white p-4 rounded-3xl shadow-lg shadow-indigo-100 dark:shadow-none">
                <Shield className="h-7 w-7" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-tight">
                  Permissões
                </DialogTitle>
                <DialogDescription className="font-bold text-slate-500 text-base mt-1">
                  Nível de acesso para <strong>{selectedUser?.name}</strong>.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="p-10 space-y-4 bg-white dark:bg-slate-900">
            <div className="space-y-4">
              <Label htmlFor="role" className="font-black text-slate-700 dark:text-slate-300 ml-1 uppercase text-[10px] tracking-[0.2em]">Nível de Acesso no Sistema</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger id="role" className="h-14 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-indigo-500 transition-all font-bold text-slate-900 dark:text-white">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl p-2 bg-white/90 backdrop-blur-xl">
                  <SelectItem value="USER" className="rounded-xl font-bold py-3">Usuário (Professor/Servidor)</SelectItem>
                  <SelectItem value="TEACHER" className="rounded-xl font-bold py-3">Professor (Destaque)</SelectItem>
                  <SelectItem value="CHECKIN_COORDINATOR" className="rounded-xl font-bold py-3">Coord. de Check-in</SelectItem>
                  <SelectItem value="ORGANIZER" className="rounded-xl font-bold py-3">Organizador (Gestor)</SelectItem>
                  <SelectItem value="GESTOR_ESCOLA" className="rounded-xl font-bold py-3">Gestor Educacional</SelectItem>
                  <SelectItem value="SPEAKER" className="rounded-xl font-bold py-3">Palestrante</SelectItem>
                  <SelectItem value="ADMIN" className="rounded-xl font-bold py-3">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="p-8 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4">
            <Button variant="ghost" onClick={() => setIsRoleDialogOpen(false)} className="h-14 rounded-2xl font-black uppercase tracking-widest order-2 sm:order-1 sm:flex-1 text-slate-500 hover:text-slate-900">
              Cancelar
            </Button>
            <Button onClick={handleRoleChange} disabled={updateRoleMutation.isPending} className="h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-2xl shadow-indigo-100 dark:shadow-none active:scale-95 transition-all text-lg uppercase tracking-wider order-1 sm:order-2 sm:flex-[2]">
              {updateRoleMutation.isPending ? "Salvando..." : "Salvar Nível"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG DE EDIÇÃO DE USUÁRIO */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="p-0 gap-0 overflow-hidden sm:rounded-[2.5rem] border-none shadow-2xl max-w-2xl w-full bg-white dark:bg-slate-900 mx-auto">
          <DialogHeader className="p-10 pb-8 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-left">
            <div className="flex items-center gap-6">
              <div className="bg-slate-900 text-white p-4 rounded-3xl shadow-lg border-2 border-slate-800">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
              </div>
              <div>
                <DialogTitle className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-tight">
                  Editar Cadastro
                </DialogTitle>
                <DialogDescription className="font-bold text-slate-500 text-base mt-1">
                  Atualize os dados de <strong>{userToEdit?.name}</strong>.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="max-h-[70vh] overflow-y-auto p-10 space-y-10 custom-scrollbar bg-white dark:bg-slate-900">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
              <div className="space-y-4 md:col-span-2">
                <Label className="font-black text-slate-700 dark:text-slate-300 ml-1 uppercase text-[10px] tracking-[0.2em]">Nome Completo *</Label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Nome do usuário"
                  className="h-14 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-slate-900 transition-all font-bold text-slate-900 dark:text-white"
                />
              </div>
              <div className="space-y-4 md:col-span-2">
                <Label className="font-black text-slate-700 dark:text-slate-300 ml-1 uppercase text-[10px] tracking-[0.2em]">Email Institucional *</Label>
                <Input
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  type="email"
                  className="h-14 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-slate-900 transition-all font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-4">
                <Label className="font-black text-slate-700 dark:text-slate-300 ml-1 uppercase text-[10px] tracking-[0.2em]">Data de Nascimento</Label>
                <div className="h-14">
                  <DatePicker
                    value={editBirthDate ? toZonedTime(editBirthDate, "America/Sao_Paulo") : null}
                    onSelect={(date) => setEditBirthDate(date ? fromZonedTime(date, "America/Sao_Paulo") : "")}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label className="font-black text-slate-700 dark:text-slate-300 ml-1 uppercase text-[10px] tracking-[0.2em]">CPF</Label>
                <Input
                  value={editCpf}
                  onChange={(e) => {
                    let v = e.target.value.replace(/\D/g, "");
                    if (v.length > 11) v = v.slice(0, 11);
                    v = v.replace(/(\d{3})(\d)/, "$1.$2")
                      .replace(/(\d{3})(\d)/, "$1.$2")
                      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
                    setEditCpf(v);
                  }}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className="h-14 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-slate-900 transition-all font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-4">
                <Label className="font-black text-slate-700 dark:text-slate-300 ml-1 uppercase text-[10px] tracking-[0.2em]">WhatsApp / Contato</Label>
                <Input
                  value={editPhone}
                  onChange={(e) => {
                    let v = e.target.value.replace(/\D/g, "");
                    if (v.length > 11) v = v.slice(0, 11);
                    v = v.replace(/(\d{2})(\d)/, "($1) $2")
                      .replace(/(\d{5})(\d)/, "$1-$2");
                    setEditPhone(v);
                  }}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                  className="h-14 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-slate-900 transition-all font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-4">
                <Label className="font-black text-slate-700 dark:text-slate-300 ml-1 uppercase text-[10px] tracking-[0.2em]">Carga Horária</Label>
                <Input
                  value={editWorkload}
                  onChange={(e) => setEditWorkload(e.target.value)}
                  placeholder="Ex: 40h"
                  className="h-14 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-slate-900 transition-all font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-4 md:col-span-2">
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-800 space-y-8">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 px-1">Localização</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="font-black text-slate-500 uppercase text-[9px] tracking-widest ml-1">Logradouro / Número</Label>
                      <Input
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        placeholder="Rua, número"
                        className="h-12 rounded-xl bg-white border-transparent focus:border-slate-900 transition-all font-bold text-slate-900 dark:text-white text-sm"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="font-black text-slate-500 uppercase text-[9px] tracking-widest ml-1">Bairro</Label>
                      <Input
                        value={editNeighborhood}
                        onChange={(e) => setEditNeighborhood(e.target.value)}
                        placeholder="Bairro"
                        className="h-12 rounded-xl bg-white border-transparent focus:border-slate-900 transition-all font-bold text-slate-900 dark:text-white text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 md:col-span-2">
                <div className="p-8 bg-blue-50/30 dark:bg-blue-900/10 rounded-[2.5rem] border border-blue-100/50 dark:border-blue-800/30 space-y-8">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 px-1">Dados Profissionais</h4>
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label className="font-black text-blue-500 uppercase text-[9px] tracking-widest ml-1">Profissão / Cargo Atual</Label>
                      <Select value={editProfession} onValueChange={setEditProfession}>
                        <SelectTrigger className="h-14 rounded-2xl bg-white dark:bg-slate-900 border-transparent focus:ring-blue-500 transition-all font-bold text-slate-900 dark:text-white">
                          <SelectValue placeholder="Selecione o cargo" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl p-2 bg-white/95 backdrop-blur-xl">
                          {professionOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value} className="rounded-xl font-bold py-3">{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {editProfession?.toLowerCase() === "professor" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="space-y-3">
                          <Label className="font-black text-blue-500 uppercase text-[9px] tracking-widest ml-1">Série / Ano</Label>
                          <Select value={editSerie} onValueChange={setEditSerie}>
                            <SelectTrigger className="h-12 rounded-xl bg-white dark:bg-slate-900 border-transparent focus:ring-blue-500 transition-all font-bold text-slate-900 dark:text-white text-sm">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-none shadow-2xl p-2 bg-white/95 backdrop-blur-xl">
                              {serieOptions.map(opt => (
                                <SelectItem key={opt.value} value={opt.value} className="rounded-xl font-bold py-2">{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-3">
                          <Label className="font-black text-blue-500 uppercase text-[9px] tracking-widest ml-1">Comp. Curricular</Label>
                          <Select value={editSubject} onValueChange={setEditSubject}>
                            <SelectTrigger className="h-12 rounded-xl bg-white dark:bg-slate-900 border-transparent focus:ring-blue-500 transition-all font-bold text-slate-900 dark:text-white text-sm">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-none shadow-2xl p-2 bg-white/95 backdrop-blur-xl">
                              {subjectOptions.map(opt => (
                                <SelectItem key={opt.value} value={opt.value} className="rounded-xl font-bold py-2">{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="p-8 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4">
            <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)} className="h-14 rounded-2xl font-black uppercase tracking-widest order-2 sm:order-1 sm:flex-1 text-slate-500 hover:text-slate-900">
              Cancelar
            </Button>
            <Button onClick={handleUpdateUser} disabled={updateUserMutation.isPending} className="h-14 bg-slate-900 hover:bg-black text-white font-black rounded-2xl shadow-2xl shadow-slate-100 dark:shadow-none active:scale-95 transition-all text-lg uppercase tracking-wider order-1 sm:order-2 sm:flex-[2]">
              {updateUserMutation.isPending ? "Processando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="p-0 gap-0 overflow-hidden sm:rounded-[2.5rem] border-none shadow-2xl max-w-[450px] w-full bg-white dark:bg-slate-900 mx-auto">
          <DialogHeader className="p-10 pb-8 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-left">
            <div className="flex items-center gap-6">
              <div className="bg-rose-600 text-white p-4 rounded-3xl shadow-lg shadow-rose-100 dark:shadow-none">
                <Key className="h-7 w-7" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-tight">
                  Nova Senha
                </DialogTitle>
                <DialogDescription className="font-bold text-slate-500 text-base mt-1">
                  Redefinição para <strong>{selectedUser?.name}</strong>.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="p-10 space-y-8 bg-white dark:bg-slate-900">
            <div className="space-y-4">
              <Label htmlFor="newPassword" className="font-black text-slate-700 dark:text-slate-300 ml-1 uppercase text-[10px] tracking-[0.2em]">Crie uma Nova Senha</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-700 focus:border-rose-500 transition-all font-bold text-slate-900 dark:text-white"
              />
            </div>
            <div className="space-y-4">
              <Label htmlFor="confirmPassword" className="font-black text-slate-700 dark:text-slate-300 ml-1 uppercase text-[10px] tracking-[0.2em]">Confirme a Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                className="h-14 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-rose-500 transition-all font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>
          <DialogFooter className="p-8 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4">
            <Button variant="ghost" onClick={() => setIsPasswordDialogOpen(false)} className="h-14 rounded-2xl font-black uppercase tracking-widest order-2 sm:order-1 sm:flex-1 text-slate-500 hover:text-slate-900">
              Cancelar
            </Button>
            <Button onClick={handlePasswordReset} disabled={resetPasswordMutation.isPending} className="h-14 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl shadow-2xl shadow-rose-100 dark:shadow-none active:scale-95 transition-all text-lg uppercase tracking-wider order-1 sm:order-2 sm:flex-[2]">
              {resetPasswordMutation.isPending ? "Processando..." : "Redefinir Senha"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen}>
        <DialogContent className="p-0 gap-0 overflow-hidden sm:rounded-[2.5rem] border-none shadow-2xl max-w-4xl w-full h-full sm:h-auto max-h-[95vh] flex flex-col bg-white dark:bg-slate-900 mx-auto">
          <DialogHeader className="p-10 pb-8 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-left">
            <div className="flex items-center gap-6">
              <div className="bg-emerald-600 text-white p-4 rounded-3xl shadow-lg shadow-emerald-100 dark:shadow-none">
                <UserPlus className="h-7 w-7" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-tight">
                  Novo Cadastro
                </DialogTitle>
                <DialogDescription className="font-bold text-slate-500 text-base mt-1">
                  Criação manual de conta institucional no sistema.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <AdminUserRegister
              onSuccess={() => {
                setIsRegisterDialogOpen(false);
                queryClient.invalidateQueries(["admin-users"]);
              }}
              onCancel={() => setIsRegisterDialogOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEnrollmentsDialogOpen} onOpenChange={setIsEnrollmentsDialogOpen}>
        <DialogContent className="p-0 gap-0 overflow-hidden sm:rounded-[2.5rem] border-none shadow-2xl max-w-4xl w-full h-full sm:h-auto max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 mx-auto">
          <DialogHeader className="p-10 pb-8 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-left">
            <div className="flex items-center gap-6">
              <div className="bg-blue-600 text-white p-4 rounded-3xl shadow-lg shadow-blue-100 dark:shadow-none">
                <Calendar className="h-7 w-7" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-tight">
                  Histórico
                </DialogTitle>
                <DialogDescription className="font-bold text-slate-500 text-base mt-1">
                  Participações de <strong>{selectedUserForEnrollments?.name}</strong>.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-10 bg-slate-50/10 dark:bg-slate-900/10 custom-scrollbar">
            {isLoadingEnrollments ? (
              <div className="py-20 text-center">
                <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-6" />
                <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest">Sincronizando registros...</p>
              </div>
            ) : userEnrollments && userEnrollments.length > 0 ? (
              <div className="rounded-[2rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                    <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 p-6">Evento</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 p-6">Sessão / Local</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 p-6 text-center">Status</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 p-6 text-center">Presença</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userEnrollments.map((enrollment) => (
                      <TableRow key={enrollment.eventId} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors border-slate-50 dark:border-slate-800">
                        <TableCell className="p-6">
                          <p className="font-black text-slate-900 dark:text-white text-sm leading-tight">{enrollment.eventTitle}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-tight">ID: {enrollment.eventId.slice(-8).toUpperCase()}</p>
                        </TableCell>
                        <TableCell className="p-6">
                          <div className="space-y-2">
                            <div className="flex items-center text-xs font-black text-slate-600 dark:text-slate-300">
                              <Calendar className="w-3.5 h-3.5 mr-2 text-blue-500" />
                              {new Date(enrollment.eventDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </div>
                            <div className="flex items-center text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                              <MapPin className="w-3 h-3 mr-2" />
                              {enrollment.location}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="p-6 text-center">
                          {enrollment.status === "APPROVED" ? (
                            <Badge className="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-none px-4 h-7 rounded-full font-black text-[9px] uppercase tracking-widest">Confirmado</Badge>
                          ) : enrollment.status === "PENDING" ? (
                            <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/20 px-4 h-7 rounded-full font-black text-[9px] uppercase tracking-widest">Pendente</Badge>
                          ) : (
                            <Badge variant="destructive" className="px-4 h-7 rounded-full font-black text-[9px] uppercase tracking-widest">Cancelado</Badge>
                          )}
                        </TableCell>
                        <TableCell className="p-6 text-center">
                          {enrollment.checkInTime ? (
                            <div className="inline-flex items-center px-4 py-2 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-tighter shadow-sm">
                              <Clock className="w-3.5 h-3.5 mr-2" />
                              {new Date(enrollment.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          ) : (
                            <span className="text-slate-200 dark:text-slate-700 font-black text-xs tracking-widest">--:--</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-20 text-center bg-white dark:bg-slate-800/50 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
                <div className="bg-slate-50 dark:bg-slate-800 h-24 w-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <Calendar className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Sem Registros</h3>
                <p className="text-slate-400 text-sm font-bold max-w-xs mx-auto px-6 italic">Este membro ainda não registrou participação em eventos.</p>
              </div>
            )}
          </div>

          <DialogFooter className="p-8 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" onClick={() => setIsEnrollmentsDialogOpen(false)} className="h-14 rounded-2xl font-black uppercase tracking-widest w-full text-slate-500 hover:text-slate-900">
              Concluir Visualização
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  );
};

export default UserManagement;
