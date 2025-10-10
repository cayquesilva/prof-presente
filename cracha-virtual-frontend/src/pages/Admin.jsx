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
import { Separator } from "../components/ui/separator";
import {
  Plus,
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
  Send,
  Pencil,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import UserManagement from "../components/UserManagement";
import BadgePreview from "../components/BadgePreview";
import AwardManagement from "../components/AwardManagement";
import WorkplaceManagement from "../components/WorkplaceManagement";
import ProfessionManagement from "../components/ProfessionManagement";
import ReportsDashboard from "../components/ReportsDashboard";
import CertificatePreview from "../components/CertificatePreview";
import { Badge } from "../components/ui/badge";
import { Combobox } from "../components/ui/combobox";

const API_BASE_URL = import.meta.env.VITE_API_URL.replace("/api", "");

const Admin = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab") || "events";
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  // ALTERAÇÃO: Renomeado para refletir que guarda o arquivo, não a URL
  const [certificateTemplateFile, setCertificateTemplateFile] = useState(null);

  // NOVO: Estado para a URL de preview do certificado
  const [certificateTemplatePreviewUrl, setCertificateTemplatePreviewUrl] =
    useState(null);

  const [certificateConfig, setCertificateConfig] = useState({
    nameX: "",
    nameY: "",
    nameFontSize: "",
    nameColor: "#000000",
    hoursX: "",
    hoursY: "",
    hoursFontSize: "",
    hoursColor: "#333333",
  });

  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    location: "",
    startDate: "",
    endDate: "",
    maxAttendees: "",
    parentId: "",
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

  // NOVO: Query para buscar os logs de certificado do evento em edição
  const { data: certificateLogs, isLoading: logsLoading } = useQuery({
    queryKey: ["certificate-logs", editingEvent?.id],
    queryFn: async () => {
      const response = await api.get(
        `/events/${editingEvent.id}/certificate-logs`
      );
      return response.data;
    },
    // A query só será executada quando 'editingEvent' existir
    enabled: !!editingEvent?.id,
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
      setEditingEvent(null);
      resetForm();
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.error || "Erro ao salvar modelo do crachá"
      );
    },
  });

  const uploadCertificateMutation = useMutation({
    mutationFn: async ({ id, formData }) => {
      const response = await api.post(
        `/events/${id}/certificate-template`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return response.data;
    },
    // CORREÇÃO: A função agora é 'async' e usa 'refetchQueries' com 'await'
    onSuccess: async () => {
      // Força a busca pelos dados mais recentes e espera a conclusão
      await queryClient.refetchQueries({ queryKey: ["admin-events"] });

      toast.success("Modelo de certificado salvo com sucesso!");

      // Agora, com os dados já atualizados, podemos fechar o modal
      setEditingEvent(null);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Erro ao salvar modelo.");
    },
  });

  // NOVA MUTATION: para enviar os certificados
  const sendCertificatesMutation = useMutation({
    mutationFn: (eventId) => api.post(`/events/${eventId}/send-certificates`),
    onSuccess: (data) => {
      toast.info(
        data.data.message || "Processo de envio de certificados iniciado."
      );
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.error || "Falha ao iniciar envio de certificados."
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
      parentId: "",
    });

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

    // NOVO: Reset dos estados do certificado
    setCertificateTemplateFile(null);
    setCertificateTemplatePreviewUrl(null);
    setCertificateConfig({
      nameX: "",
      nameY: "",
      nameFontSize: "",
      nameColor: "#000000",
      hoursX: "",
      hoursY: "",
      hoursFontSize: "",
      hoursColor: "#333333",
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...eventForm,
      startDate: `${eventForm.startDate}:00.000Z`,
      endDate: `${eventForm.endDate}:00.000Z`,
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
      parentId: event.parentId || "",
    });

    setBadgeTemplatePreviewUrl(null);
    setBadgeTemplateFile(null);

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

    // Limpa a preview do certificado ao abrir o modal
    setCertificateTemplatePreviewUrl(null);
    setCertificateTemplateFile(null);

    // Reseta a configuração para o padrão
    setCertificateConfig({
      nameX: "",
      nameY: "",
      nameFontSize: "",
      nameColor: "#000000",
      hoursX: "",
      hoursY: "",
      hoursFontSize: "",
      hoursColor: "#333333",
    });

    // Preenche com a configuração salva, se existir
    if (event.certificateTemplateConfig) {
      const config = event.certificateTemplateConfig;
      setCertificateConfig({
        nameX: config.name?.x || "",
        nameY: config.name?.y || "",
        nameFontSize: config.name?.fontSize || "",
        nameColor: config.name?.color || "#000000",
        hoursX: config.hours?.x || "",
        hoursY: config.hours?.y || "",
        hoursFontSize: config.hours?.fontSize || "",
        hoursColor: config.hours?.color || "#333333",
      });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBadgeTemplateFile(file);
      if (badgeTemplatePreviewUrl) {
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
      timeZone: "UTC",
    });
  };

  // FUNÇÃO CORRIGIDA: para lidar com a mudança no input de arquivo do certificado
  const handleCertificateFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCertificateTemplateFile(file);
      // Lógica para criar e limpar a URL de preview
      if (certificateTemplatePreviewUrl) {
        URL.revokeObjectURL(certificateTemplatePreviewUrl);
      }
      setCertificateTemplatePreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleCertificateTemplateSubmit = (e) => {
    e.preventDefault();
    if (!editingEvent) return;

    const config = {
      name: {
        x: parseInt(certificateConfig.nameX) || 0,
        y: parseInt(certificateConfig.nameY) || 0,
        fontSize: parseInt(certificateConfig.nameFontSize) || 24,
        color: certificateConfig.nameColor,
      },
      hours: {
        x: parseInt(certificateConfig.hoursX) || 0,
        y: parseInt(certificateConfig.hoursY) || 0,
        fontSize: parseInt(certificateConfig.hoursFontSize) || 18,
        color: certificateConfig.hoursColor,
      },
    };

    const formData = new FormData();
    if (certificateTemplateFile) {
      formData.append("certificateTemplate", certificateTemplateFile);
    }
    formData.append("certificateTemplateConfig", JSON.stringify(config));
    uploadCertificateMutation.mutate({ id: editingEvent.id, formData });
  };

  const handlePrintBadges = async (eventId, eventTitle) => {
    toast.info("Gerando PDF com os crachás... Isso pode levar um momento.");
    try {
      const response = await api.get(`/events/${eventId}/print-badges`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `crachas_${eventTitle.replace(/\s+/g, "_")}.pdf`
      );

      document.body.appendChild(link);
      link.click();

      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao gerar PDF de crachás:", error);
      toast.error(
        "Não foi possível gerar o PDF. Verifique se o evento tem um modelo configurado."
      );
    }
  };

  // NOVA FUNÇÃO: para chamar a mutation de envio de certificados
  const handleSendCertificates = (eventId, eventTitle) => {
    if (
      window.confirm(
        `Tem certeza que deseja enviar os certificados para todos os participantes elegíveis do evento "${eventTitle}"?`
      )
    ) {
      sendCertificatesMutation.mutate(eventId);
    }
  };

  // Efeito para limpar as URLs de preview ao desmontar o componente ou ao mudar a URL
  useEffect(() => {
    return () => {
      // Esta função de limpeza agora só executa ao fechar o modal/sair da página.
      if (badgeTemplatePreviewUrl) {
        URL.revokeObjectURL(badgeTemplatePreviewUrl);
      }
      if (certificateTemplatePreviewUrl) {
        URL.revokeObjectURL(certificateTemplatePreviewUrl);
      }
    };
  }, []);

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
            {isAdmin && (
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
              </>
            )}
            <TabsTrigger value="reports">
              <FileText className="h-4 w-4 mr-2" />
              Relatórios
            </TabsTrigger>
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

                  <div className="space-y-2">
                    <Label>Evento Pai (Opcional)</Label>
                    <Combobox
                      options={[
                        {
                          value: "",
                          label: "Nenhum (Este é um evento principal)",
                        },
                        ...(events
                          ?.filter((e) => e.id !== editingEvent?.id)
                          .map((e) => ({ value: e.id, label: e.title })) || []),
                      ]}
                      value={eventForm.parentId}
                      onSelect={(value) =>
                        setEventForm({ ...eventForm, parentId: value })
                      }
                      placeholder="Selecione o evento principal..."
                      searchPlaceholder="Pesquisar evento..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Selecione se este evento faz parte de um evento maior (ex:
                      uma palestra dentro de um congresso).
                    </p>
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

                {editingEvent && (
                  <>
                    <Separator className="my-4" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                          onConfigChange={setBadgeConfig}
                        />
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <form
                      onSubmit={handleCertificateTemplateSubmit}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">
                            Modelo do Certificado
                          </h3>
                          <div className="p-4 border rounded-lg space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="certificateTemplate">
                                Imagem do Certificado
                              </Label>
                              <Input
                                id="certificateTemplate"
                                type="file"
                                onChange={handleCertificateFileChange}
                                accept="image/*"
                              />
                              {editingEvent.certificateTemplateUrl &&
                                !certificateTemplateFile && (
                                  <p className="text-xs text-muted-foreground">
                                    Um modelo já foi enviado. Envie um novo para
                                    substituir.
                                  </p>
                                )}
                            </div>

                            <h4 className="font-medium text-sm">
                              Posição do Nome
                            </h4>
                            <div className="grid grid-cols-4 gap-2">
                              <Input
                                type="number"
                                placeholder="X"
                                value={certificateConfig.nameX}
                                onChange={(e) =>
                                  setCertificateConfig({
                                    ...certificateConfig,
                                    nameX: e.target.value,
                                  })
                                }
                              />
                              <Input
                                type="number"
                                placeholder="Y"
                                value={certificateConfig.nameY}
                                onChange={(e) =>
                                  setCertificateConfig({
                                    ...certificateConfig,
                                    nameY: e.target.value,
                                  })
                                }
                              />
                              <Input
                                type="number"
                                placeholder="Fonte"
                                value={certificateConfig.nameFontSize}
                                onChange={(e) =>
                                  setCertificateConfig({
                                    ...certificateConfig,
                                    nameFontSize: e.target.value,
                                  })
                                }
                              />
                              <Input
                                type="color"
                                title="Cor da fonte"
                                value={certificateConfig.nameColor}
                                onChange={(e) =>
                                  setCertificateConfig({
                                    ...certificateConfig,
                                    nameColor: e.target.value,
                                  })
                                }
                              />
                            </div>

                            <h4 className="font-medium text-sm">
                              Posição das Horas
                            </h4>
                            <div className="grid grid-cols-4 gap-2">
                              <Input
                                type="number"
                                placeholder="X"
                                value={certificateConfig.hoursX}
                                onChange={(e) =>
                                  setCertificateConfig({
                                    ...certificateConfig,
                                    hoursX: e.target.value,
                                  })
                                }
                              />
                              <Input
                                type="number"
                                placeholder="Y"
                                value={certificateConfig.hoursY}
                                onChange={(e) =>
                                  setCertificateConfig({
                                    ...certificateConfig,
                                    hoursY: e.target.value,
                                  })
                                }
                              />
                              <Input
                                type="number"
                                placeholder="Fonte"
                                value={certificateConfig.hoursFontSize}
                                onChange={(e) =>
                                  setCertificateConfig({
                                    ...certificateConfig,
                                    hoursFontSize: e.target.value,
                                  })
                                }
                              />
                              <Input
                                type="color"
                                title="Cor da fonte"
                                value={certificateConfig.hoursColor}
                                onChange={(e) =>
                                  setCertificateConfig({
                                    ...certificateConfig,
                                    hoursColor: e.target.value,
                                  })
                                }
                              />
                            </div>

                            <div className="flex justify-end pt-2">
                              <Button
                                type="submit"
                                disabled={uploadCertificateMutation.isPending}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Salvar Modelo
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* CORREÇÃO: Passando a prop 'templateImage' e usando a nova URL de preview */}
                        <CertificatePreview
                          templateImage={
                            certificateTemplatePreviewUrl ||
                            (editingEvent.certificateTemplateUrl
                              ? `${API_BASE_URL}${editingEvent.certificateTemplateUrl}`
                              : null)
                          }
                          config={certificateConfig}
                          onConfigChange={setCertificateConfig}
                        />
                      </div>
                    </form>
                    {/* NOVA SEÇÃO: LOGS DE ENVIO */}
                    <Separator className="my-4" />
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">
                        Histórico de Envio de Certificados
                      </h3>
                      <div className="border rounded-lg max-h-64 overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Status</TableHead>
                              <TableHead>Participante</TableHead>
                              <TableHead>Data</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {logsLoading ? (
                              <TableRow>
                                <TableCell colSpan={3} className="text-center">
                                  <Clock className="h-4 w-4 mr-2 inline-block animate-spin" />
                                  Carregando histórico...
                                </TableCell>
                              </TableRow>
                            ) : certificateLogs &&
                              certificateLogs.length > 0 ? (
                              certificateLogs.map((log) => (
                                <TableRow key={log.id}>
                                  <TableCell>
                                    {log.status === "SUCCESS" ? (
                                      <Badge
                                        variant="default"
                                        className="bg-green-600"
                                      >
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        Enviado
                                      </Badge>
                                    ) : (
                                      <Badge variant="destructive">
                                        <XCircle className="h-3 w-3 mr-1" />
                                        Falhou
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="font-medium">
                                      {log.user.name}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {log.user.email}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-xs">
                                    {new Date(log.createdAt).toLocaleString(
                                      "pt-BR"
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell
                                  colSpan={3}
                                  className="text-center text-muted-foreground"
                                >
                                  Nenhum certificado foi enviado para este
                                  evento ainda.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
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
                    <TableHead>Visibilidade</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Término</TableHead>
                    <TableHead>Capacidade</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
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
                        <TableCell>
                          {event.isPrivate ? (
                            <Badge variant="secondary">Privado</Badge>
                          ) : (
                            <Badge variant="outline">Público</Badge>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(event.startDate)}</TableCell>
                        <TableCell>{formatDate(event.endDate)}</TableCell>
                        <TableCell>
                          {event.maxAttendees || "Ilimitado"}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-between items-center gap-1">
                            {/* BOTÃO DE EDITAR (sem alteração de lógica) */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(event)}
                              title="Editar Evento"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>

                            {/* BOTÃO DE IMPRIMIR CRACHÁS */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handlePrintBadges(event.id, event.title)
                              }
                              // AQUI A MUDANÇA: O botão é desabilitado se a URL do template não existir.
                              disabled={!event.badgeTemplateUrl}
                              // A dica também se torna dinâmica.
                              title={
                                event.badgeTemplateUrl
                                  ? "Imprimir Crachás em Lote"
                                  : "Configure o modelo de crachá para habilitar a impressão"
                              }
                            >
                              <Printer className="h-4 w-4" />
                            </Button>

                            {/* BOTÃO DE ENVIAR CERTIFICADOS */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleSendCertificates(event.id, event.title)
                              }
                              // AQUI A MUDANÇA: O botão é desabilitado se a URL do template não existir.
                              disabled={
                                !event.certificateTemplateUrl ||
                                sendCertificatesMutation.isPending
                              }
                              // A dica agora é dinâmica para informar o usuário.
                              title={
                                event.certificateTemplateUrl
                                  ? "Enviar Certificados por E-mail"
                                  : "Configure o modelo de certificado para habilitar o envio"
                              }
                            >
                              <Send className="h-4 w-4" />
                            </Button>

                            {/* BOTÃO DE EXCLUIR */}
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
        {isAdmin && (
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
          </>
        )}
        <TabsContent value="reports">
          <ReportsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
