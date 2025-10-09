import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Separator } from "../components/ui/separator"; // NOVO: Importado para separar visualmente os formulários.
import {
  Plus,
  CreditCard as Edit,
  Trash2,
  Users,
  Calendar,
  Award,
  ChartBar as BarChart,
  Upload,
  Printer,
  Building,
  Briefcase,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import UserManagement from "../components/UserManagement";
import BadgePreview from "../components/BadgePreview";
import AwardManagement from "../components/AwardManagement";
import WorkplaceManagement from "../components/WorkplaceManagement";
import ProfessionManagement from "../components/ProfessionManagement";
import ReportsDashboard from "../components/ReportsDashboard";

const API_BASE_URL = import.meta.env.VITE_API_URL.replace("/api", "");

const Admin = () => {
  const { isAdmin, isGestor } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab") || "events";
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    location: "",
    startDate: "",
    endDate: "",
    maxAttendees: "",
  });

  const [badgeTemplateFile, setBadgeTemplateFile] = useState(null);
  const [badgeConfig, setBadgeConfig] = useState({
    nameX: "",
    nameY: "",
    nameFontSize: "",
    nameColor: "#000000",
    qrX: "",
    qrY: "",
    qrSize: "",
  });

  // NOVO: Estado para armazenar a URL da imagem para a pré-visualização.
  const [badgeTemplatePreviewUrl, setBadgeTemplatePreviewUrl] = useState(null);

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ["admin-events"],
    queryFn: async () => {
      const response = await api.get("/events?limit=100");
      return response.data.events;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const response = await api.get("/reports/statistics");
      return response.data;
    },
    enabled: activeTab === "dashboard",
  });

  const createEventMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post("/events", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-events"]);
      queryClient.invalidateQueries(["events"]);
      toast.success("Evento criado com sucesso!");
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Erro ao criar evento");
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/events/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-events"]);
      queryClient.invalidateQueries(["events"]);
      toast.success("Evento atualizado com sucesso!");
      // ALTERAÇÃO: Não fecha mais o modal ao atualizar dados, apenas ao salvar o template.
      //setEditingEvent(null);
      //resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Erro ao atualizar evento");
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/events/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-events"]);
      queryClient.invalidateQueries(["events"]);
      toast.success("Evento excluído com sucesso!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Erro ao excluir evento");
    },
  });

  // NOVO: Mutação para fazer o upload do template e da configuração do crachá.
  const uploadTemplateMutation = useMutation({
    mutationFn: async ({ id, formData }) => {
      const response = await api.post(
        `/events/${id}/badge-template`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-events"]);
      toast.success("Modelo do crachá salvo com sucesso!");
      setEditingEvent(null); // Fecha o modal
      resetForm();
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.error || "Erro ao salvar modelo do crachá"
      );
    },
  });

  const resetForm = () => {
    setEventForm({
      title: "",
      description: "",
      location: "",
      startDate: "",
      endDate: "",
      maxAttendees: "",
    });
    // NOVO: Reseta também os formulários do crachá.
    setBadgeTemplateFile(null);
    setBadgeTemplatePreviewUrl(null);
    setBadgeConfig({
      nameX: "",
      nameY: "",
      nameFontSize: "",
      nameColor: "#000000",
      qrX: "",
      qrY: "",
      qrSize: "",
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...eventForm,
      maxAttendees: eventForm.maxAttendees
        ? parseInt(eventForm.maxAttendees)
        : null,
    };

    if (editingEvent) {
      updateEventMutation.mutate({ id: editingEvent.id, data });
    } else {
      createEventMutation.mutate(data);
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      description: event.description,
      location: event.location,
      startDate: event.startDate.slice(0, 16),
      endDate: event.endDate.slice(0, 16),
      maxAttendees: event.maxAttendees || "",
    });

    // Limpa a preview anterior ao abrir o modal
    setBadgeTemplatePreviewUrl(null);
    setBadgeTemplateFile(null);

    // NOVO: Preenche os campos de configuração do crachá se eles existirem no evento.
    if (event.badgeTemplateConfig) {
      const config = event.badgeTemplateConfig;
      setBadgeConfig({
        nameX: config.name?.x || "",
        nameY: config.name?.y || "",
        nameFontSize: config.name?.fontSize || "",
        nameColor: config.name?.color || "#000000",
        qrX: config.qrCode?.x || "",
        qrY: config.qrCode?.y || "",
        qrSize: config.qrCode?.size || "",
      });
    }
  };

  // NOVO: Função para lidar com a mudança no input de arquivo.
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBadgeTemplateFile(file);
      // Cria uma URL temporária para o arquivo de imagem poder ser exibido.
      if (badgeTemplatePreviewUrl) {
        // Limpa a URL do objeto anterior para evitar memory leak
        URL.revokeObjectURL(badgeTemplatePreviewUrl);
      }
      setBadgeTemplatePreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Tem certeza que deseja excluir este evento?")) {
      deleteEventMutation.mutate(id);
    }
  };

  // NOVO: Função para lidar com o envio do formulário do modelo do crachá.
  const handleTemplateSubmit = (e) => {
    e.preventDefault();
    if (!editingEvent) return;

    const config = {
      name: {
        x: parseInt(badgeConfig.nameX) || 0,
        y: parseInt(badgeConfig.nameY) || 0,
        fontSize: parseInt(badgeConfig.nameFontSize) || 24,
        color: badgeConfig.nameColor,
      },
      qrCode: {
        x: parseInt(badgeConfig.qrX) || 0,
        y: parseInt(badgeConfig.qrY) || 0,
        size: parseInt(badgeConfig.qrSize) || 100,
      },
    };

    const formData = new FormData();
    if (badgeTemplateFile) {
      formData.append("badgeTemplate", badgeTemplateFile);
    }
    formData.append("badgeTemplateConfig", JSON.stringify(config));

    uploadTemplateMutation.mutate({ id: editingEvent.id, formData });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // NOVO: Função para lidar com a impressão de crachás
  const handlePrintBadges = async (eventId, eventTitle) => {
    toast.info("Gerando PDF com os crachás... Isso pode levar um momento.");
    try {
      const response = await api.get(`/events/${eventId}/print-badges`, {
        responseType: "blob", // Importante: espera uma resposta de arquivo binário
      });

      // Cria uma URL temporária para o arquivo recebido
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      // Define o nome do arquivo para download
      link.setAttribute(
        "download",
        `crachas_${eventTitle.replace(/\s+/g, "_")}.pdf`
      );

      // Simula o clique no link para iniciar o download
      document.body.appendChild(link);
      link.click();

      // Limpa a URL temporária
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao gerar PDF de crachás:", error);
      toast.error(
        "Não foi possível gerar o PDF. Verifique se o evento tem um modelo configurado."
      );
    }
  };

  useEffect(() => {
    return () => {
      if (badgeTemplatePreviewUrl) {
        URL.revokeObjectURL(badgeTemplatePreviewUrl);
      }
    };
  }, [badgeTemplatePreviewUrl]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Administração</h1>
        <p className="text-gray-600">
          Gerencie eventos, usuários e visualize estatísticas
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="w-full overflow-x-auto pb-2">
          <TabsList className="w-max space-x-2">
            <TabsTrigger value="dashboard">
              <BarChart className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="events">
              <Calendar className="h-4 w-4 mr-2" />
              Eventos
            </TabsTrigger>
            {(isAdmin || isGestor) && (
              <>
                <TabsTrigger value="users">
                  <Users className="h-4 w-4 mr-2" />
                  Usuários
                </TabsTrigger>
                <TabsTrigger value="awards">
                  <Award className="h-4 w-4 mr-2" />
                  Premiações
                </TabsTrigger>
                <TabsTrigger value="workplaces">
                  <Building className="h-4 w-4 mr-2" />
                  Localidades
                </TabsTrigger>
                <TabsTrigger value="professions">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Profissões
                </TabsTrigger>
                <TabsTrigger value="reports">
                  <FileText className="h-4 w-4 mr-2" />
                  Relatórios
                </TabsTrigger>
              </>
            )}
          </TabsList>
        </div>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total de Eventos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {stats?.totalEvents || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total de Usuários
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {stats?.totalUsers || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Inscrições Ativas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {stats?.activeEnrollments || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total de Check-ins
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {stats?.totalCheckins || 0}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Gerenciar Eventos</h2>
            <Dialog
              open={isCreateDialogOpen || !!editingEvent}
              onOpenChange={(open) => {
                setIsCreateDialogOpen(open);
                if (!open) {
                  setEditingEvent(null);
                  resetForm();
                }
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Evento
                </Button>
              </DialogTrigger>
              <DialogContent className="min-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingEvent ? "Editar Evento" : "Criar Novo Evento"}
                  </DialogTitle>
                  <DialogDescription>
                    Preencha os detalhes do evento abaixo
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título</Label>
                    <Input
                      id="title"
                      value={eventForm.title}
                      onChange={(e) =>
                        setEventForm({ ...eventForm, title: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={eventForm.description}
                      onChange={(e) =>
                        setEventForm({
                          ...eventForm,
                          description: e.target.value,
                        })
                      }
                      rows={4}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Local</Label>
                    <Input
                      id="location"
                      value={eventForm.location}
                      onChange={(e) =>
                        setEventForm({ ...eventForm, location: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Data de Início</Label>
                      <Input
                        id="startDate"
                        type="datetime-local"
                        value={eventForm.startDate}
                        onChange={(e) =>
                          setEventForm({
                            ...eventForm,
                            startDate: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endDate">Data de Término</Label>
                      <Input
                        id="endDate"
                        type="datetime-local"
                        value={eventForm.endDate}
                        onChange={(e) =>
                          setEventForm({
                            ...eventForm,
                            endDate: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxAttendees">
                      Máximo de Participantes (opcional)
                    </Label>
                    <Input
                      id="maxAttendees"
                      type="number"
                      min="1"
                      value={eventForm.maxAttendees}
                      onChange={(e) =>
                        setEventForm({
                          ...eventForm,
                          maxAttendees: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingEvent(null);
                        setIsCreateDialogOpen(false);
                        resetForm();
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        createEventMutation.isPending ||
                        updateEventMutation.isPending
                      }
                    >
                      {createEventMutation.isPending ||
                      updateEventMutation.isPending
                        ? "Salvando..."
                        : editingEvent
                        ? "Atualizar"
                        : "Criar"}
                    </Button>
                  </div>
                </form>

                {/* NOVO: Formulário para o Modelo do Crachá, visível apenas na edição. */}
                {editingEvent && (
                  <>
                    <Separator className="my-4" />
                    {/* CORREÇÃO: O grid agora envolve as duas seções (formulário de config e preview) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Coluna 1: Formulário de Configuração */}
                      {/* CORREÇÃO: Removido o <form> aninhado. Agora é um <div>. */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">
                          Modelo do Crachá Impresso
                        </h3>
                        <div className="space-y-4 p-4 border rounded-lg">
                          <div className="space-y-2">
                            <Label htmlFor="badgeTemplate">
                              Imagem de Fundo
                            </Label>
                            <Input
                              id="badgeTemplate"
                              type="file"
                              onChange={handleFileChange}
                              accept="image/*"
                            />
                            {editingEvent.badgeTemplateUrl &&
                              !badgeTemplateFile && (
                                <p className="text-xs text-gray-500">
                                  Um modelo já foi enviado. Envie um novo para
                                  substituir.
                                </p>
                              )}
                          </div>

                          <h4 className="font-medium text-sm">
                            Posição do Nome
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <Input
                              type="number"
                              placeholder="X"
                              value={badgeConfig.nameX}
                              onChange={(e) =>
                                setBadgeConfig({
                                  ...badgeConfig,
                                  nameX: e.target.value,
                                })
                              }
                            />
                            <Input
                              type="number"
                              placeholder="Y"
                              value={badgeConfig.nameY}
                              onChange={(e) =>
                                setBadgeConfig({
                                  ...badgeConfig,
                                  nameY: e.target.value,
                                })
                              }
                            />
                            <Input
                              type="number"
                              placeholder="Fonte"
                              value={badgeConfig.nameFontSize}
                              onChange={(e) =>
                                setBadgeConfig({
                                  ...badgeConfig,
                                  nameFontSize: e.target.value,
                                })
                              }
                            />
                            <Input
                              type="color"
                              title="Cor da fonte"
                              value={badgeConfig.nameColor}
                              onChange={(e) =>
                                setBadgeConfig({
                                  ...badgeConfig,
                                  nameColor: e.target.value,
                                })
                              }
                            />
                          </div>

                          <h4 className="font-medium text-sm">
                            Posição do QR Code
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <Input
                              type="number"
                              placeholder="X"
                              value={badgeConfig.qrX}
                              onChange={(e) =>
                                setBadgeConfig({
                                  ...badgeConfig,
                                  qrX: e.target.value,
                                })
                              }
                            />
                            <Input
                              type="number"
                              placeholder="Y"
                              value={badgeConfig.qrY}
                              onChange={(e) =>
                                setBadgeConfig({
                                  ...badgeConfig,
                                  qrY: e.target.value,
                                })
                              }
                            />
                            <Input
                              type="number"
                              placeholder="Tamanho"
                              value={badgeConfig.qrSize}
                              onChange={(e) =>
                                setBadgeConfig({
                                  ...badgeConfig,
                                  qrSize: e.target.value,
                                })
                              }
                            />
                          </div>

                          <div className="flex justify-end pt-2">
                            {/* CORREÇÃO: O botão agora é type="button" e chama a função no onClick. */}
                            <Button
                              type="button"
                              onClick={handleTemplateSubmit}
                              disabled={uploadTemplateMutation.isPending}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              {uploadTemplateMutation.isPending
                                ? "Salvando..."
                                : "Salvar Modelo"}
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Coluna 2: Pré-visualização */}
                      <div className="space-y-4">
                        <BadgePreview
                          templateImage={
                            badgeTemplatePreviewUrl ||
                            (editingEvent.badgeTemplateUrl
                              ? `${API_BASE_URL}${editingEvent.badgeTemplateUrl}`
                              : null)
                          }
                          config={badgeConfig}
                          qrCodeImageSrc="/sample-qrcode.png"
                        />
                      </div>
                    </div>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Local</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Término</TableHead>
                    <TableHead>Capacidade</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eventsLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : events?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        Nenhum evento cadastrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    events?.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium">
                          {event.title}
                        </TableCell>
                        <TableCell>{event.location}</TableCell>
                        <TableCell>{formatDate(event.startDate)}</TableCell>
                        <TableCell>{formatDate(event.endDate)}</TableCell>
                        <TableCell>
                          {event.maxAttendees || "Ilimitado"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end items-center gap-1">
                            {/* NOVO: Botão de Impressão em Lote */}
                            {event.badgeTemplateUrl && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handlePrintBadges(event.id, event.title)
                                }
                                title="Imprimir Crachás em Lote"
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(event)}
                              title="Editar Evento"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(event.id)}
                              title="Excluir Evento"
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
        </TabsContent>
        {(isAdmin || isGestor) && (
          <>
            <TabsContent value="users" className="space-y-4">
              <UserManagement />
            </TabsContent>

            <TabsContent value="awards" className="space-y-4">
              <AwardManagement />
            </TabsContent>

            <TabsContent value="workplaces">
              <WorkplaceManagement />
            </TabsContent>

            <TabsContent value="professions">
              <ProfessionManagement />
            </TabsContent>

            <TabsContent value="reports">
              <ReportsDashboard />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
};

export default Admin;
