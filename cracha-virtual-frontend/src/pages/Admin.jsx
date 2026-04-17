import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useSearchParams,
  useNavigate
} from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { Progress } from "../components/ui/progress";

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
  Users,
  Calendar,
  MapPin,
  Trash2,
  Edit,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Printer, // Adicionado
  Target,
  Send,
  Upload,
  ChartBar as BarChart, // Re-adicionado
  Award, // Re-adicionado
  Building, // Re-adicionado
  Briefcase, // Re-adicionado
  FileText, // Re-adicionado
  Sparkles, // Re-adicionado
  Pencil, // Re-adicionado
  Image as ImageIcon,
  Palette,
  Tags,
  GraduationCap,
  Loader2,
} from "lucide-react";
import CertificateEditor from "../components/CertificateEditor"; // Adjusted path to match existing imports
import { toast } from "sonner";
import UserManagement from "../components/UserManagement";
import AdminCategories from "../components/AdminCategories";
import BadgePreview from "../components/BadgePreview";
import AwardManagement from "../components/AwardManagement";
import WorkplaceManagement from "../components/WorkplaceManagement";
import ProfessionManagement from "../components/ProfessionManagement";
import ReportsDashboard from "../components/ReportsDashboard";
import CertificatePreview from "../components/CertificatePreview";
import EventStaffManager from "../components/EventStaffManager";
import BannerManagement from "../components/BannerManagement";
import BrandingManagement from "../components/BrandingManagement";
import LiveStreamConfig from "../components/LiveStreamConfig";
import DataIntegrityTab from "../components/DataIntegrityTab";
import { Badge } from "../components/ui/badge";
import { Combobox } from "../components/ui/combobox";
import { getAssetUrl } from "../lib/utils";

const Admin = () => {
  const { isAdmin, isOrg } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab") || "events";
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  
  // States para progresso de envio
  const [isSendConfirmOpen, setIsSendConfirmOpen] = useState(false);
  const [isSendingProgressOpen, setIsSendingProgressOpen] = useState(false);
  const [sendingEventId, setSendingEventId] = useState(null);
  const [sendingEventTitle, setSendingEventTitle] = useState(null);
  const [sendProgress, setSendProgress] = useState({ current: 0, total: 0, status: 'starting' });



  // ALTERAÇÃO: Renomeado para refletir que guarda o arquivo, não a URL











  // NOVO: Estado para a URL de preview do certificado
  const [certificateTemplatePreviewUrl, setCertificateTemplatePreviewUrl] =
    useState(null);
  const [certificateTemplateFile, setCertificateTemplateFile] = useState(null);

  const [certificateConfig, setCertificateConfig] = useState({
    nameX: "",
    nameY: "",
    nameFontSize: "",
    nameColor: "#000000",
    hoursX: "",
    hoursY: "",
    hoursFontSize: "",
    hoursColor: "#333333",
    dateX: "",
    dateY: "",
    dateFontSize: "",
    dateColor: "#333333",
    logoX: "",
    logoY: "",
    logoSize: "",
    phraseX: "",
    phraseY: "",
    phraseFontSize: "",
    phraseColor: "#000000",
    phraseMaxWidth: "",
    phraseText: "Certificamos que {nome} participou do evento {evento} na data {data} com carga horária de {horas} horas.",
  });

  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    location: "",
    startDate: "",
    endDate: "",
    maxAttendees: "",
    parentId: "",
    mapLink: "",
    schedule: "",
    speakerName: "",
    speakerRole: "",
    categoryId: "",
    isPrivate: false,
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

  const [eventThumbnailFile, setEventThumbnailFile] = useState(null);
  const [eventThumbnailPreviewUrl, setEventThumbnailPreviewUrl] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [speakerPhotoFile, setSpeakerPhotoFile] = useState(null);
  const [speakerPhotoPreviewUrl, setSpeakerPhotoPreviewUrl] = useState(null);

  // NOVO: Estado para gerenciar inscrições
  const [managingEnrollmentsEvent, setManagingEnrollmentsEvent] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(false);

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ["admin-events"],
    queryFn: async () => {
      const response = await api.get("/events?limit=100");
      return response.data.events;
    },
  });

  const { data: categoriesArray } = useQuery({
    queryKey: ["categories-list"],
    queryFn: async () => {
      const response = await api.get("/categories");
      return response.data;
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

  // NOVO: Query para buscar os logs de certificado do evento selecionado
  const { data: certificateLogs, isLoading: logsLoading } = useQuery({
    queryKey: ["certificate-logs", isSendingProgressOpen ? sendingEventId : editingEvent?.id],
    queryFn: async () => {
      const eventId = isSendingProgressOpen ? sendingEventId : editingEvent?.id;
      const response = await api.get(
        `/events/${eventId}/certificate-logs`
      );
      return response.data;
    },
    // A query será executada se estivermos enviando OU editando um evento
    enabled: !!(isSendingProgressOpen ? sendingEventId : editingEvent?.id),
    refetchInterval: isSendingProgressOpen ? 3000 : false,
  });

  useEffect(() => {
    if (isSendingProgressOpen && certificateLogs) {
      const sentCount = certificateLogs.filter(log => log.status === 'SUCCESS').length;
      const failedCount = certificateLogs.filter(log => log.status === 'FAILED').length;
      const totalCount = certificateLogs.length;
      
      setSendProgress(prev => ({
        ...prev,
        current: sentCount + failedCount,
        total: totalCount || prev.total,
        status: (sentCount + failedCount >= totalCount && totalCount > 0) ? 'completed' : 'sending'
      }));
    }
  }, [certificateLogs, isSendingProgressOpen]);

  // --- INÍCIO: NOVA QUERY PARA BUSCAR A CONTAGEM ---
  const { data: missingBadgesData, isLoading: isLoadingMissingBadges } =
    useQuery({
      queryKey: ["missing-badges-count"],
      // A query só será executada quando a aba de "usuários" estiver ativa e o usuário for ADMIN
      queryFn: () => api.get("/badges/missing-count").then((res) => res.data),
      enabled: activeTab === "users" && isAdmin,
      // Opcional: Recarrega a contagem a cada 30 segundos se a aba estiver ativa
      refetchInterval: 180000,
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
      setIsSendingProgressOpen(true);
      setSendProgress({ current: 0, total: 0, status: 'sending' });
    },
    onError: (error) => {
      setIsSendingProgressOpen(false);
      toast.error(
        error.response?.data?.error || "Falha ao iniciar envio de certificados."
      );
    },
  });

  // NOVA MUTATION PARA GERAR CRACHÁS
  const generateMissingBadgesMutation = useMutation({
    mutationFn: () => api.post("/badges/missing-count"),
    onSuccess: (data) => {
      toast.info(data.data.message);
      // Invalida a query da contagem para forçar a busca do novo valor (que será 0)
      queryClient.invalidateQueries({ queryKey: ["missing-badges-count"] });
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.error || "Falha ao iniciar o processo."
      );
    },
  });



  // --- ADICIONE ESTA NOVA MUTATION ---
  const uploadThumbnailMutation = useMutation({
    mutationFn: async ({ id, formData }) => {
      const response = await api.post(`/events/${id}/thumbnail`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    },
    onSuccess: (data) => {
      // Atualiza os dados no cache
      queryClient.invalidateQueries(["admin-events"]);
      queryClient.invalidateQueries(["events"]);

      // ATUALIZA O ESTADO LOCAL: Isso atualiza a preview sem fechar o modal
      setEditingEvent((prev) => ({ ...prev, imageUrl: data.event.imageUrl }));

      toast.success("Imagem de capa salva com sucesso!");
      // Limpa os arquivos para o próximo upload
      setEventThumbnailFile(null);
      setEventThumbnailPreviewUrl(null);
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.error || "Erro ao salvar imagem de capa."
      );
    },
  });

  const uploadSpeakerPhotoMutation = useMutation({
    mutationFn: async ({ id, formData }) => {
      const response = await api.post(`/events/${id}/speaker-photo`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["admin-events"]);
      // Atualiza o estado local para refletir a nova URL
      setEditingEvent((prev) => ({ ...prev, speakerPhotoUrl: data.event.speakerPhotoUrl }));
      toast.success("Foto do palestrante salva com sucesso!");
      setSpeakerPhotoFile(null);
      setSpeakerPhotoPreviewUrl(null);
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.error || "Erro ao salvar foto do palestrante."
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
      mapLink: "",
      schedule: "",
      speakerName: "",
      speakerRole: "",
      categoryId: "",
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
      dateX: "",
      dateY: "",
      dateFontSize: "",
      dateColor: "#333333",
      logoX: "",
      logoY: "",
      logoSize: "",
    });
    setEventThumbnailFile(null);
    setEventThumbnailPreviewUrl(null);
    setSpeakerPhotoFile(null);
    setSpeakerPhotoPreviewUrl(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...eventForm,
      startDate: new Date(eventForm.startDate).toISOString(),
      endDate: new Date(eventForm.endDate).toISOString(),
      maxAttendees: eventForm.maxAttendees
        ? parseInt(eventForm.maxAttendees)
        : null,
      categoryId: eventForm.categoryId || null,
      isPrivate: eventForm.isPrivate,
    };

    if (editingEvent) {
      updateEventMutation.mutate({ id: editingEvent.id, data });
    } else {
      createEventMutation.mutate(data);
    }
  };

  const handleEdit = (event) => {
    const toLocalISO = (dateStr) => {
      const date = new Date(dateStr);
      const offset = date.getTimezoneOffset() * 60000;
      return new Date(date.getTime() - offset).toISOString().slice(0, 16);
    };

    setEditingEvent(event);
    setEventForm({
      title: event.title,
      description: event.description,
      location: event.location,
      startDate: toLocalISO(event.startDate),
      endDate: toLocalISO(event.endDate),
      maxAttendees: event.maxAttendees || "",
      parentId: event.parentId || "",
      mapLink: event.mapLink || "",
      schedule: event.schedule || "",
      speakerName: event.speakerName || "",
      speakerRole: event.speakerRole || "",
      categoryId: event.categoryId || "",
      isPrivate: event.isPrivate ?? false,
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
      dateX: "",
      dateY: "",
      dateFontSize: "",
      dateColor: "#333333",
      logoX: "",
      logoY: "",
      logoSize: "",
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
        dateX: config.date?.x || "",
        dateY: config.date?.y || "",
        dateFontSize: config.date?.fontSize || "",
        dateColor: config.date?.color || "#333333",
        logoX: config.logo?.x || "",
        logoY: config.logo?.y || "",
        logoSize: config.logo?.size || "",
        phraseX: config.phrase?.x || "",
        phraseY: config.phrase?.y || "",
        phraseFontSize: config.phrase?.fontSize || "",
        phraseColor: config.phrase?.color || "#000000",
        phraseMaxWidth: config.phrase?.maxWidth || "",
        phraseText: config.phrase?.text || "",
      });
    }

    setEventThumbnailFile(null);
    setEventThumbnailPreviewUrl(null);
    setSpeakerPhotoFile(null);
    setSpeakerPhotoPreviewUrl(null);
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
        fontSize: parseInt(certificateConfig.nameFontSize) || 32,
        color: certificateConfig.nameColor,
      },
      hours: {
        x: parseInt(certificateConfig.hoursX) || 0,
        y: parseInt(certificateConfig.hoursY) || 0,
        fontSize: parseInt(certificateConfig.hoursFontSize) || 20,
        color: certificateConfig.hoursColor,
      },
      date: {
        x: parseInt(certificateConfig.dateX) || 0,
        y: parseInt(certificateConfig.dateY) || 0,
        fontSize: parseInt(certificateConfig.dateFontSize) || 18,
        color: certificateConfig.dateColor,
      },
      logo: {
        x: parseInt(certificateConfig.logoX) || 0,
        y: parseInt(certificateConfig.logoY) || 0,
        size: parseInt(certificateConfig.logoSize) || 100,
      },
      phrase: {
        x: parseInt(certificateConfig.phraseX) || 0,
        y: parseInt(certificateConfig.phraseY) || 0,
        fontSize: parseInt(certificateConfig.phraseFontSize) || 16,
        color: certificateConfig.phraseColor,
        maxWidth: parseInt(certificateConfig.phraseMaxWidth) || 600,
        text: certificateConfig.phraseText,
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
    setSendingEventId(eventId);
    setSendingEventTitle(eventTitle);
    setIsSendConfirmOpen(true);
  };

  const handleThumbnailFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEventThumbnailFile(file);
      if (eventThumbnailPreviewUrl) {
        URL.revokeObjectURL(eventThumbnailPreviewUrl);
      }
      setEventThumbnailPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleThumbnailSubmit = (e) => {
    e.preventDefault();
    if (!editingEvent || !eventThumbnailFile) {
      toast.info("Por favor, selecione um arquivo de imagem primeiro.");
      return;
    }

    const formData = new FormData();
    // 'eventThumbnail' deve bater com o nome do campo no middleware
    formData.append("eventThumbnail", eventThumbnailFile);
    uploadThumbnailMutation.mutate({ id: editingEvent.id, formData });
  };

  const handleSpeakerPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSpeakerPhotoFile(file);
      if (speakerPhotoPreviewUrl) {
        URL.revokeObjectURL(speakerPhotoPreviewUrl);
      }
      setSpeakerPhotoPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSpeakerPhotoSubmit = (e) => {
    e.preventDefault();
    if (!editingEvent || !speakerPhotoFile) {
      toast.info("Selecione uma foto para o palestrante primeiro.");
      return;
    }
    const formData = new FormData();
    formData.append("speakerPhoto", speakerPhotoFile);
    uploadSpeakerPhotoMutation.mutate({ id: editingEvent.id, formData });
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
      if (eventThumbnailPreviewUrl) {
        URL.revokeObjectURL(eventThumbnailPreviewUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Administração</h1>
        <p className="text-gray-600">
          Gerencie eventos, usuários e visualize estatísticas
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6 lg:mb-0">
        <div className="w-full overflow-x-auto pb-2 block scrollbar-hide">
          <TabsList className="inline-flex w-max min-w-full justify-start space-x-2 h-auto p-1">
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
                <TabsTrigger value="banners">
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Banners
                </TabsTrigger>
              </>
            )}
            {isAdmin && (
              <TabsTrigger value="users">
                <Users className="h-4 w-4 mr-2" />
                Usuários
              </TabsTrigger>
            )}
            {isAdmin && (
              <>
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
                <TabsTrigger value="branding">
                  <Palette className="h-4 w-4 mr-2" />
                  Personalização
                </TabsTrigger>
                <TabsTrigger value="categories">
                  <Tags className="h-4 w-4 mr-2" />
                  Categorias
                </TabsTrigger>
                <TabsTrigger value="data-integrity">
                  <Target className="h-4 w-4 mr-2" />
                  Integridade de Dados
                </TabsTrigger>
              </>
            )}
            <TabsTrigger value="reports">
              <FileText className="h-4 w-4 mr-2" />
              Relatórios
            </TabsTrigger>
          </TabsList>
        </div>

        {/* BOTTOM NAVIGATION REMOVED - NOW USING GLOBAL BOTTOM NAV */}

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

        <TabsContent value="categories">
          <AdminCategories />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="data-integrity">
            <DataIntegrityTab />
          </TabsContent>
        )}

        <TabsContent value="events" className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-2xl font-bold">Gerenciar Eventos</h2>
            <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2 grow max-w-2xl">
              <div className="relative grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar eventos por título ou local..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Dialog
                open={isCreateDialogOpen || !!editingEvent}
                onOpenChange={(open) => {
                  setIsCreateDialogOpen(open);
                  if (!open) {
                    setEditingEvent(null);
                    resetForm();
                    setEventThumbnailFile(null);
                    setEventThumbnailPreviewUrl(null);
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Evento
                  </Button>
                </DialogTrigger>
                <DialogContent className="p-0 gap-0 overflow-hidden sm:rounded-3xl border-none shadow-2xl max-w-5xl w-full h-[100dvh] sm:h-[90vh] flex flex-col">
                  <div className="flex-1 flex flex-col min-h-0 bg-white">
                    <DialogHeader className="p-6 sm:p-8 pb-4 bg-slate-50/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <DialogTitle className="text-2xl font-black tracking-tight text-slate-900">
                            {editingEvent ? "Editar Evento" : "Criar Novo Evento"}
                          </DialogTitle>
                          <DialogDescription className="font-medium">
                            Gerencie os detalhes, personalização e equipe do seu evento educativo.
                          </DialogDescription>
                        </div>
                      </div>
                    </DialogHeader>

                    <Tabs defaultValue="details" className="w-full flex-1 flex flex-col min-h-0 overflow-hidden">
                      <div className="px-6 sm:px-8 border-b bg-slate-50/30">
                        <div className="w-full overflow-x-auto pb-0 block scrollbar-hide">
                          <TabsList className="inline-flex w-max min-w-full justify-start gap-2 h-12 p-0 bg-transparent border-none">
                            <TabsTrigger value="details" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-t-xl px-6 font-bold text-sm">Detalhes</TabsTrigger>
                            <TabsTrigger value="badge" disabled={!editingEvent} className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-t-xl px-6 font-bold text-sm">Crachá</TabsTrigger>
                            <TabsTrigger value="certificate" disabled={!editingEvent} className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-t-xl px-6 font-bold text-sm">Certificado</TabsTrigger>
                            <TabsTrigger value="streaming" disabled={!editingEvent} className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-t-xl px-6 font-bold text-sm">Transmissão</TabsTrigger>
                            <TabsTrigger value="staff" disabled={!editingEvent} className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-t-xl px-6 font-bold text-sm">Equipe</TabsTrigger>
                          </TabsList>
                        </div>
                      </div>

                      <TabsContent value="details" className="flex-1 overflow-y-auto p-6 sm:p-8 mt-0 space-y-8 custom-scrollbar">
                        <form onSubmit={handleSubmit} className="space-y-8 pb-4">
                          {/* ... Campos do formulário Principal ... */}
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="title" className="font-bold ml-1 text-slate-700 text-sm">Título do Evento <span className="text-destructive">*</span></Label>
                                <Input
                                  id="title"
                                  value={eventForm.title}
                                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                                  placeholder="Digite o nome do evento..."
                                  className="h-11 rounded-xl border-slate-200"
                                  required
                                />
                              </div>

                              <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="description" className="font-bold ml-1 text-slate-700 text-sm">Descrição <span className="text-destructive">*</span></Label>
                                <Textarea
                                  id="description"
                                  value={eventForm.description}
                                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                                  rows={4}
                                  placeholder="Descreva os objetivos e público-alvo do evento..."
                                  className="rounded-xl border-slate-200 resize-none"
                                  required
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="location" className="font-bold ml-1 text-slate-700 text-sm">Local <span className="text-destructive">*</span></Label>
                                <Input
                                  id="location"
                                  value={eventForm.location}
                                  onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                                  placeholder="Ex: Auditório Principal, Sala 102..."
                                  className="h-11 rounded-xl border-slate-200"
                                  required
                                />
                              </div>

                              <div className="space-y-2">
                                <Label className="font-bold ml-1 text-slate-700 text-sm">Categoria (Opcional)</Label>
                                <Combobox
                                  options={[
                                    { value: "", label: "Sem categoria" },
                                    ...(categoriesArray?.map((c) => ({ value: c.id, label: c.name })) || []),
                                  ]}
                                  value={eventForm.categoryId}
                                  onSelect={(value) => setEventForm({ ...eventForm, categoryId: value })}
                                  placeholder="Selecione a categoria..."
                                  className="h-11 rounded-xl border-slate-200"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label className="font-bold ml-1 text-slate-700 text-sm">Evento Pai (Opcional)</Label>
                                <Combobox
                                  options={[
                                    { value: "", label: "Nenhum (Evento Principal)" },
                                    ...(events?.filter((e) => e.id !== editingEvent?.id).map((e) => ({ value: e.id, label: e.title })) || []),
                                  ]}
                                  value={eventForm.parentId}
                                  onSelect={(value) => setEventForm({ ...eventForm, parentId: value })}
                                  placeholder="Vincular a um evento maior..."
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="mapLink" className="font-bold ml-1 text-slate-700 text-sm">Link do Mapa (URL)</Label>
                                <Input
                                  id="mapLink"
                                  value={eventForm.mapLink}
                                  onChange={(e) => setEventForm({ ...eventForm, mapLink: e.target.value })}
                                  placeholder="https://maps.google.com/..."
                                  className="h-11 rounded-xl border-slate-200"
                                />
                              </div>
                            </div>

                            <Separator className="bg-slate-100" />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <Label htmlFor="speakerName" className="font-bold ml-1 text-slate-700 text-sm">Nome do Palestrante</Label>
                                <Input
                                  id="speakerName"
                                  value={eventForm.speakerName}
                                  onChange={(e) => setEventForm({ ...eventForm, speakerName: e.target.value })}
                                  placeholder="Ex: Dr. Pedro Silva"
                                  className="h-11 rounded-xl border-slate-200"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="speakerRole" className="font-bold ml-1 text-slate-700 text-sm">Cargo do Palestrante</Label>
                                <Input
                                  id="speakerRole"
                                  value={eventForm.speakerRole}
                                  onChange={(e) => setEventForm({ ...eventForm, speakerRole: e.target.value })}
                                  placeholder="Ex: Secretário Municipal"
                                  className="h-11 rounded-xl border-slate-200"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <Label htmlFor="startDate" className="font-bold ml-1 text-slate-700 text-sm">Data de Início <span className="text-destructive">*</span></Label>
                                <Input
                                  id="startDate"
                                  type="datetime-local"
                                  value={eventForm.startDate}
                                  onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })}
                                  className="h-11 rounded-xl border-slate-200"
                                  required
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="endDate" className="font-bold ml-1 text-slate-700 text-sm">Data de Término <span className="text-destructive">*</span></Label>
                                <Input
                                  id="endDate"
                                  type="datetime-local"
                                  value={eventForm.endDate}
                                  onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                                  className="h-11 rounded-xl border-slate-200"
                                  required
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="maxAttendees" className="font-bold ml-1 text-slate-700 text-sm">Vagas Máximas (Vazio = Ilimitado)</Label>
                                <Input
                                  id="maxAttendees"
                                  type="number"
                                  min="1"
                                  value={eventForm.maxAttendees}
                                  onChange={(e) => setEventForm({ ...eventForm, maxAttendees: e.target.value })}
                                  className="h-11 rounded-xl border-slate-200"
                                  placeholder="Ex: 100"
                                />
                              </div>

                              <div className="flex items-center space-x-3 pt-6">
                                <input
                                  type="checkbox"
                                  id="isPrivate"
                                  checked={eventForm.isPrivate}
                                  onChange={(e) => setEventForm({ ...eventForm, isPrivate: e.target.checked })}
                                  className="h-5 w-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                                <Label htmlFor="isPrivate" className="font-bold text-slate-700 cursor-pointer text-sm">
                                  Evento Privado (Ocultar da listagem)
                                </Label>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="schedule" className="font-bold ml-1 text-slate-700 text-sm">Programação (Resumo)</Label>
                              <Textarea
                                id="schedule"
                                value={eventForm.schedule}
                                onChange={(e) => setEventForm({ ...eventForm, schedule: e.target.value })}
                                placeholder="Descreva os horários e atividades..."
                                rows={3}
                                className="rounded-xl border-slate-200 resize-none"
                              />
                            </div>
                          </div>

                          <div className="sticky bottom-0 bg-white pt-4 pb-0 flex flex-col sm:flex-row justify-end gap-3 mt-8">
                            <Button
                              type="button"
                              variant="ghost"
                              className="h-11 rounded-xl font-bold px-8 order-2 sm:order-1"
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
                              disabled={createEventMutation.isPending || updateEventMutation.isPending}
                              className="h-11 px-10 bg-blue-600 hover:bg-blue-700 font-black text-white rounded-xl shadow-xl shadow-blue-100 active:scale-95 transition-all order-1 sm:order-2"
                            >
                              {createEventMutation.isPending || updateEventMutation.isPending
                                ? "Salvando..."
                                : editingEvent ? "Salvar Alterações" : "Criar Evento"}
                            </Button>
                          </div>
                        </form>


                        {/* FOTO DO PALESTRANTE E CAPA NO TAB DETALHES TAMBÉM */}
                        {editingEvent && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                            <div>
                              <h3 className="font-semibold mb-2">Foto do Palestrante</h3>
                              <form onSubmit={handleSpeakerPhotoSubmit} className="space-y-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden shrink-0">
                                    {speakerPhotoPreviewUrl ? (
                                      <img src={speakerPhotoPreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    ) : editingEvent?.speakerPhotoUrl ? (
                                      <img src={getAssetUrl(editingEvent.speakerPhotoUrl)} alt="Atual" className="w-full h-full object-cover" />
                                    ) : (
                                      <Users className="w-6 h-6 m-3 text-slate-400" />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <Input
                                      type="file"
                                      onChange={handleSpeakerPhotoChange}
                                      accept="image/*"
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                </div>
                                <Button type="submit" size="sm" variant="secondary" className="w-full" disabled={uploadSpeakerPhotoMutation.isPending}>
                                  {uploadSpeakerPhotoMutation.isPending ? "Enviando..." : "Salvar Foto"}
                                </Button>
                              </form>
                            </div>

                            <div>
                              <h3 className="font-semibold mb-2">Imagem de Capa</h3>
                              <form onSubmit={handleThumbnailSubmit} className="space-y-3">
                                <div className="space-y-2">
                                  <Input
                                    type="file"
                                    onChange={handleThumbnailFileChange}
                                    accept="image/*"
                                    className="h-8 text-xs"
                                  />
                                </div>
                                {/* Preview Simplificado */}
                                {(eventThumbnailPreviewUrl || editingEvent.imageUrl) && (
                                  <div className="h-24 w-full bg-slate-100 rounded overflow-hidden">
                                    <img src={eventThumbnailPreviewUrl || getAssetUrl(editingEvent.imageUrl)} className="w-full h-full object-cover" />
                                  </div>
                                )}

                                <Button type="submit" size="sm" variant="secondary" className="w-full" disabled={uploadThumbnailMutation.isPending}>
                                  {uploadThumbnailMutation.isPending ? "Enviando..." : "Salvar Capa"}
                                </Button>
                              </form>
                            </div>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="badge" className="flex-1 overflow-y-auto p-6 sm:p-8 mt-0 space-y-8 custom-scrollbar">
                        {editingEvent && (
                          <div className="space-y-8">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                              <div>
                                <h3 className="text-xl font-bold text-slate-900">Configuração do Crachá</h3>
                                <p className="text-sm text-slate-500">Personalize o layout dos crachás para impressão.</p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePrintBadges(editingEvent.id, editingEvent.title)}
                                className="rounded-xl font-bold border-slate-200 hover:bg-slate-50"
                              >
                                <Printer className="h-4 w-4 mr-2" />
                                Imprimir Crachás
                              </Button>
                            </div>

                            <div className="bg-slate-50/50 p-6 sm:p-8 border border-slate-100 rounded-3xl space-y-8 shadow-inner">
                              <form onSubmit={handleTemplateSubmit} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                  <div className="space-y-3">
                                    <Label className="font-bold ml-1 text-slate-700">Imagem de Fundo (Template)</Label>
                                    <div className="relative group">
                                      <Label
                                        htmlFor="badge-upload"
                                        className="flex flex-col items-center justify-center w-full h-32 rounded-2xl border-2 border-dashed border-slate-300 bg-white hover:bg-slate-50 hover:border-blue-400 cursor-pointer transition-all"
                                      >
                                        <Upload className="h-6 w-6 text-slate-400 mb-2 group-hover:scale-110 transition-all" />
                                        <span className="text-sm font-medium text-slate-600">
                                          {badgeTemplateFile ? badgeTemplateFile.name : "Selecionar nova imagem"}
                                        </span>
                                        <Input id="badge-upload" type="file" onChange={handleFileChange} accept="image/*" className="hidden" />
                                      </Label>
                                    </div>
                                    <p className="text-[10px] text-slate-400 italic">Recomendado: 400x600px ou similar.</p>
                                  </div>

                                  <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label className="font-bold text-xs text-slate-500 uppercase tracking-wider">Posição Nome (X, Y)</Label>
                                        <div className="flex gap-2">
                                          <Input type="number" placeholder="X" value={badgeConfig.nameX} onChange={e => setBadgeConfig({ ...badgeConfig, nameX: e.target.value })} className="h-10 rounded-xl border-slate-200" />
                                          <Input type="number" placeholder="Y" value={badgeConfig.nameY} onChange={e => setBadgeConfig({ ...badgeConfig, nameY: e.target.value })} className="h-10 rounded-xl border-slate-200" />
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <Label className="font-bold text-xs text-slate-500 uppercase tracking-wider">Fonte (px, Cor)</Label>
                                        <div className="flex gap-2">
                                          <Input type="number" placeholder="48" value={badgeConfig.nameFontSize} onChange={e => setBadgeConfig({ ...badgeConfig, nameFontSize: e.target.value })} className="h-10 rounded-xl border-slate-200" />
                                          <Input type="color" value={badgeConfig.nameColor} onChange={e => setBadgeConfig({ ...badgeConfig, nameColor: e.target.value })} className="h-10 w-12 p-1 rounded-lg border-slate-200 cursor-pointer" />
                                        </div>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label className="font-bold text-xs text-slate-500 uppercase tracking-wider">Posição QR (X, Y)</Label>
                                        <div className="flex gap-2">
                                          <Input type="number" placeholder="X" value={badgeConfig.qrX} onChange={e => setBadgeConfig({ ...badgeConfig, qrX: e.target.value })} className="h-10 rounded-xl border-slate-200" />
                                          <Input type="number" placeholder="Y" value={badgeConfig.qrY} onChange={e => setBadgeConfig({ ...badgeConfig, qrY: e.target.value })} className="h-10 rounded-xl border-slate-200" />
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <Label className="font-bold text-xs text-slate-500 uppercase tracking-wider">Tamanho QR (px)</Label>
                                        <Input type="number" placeholder="150" value={badgeConfig.qrSize} onChange={e => setBadgeConfig({ ...badgeConfig, qrSize: e.target.value })} className="h-10 rounded-xl border-slate-200" />
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <Label className="font-black text-slate-900 flex items-center gap-2">
                                    <ImageIcon className="h-5 w-5 text-blue-500" /> Pré-visualização
                                  </Label>
                                  <div className="bg-white border p-4 rounded-3xl shadow-sm flex justify-center">
                                    <BadgePreview
                                      templateImage={badgeTemplatePreviewUrl || getAssetUrl(editingEvent.badgeTemplateUrl)}
                                      config={badgeConfig}
                                      onConfigChange={setBadgeConfig}
                                    />
                                  </div>
                                </div>

                                <Button 
                                  type="submit" 
                                  disabled={uploadTemplateMutation.isPending} 
                                  className="w-full h-12 bg-slate-900 hover:bg-black text-white rounded-2xl font-black shadow-xl transition-all active:scale-95"
                                >
                                  {uploadTemplateMutation.isPending ? "Salvando Configurações..." : "Salvar Modelo do Crachá"}
                                </Button>
                              </form>
                            </div>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="certificate" className="flex-1 overflow-y-auto p-6 sm:p-8 mt-0 space-y-8 custom-scrollbar">
                        {editingEvent && (
                          <div className="space-y-8">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                              <div>
                                <h3 className="text-xl font-bold text-slate-900">Configuração do Certificado</h3>
                                <p className="text-sm text-slate-500">Defina o layout e envie os certificados para os participantes confirmados.</p>
                              </div>
                              <Button
                                variant="outline"
                                onClick={() => handleSendCertificates(editingEvent.id, editingEvent.title)}
                                className="rounded-xl font-bold border-slate-200 hover:bg-slate-50"
                              >
                                <Send className="h-4 w-4 mr-2" /> Enviar Certificados em Massa
                              </Button>
                            </div>

                            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                               <div className="p-6 bg-slate-50/50 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                  <div className="space-y-1 flex-1">
                                    <Label className="text-blue-600 font-black text-[10px] uppercase tracking-widest">Template de Fundo</Label>
                                    <div className="flex items-center gap-2">
                                      <Input type="file" id="cert-upload" onChange={handleCertificateFileChange} accept="image/*" className="hidden" />
                                      <Label htmlFor="cert-upload" className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors text-sm font-bold">
                                        <Upload className="h-4 w-4 text-slate-400" />
                                        {certificateTemplateFile ? certificateTemplateFile.name : "Selecionar Imagem (1920x1080)"}
                                      </Label>
                                    </div>
                                  </div>
                                  <div className="text-[10px] text-slate-400 max-w-[200px] sm:text-right leading-tight">
                                    <strong>Dica:</strong> Use imagens em alta resolução (A4 Paisagem) para melhores resultados.
                                  </div>
                               </div>
                               
                               <div className="bg-slate-900 overflow-hidden">
                                 <CertificateEditor 
                                   initialConfig={{
                                     name: { 
                                       x: parseInt(certificateConfig.nameX), 
                                       y: parseInt(certificateConfig.nameY), 
                                       fontSize: parseInt(certificateConfig.nameFontSize), 
                                       color: certificateConfig.nameColor 
                                     },
                                     hours: { 
                                       x: parseInt(certificateConfig.hoursX), 
                                       y: parseInt(certificateConfig.hoursY), 
                                       fontSize: parseInt(certificateConfig.hoursFontSize), 
                                       color: certificateConfig.hoursColor 
                                     },
                                     date: { 
                                       x: parseInt(certificateConfig.dateX), 
                                       y: parseInt(certificateConfig.dateY), 
                                       fontSize: parseInt(certificateConfig.dateFontSize), 
                                       color: certificateConfig.dateColor 
                                     },
                                     logo: { 
                                       x: parseInt(certificateConfig.logoX), 
                                       y: parseInt(certificateConfig.logoY), 
                                       size: parseInt(certificateConfig.logoSize) 
                                     },
                                     phrase: { 
                                       x: parseInt(certificateConfig.phraseX), 
                                       y: parseInt(certificateConfig.phraseY), 
                                       fontSize: parseInt(certificateConfig.phraseFontSize), 
                                       color: certificateConfig.phraseColor,
                                       maxWidth: parseInt(certificateConfig.phraseMaxWidth),
                                       text: certificateConfig.phraseText 
                                     },
                                   }}
                                   templateImage={certificateTemplatePreviewUrl || (editingEvent.certificateTemplateUrl ? getAssetUrl(editingEvent.certificateTemplateUrl) : null)}
                                   eventData={editingEvent}
                                   onSave={(newEditorConfig) => {
                                     const configToSubmit = {
                                        name: newEditorConfig.name,
                                        hours: newEditorConfig.hours,
                                        date: newEditorConfig.date,
                                        logo: newEditorConfig.logo,
                                     };
                                     
                                     if (newEditorConfig.phrase) {
                                       configToSubmit.phrase = {
                                         ...newEditorConfig.phrase,
                                         text: newEditorConfig.phrase.text
                                       };
                                     }
                                     
                                     const formData = new FormData();
                                     if (certificateTemplateFile) {
                                       formData.append("certificateTemplate", certificateTemplateFile);
                                     }
                                     formData.append("certificateTemplateConfig", JSON.stringify(configToSubmit));

                                     uploadCertificateMutation.mutate({ id: editingEvent.id, formData });
                                   }}
                                 />
                               </div>
                            </div>

                            <div className="space-y-4">
                              <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-slate-400" />
                                <h4 className="font-bold text-slate-900">Histórico de Envios</h4>
                              </div>
                              <div className="border border-slate-100 rounded-3xl overflow-hidden bg-white shadow-sm">
                                <div className="max-h-64 overflow-y-auto">
                                  <Table>
                                    <TableHeader className="bg-slate-50">
                                      <TableRow>
                                        <TableHead className="font-bold text-slate-700">Participante</TableHead>
                                        <TableHead className="font-bold text-slate-700">Status</TableHead>
                                        <TableHead className="font-bold text-slate-700">Data de Envio</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {logsLoading ? (
                                        <TableRow><TableCell colSpan={3} className="text-center py-8">Carregando histórico...</TableCell></TableRow>
                                      ) : certificateLogs?.length === 0 ? (
                                        <TableRow><TableCell colSpan={3} className="text-center py-8 text-slate-400">Nenhum certificado enviado ainda.</TableCell></TableRow>
                                      ) : certificateLogs?.map(log => (
                                        <TableRow key={log.userId} className="hover:bg-slate-50 transition-colors">
                                          <TableCell className="font-medium text-slate-900">{log.userName}</TableCell>
                                          <TableCell>
                                            <Badge className={log.status === 'SUCCESS' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"}>
                                              {log.status === 'SUCCESS' ? 'Enviado' : 'Falhou'}
                                            </Badge>
                                          </TableCell>
                                          <TableCell className="text-slate-500 text-sm">{log.createdAt ? new Date(log.createdAt).toLocaleDateString() : '-'}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="staff" className="space-y-4 py-4">
                        {editingEvent && (
                          <EventStaffManager eventId={editingEvent.id} />
                        )}
                      </TabsContent>

                      <TabsContent value="streaming" className="space-y-4 py-4">
                        {editingEvent && (
                          <LiveStreamConfig eventId={editingEvent.id} />
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Card className="border-none shadow-none md:border md:shadow-sm">
            <CardContent className="p-0">
              {/* MOBILE VIEW: Cards */}
              <div className="md:hidden space-y-4">
                {eventsLoading ? (
                  <div className="text-center p-4">Carregando...</div>
                ) : events?.length === 0 ? (
                  <div className="text-center p-4">Nenhum evento cadastrado</div>
                ) : (
                  events
                    ?.filter(event =>
                      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      event.location.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    ?.map((event) => (
                      <Card key={event.id} className="overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
                          <span className="font-semibold truncate max-w-[200px]">{event.title}</span>
                          {event.isPrivate ? (
                            <Badge variant="secondary" className="text-[10px]">Privado</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px]">Público</Badge>
                          )}
                        </div>
                        <CardContent className="p-4 space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-muted-foreground text-xs">Início</p>
                              <p>{formatDate(event.startDate)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Término</p>
                              <p>{formatDate(event.endDate)}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-muted-foreground text-xs">Local</p>
                              <p className="truncate">{event.location}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Inscritos</p>
                              <p className="font-mono font-bold text-blue-600">{event.enrolledCount || 0}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Capacidade</p>
                              <p>{event.maxAttendees || "Ilimitado"}</p>
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-2 mt-2 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleEdit(event)}
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handlePrintBadges(event.id, event.title)}
                              disabled={!event.badgeTemplateUrl}
                              title={event.badgeTemplateUrl ? "Imprimir Crachás" : "Configure o modelo"}
                            >
                              <Printer className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleSendCertificates(event.id, event.title)}
                              disabled={!event.certificateTemplateUrl || sendCertificatesMutation.isPending}
                              title={event.certificateTemplateUrl ? "Enviar Certificados" : "Configure o modelo"}
                            >
                              <Send className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDelete(event.id)}
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
                      <TableHead>Título</TableHead>
                      <TableHead>Local</TableHead>
                      <TableHead>Visibilidade</TableHead>
                      <TableHead>Início</TableHead>
                      <TableHead>Inscritos</TableHead>
                      <TableHead>Capacidade</TableHead>
                      <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eventsLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          Carregando...
                        </TableCell>
                      </TableRow>
                    ) : events?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          Nenhum evento cadastrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      events
                        ?.filter(event =>
                          event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          event.location.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((event) => (
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
                            <TableCell>
                              <Badge variant="outline" className="font-mono">
                                {event.enrolledCount || 0}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {event.maxAttendees || "Ilimitado"}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-between items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(event)}
                                  title="Editar Evento"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handlePrintBadges(event.id, event.title)
                                  }
                                  disabled={!event.badgeTemplateUrl}
                                  title={
                                    event.badgeTemplateUrl
                                      ? "Imprimir Crachás em Lote"
                                      : "Configure o modelo de crachá para habilitar a impressão"
                                  }
                                >
                                  <Printer className="h-4 w-4" />
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleSendCertificates(event.id, event.title)
                                  }
                                  disabled={
                                    !event.certificateTemplateUrl ||
                                    sendCertificatesMutation.isPending
                                  }
                                  title={
                                    event.certificateTemplateUrl
                                      ? "Enviar Certificados por E-mail"
                                      : "Configure o modelo de certificado para habilitar o envio"
                                  }
                                >
                                  <Send className="h-4 w-4" />
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(event.id)}
                                  title="Excluir Evento"
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/admin/events/${event.id}/enrollments`)}
                                  title="Gerenciar Inscrições"
                                >
                                  <Users className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>



        </TabsContent>
        {isAdmin && (
          <TabsContent value="users" className="space-y-4">
            {!isLoadingMissingBadges && missingBadgesData && isAdmin && (
              <>
                {missingBadgesData.count > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Ferramentas de Usuário</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-amber-500/50 rounded-lg bg-amber-500/5">
                        <div>
                          <h4 className="font-semibold text-amber-800">
                            Ação Necessária
                          </h4>
                          <p className="text-sm text-gray-600">
                            Encontramos{" "}
                            <strong>
                              {missingBadgesData.count} usuário(s)
                            </strong>{" "}
                            sem crachá universal. Clique para gerá-los agora.
                          </p>
                        </div>
                        <Button
                          className="mt-3 sm:mt-0"
                          onClick={() =>
                            generateMissingBadgesMutation.mutate()
                          }
                          disabled={generateMissingBadgesMutation.isPending}
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          {generateMissingBadgesMutation.isPending
                            ? "Iniciando..."
                            : "Gerar Crachás"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
            <UserManagement />
          </TabsContent>
        )}
        {isAdmin && (
          <>
            <TabsContent value="awards" className="space-y-4">
              <AwardManagement />
            </TabsContent>

            <TabsContent value="workplaces">
              <WorkplaceManagement />
            </TabsContent>

            <TabsContent value="professions">
              <ProfessionManagement />
            </TabsContent>

            <TabsContent value="banners">
              <BannerManagement />
            </TabsContent>

            <TabsContent value="branding">
              <BrandingManagement />
            </TabsContent>
          </>
        )}
        <TabsContent value="reports">
          <ReportsDashboard />
        </TabsContent>
      </Tabs>
      {/* Diálogos de Envio de Certificado */}
      <AlertDialog open={isSendConfirmOpen} onOpenChange={setIsSendConfirmOpen}>
        <AlertDialogContent className="border-none rounded-[2rem] shadow-2xl p-0 overflow-hidden max-w-md bg-white dark:bg-slate-900">
          <div className="p-8 bg-amber-50/50 dark:bg-amber-900/10 border-b border-amber-100/50 dark:border-amber-900/20 text-center">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
              <GraduationCap className="h-8 w-8" />
            </div>
            <AlertDialogTitle className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-tight">
              Confirmar Envio?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 font-medium mt-2">
              Você está prestes a enviar os certificados por e-mail para todos os participantes com check-in no evento: <br />
              <span className="font-black text-amber-600 dark:text-amber-500 underline decoration-2 underline-offset-4">{sendingEventTitle}</span>
            </AlertDialogDescription>
          </div>
          <AlertDialogFooter className="p-8 gap-3 sm:gap-0 flex-col sm:flex-row bg-white dark:bg-slate-900">
            <AlertDialogCancel className="h-12 rounded-xl font-bold border-slate-200 hover:bg-slate-50 transition-all active:scale-95">
              Agora não
            </AlertDialogCancel>
            <AlertDialogAction 
              className="h-12 rounded-xl font-black bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-100 dark:shadow-none transition-all active:scale-95 px-8"
              onClick={() => {
                sendCertificatesMutation.mutate(sendingEventId);
                setIsSendConfirmOpen(false);
              }}
            >
              Sim, Enviar Agora
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isSendingProgressOpen} onOpenChange={setIsSendingProgressOpen}>
        <DialogContent className="p-0 gap-0 overflow-hidden sm:rounded-3xl border-none shadow-2xl max-w-lg w-full bg-white dark:bg-slate-900 mx-auto">
          <DialogHeader className="p-8 pb-4 bg-slate-50/50 dark:bg-slate-800/50">
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 text-white p-3 rounded-2xl shadow-lg shadow-blue-100 dark:shadow-none animate-pulse">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase">Enviando Certificados</DialogTitle>
                <DialogDescription className="font-medium text-slate-500 line-clamp-1">
                  Evento: <span className="font-black text-blue-600 dark:text-blue-400">{sendingEventTitle}</span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="p-8 space-y-6 bg-white dark:bg-slate-900">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Status do Processo</span>
                  <span className={`text-sm font-bold ${sendProgress.status === 'completed' ? 'text-emerald-500' : 'text-blue-500 animate-pulse'}`}>
                    {sendProgress.status === 'completed' ? 'Processamento Concluído' : 'Enviando e-mails...'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">{sendProgress.current}</span>
                  <span className="text-slate-400 font-bold ml-1">/ {sendProgress.total}</span>
                </div>
              </div>
              
              <div className="relative h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                <div 
                  className={`absolute top-0 left-0 h-full transition-all duration-500 ${sendProgress.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-600'}`}
                  style={{ width: `${sendProgress.total > 0 ? (sendProgress.current / sendProgress.total) * 100 : 0}%` }}
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Logs de Atividade</span>
              <div className="max-h-48 overflow-y-auto rounded-3xl border border-slate-100 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-950/50 font-mono space-y-2 custom-scrollbar shadow-inner">
                {certificateLogs?.map((log, i) => (
                  <div key={i} className={`text-[10px] flex items-start gap-2 border-l-2 pl-2 ${
                    log.status === 'SUCCESS' ? 'text-emerald-600 border-emerald-500 bg-emerald-50/30' : 
                    log.status === 'FAILED' ? 'text-rose-600 border-rose-500 bg-rose-50/30' : 
                    'text-slate-500 border-slate-300'
                  } p-1.5 rounded-r-lg transition-all`}>
                    <span className="opacity-50 font-bold shrink-0">
                      {log.createdAt ? new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="font-black uppercase tracking-tight">{log.userName}</span>
                      <span className="mx-1 opacity-50">•</span>
                      <span className="font-medium italic">{log.status}</span>
                      {log.details && (
                        <span className="block text-[9px] opacity-70 mt-1 font-sans leading-tight bg-white/50 dark:bg-black/20 p-1 rounded border border-current/10">
                          {log.details}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {(!certificateLogs || certificateLogs.length === 0) && (
                  <div className="flex flex-col items-center justify-center py-8 text-slate-400 space-y-2 opacity-50">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-[10px] font-bold uppercase tracking-widest italic">Iniciando motor de envio...</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="p-8 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100/50 dark:border-slate-800/50">
            <Button 
              className={`w-full h-12 font-black rounded-xl transition-all active:scale-95 shadow-lg ${
                sendProgress.status === 'completed' 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100' 
                : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed'
              }`}
              disabled={sendProgress.status !== 'completed'}
              onClick={() => setIsSendingProgressOpen(false)}
            >
              {sendProgress.status === 'completed' ? 'Finalizar e Fechar' : 'Aguarde a conclusão...'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
