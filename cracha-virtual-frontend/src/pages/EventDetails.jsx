import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  ArrowLeft,
  CircleCheck as CheckCircle,
  Circle as XCircle,
  CircleAlert as AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [enrollmentStatus, setEnrollmentStatus] = useState(null);

  const {
    data: event,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["event", id],
    queryFn: async () => {
      const response = await api.get(`/events/${id}`);
      return response.data;
    },
  });

  const { data: enrollmentData } = useQuery({
    queryKey: ["enrollment-status", id],
    queryFn: async () => {
      const response = await api.get(`/enrollments/event/${id}/status`);
      return response.data;
    },
    enabled: !!event,
  });

  const enrollMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post("/enrollments", { eventId: id });
      return response.data;
    },
    onSuccess: () => {
      setEnrollmentStatus("enrolled");
      queryClient.invalidateQueries(["enrollment-status", id]);
      queryClient.invalidateQueries(["enrollments"]);
      toast.success("Inscrição realizada com sucesso!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Erro ao realizar inscrição");
    },
  });

  const cancelEnrollmentMutation = useMutation({
    mutationFn: async (enrollmentId) => {
      await api.delete(`/enrollments/${enrollmentId}`);
    },
    onSuccess: () => {
      setEnrollmentStatus(null);
      queryClient.invalidateQueries(["enrollment-status", id]);
      queryClient.invalidateQueries(["enrollments"]);
      toast.success("Inscrição cancelada com sucesso!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Erro ao cancelar inscrição");
    },
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getEventStatus = (startDate, endDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now < start) {
      return {
        label: "Próximo",
        color: "bg-blue-100 text-blue-800",
        icon: Clock,
      };
    } else if (now >= start && now <= end) {
      return {
        label: "Em andamento",
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
      };
    } else {
      return {
        label: "Finalizado",
        color: "bg-gray-100 text-gray-800",
        icon: XCircle,
      };
    }
  };

  const canEnroll = (event) => {
    if (!event) return false;
    const now = new Date();
    const end = new Date(event.endDate);
    return now < end;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar detalhes do evento: {error.message}
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate("/events")} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para eventos
        </Button>
      </div>
    );
  }

  const eventStatus = getEventStatus(event.startDate, event.endDate);
  const StatusIcon = eventStatus.icon;
  const isEnrolled =
    (enrollmentData?.enrolled && enrollmentData?.status !== "CANCELLED") ||
    enrollmentStatus === "enrolled" ||
    enrollmentStatus !== null;
  const canUserEnroll = canEnroll(event) && !isEnrolled;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Button
        variant="ghost"
        onClick={() => navigate("/events")}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar para eventos
      </Button>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start mb-4">
            <CardTitle className="text-3xl">{event.title}</CardTitle>
            <Badge className={eventStatus.color}>
              <StatusIcon className="h-4 w-4 mr-1" />
              {eventStatus.label}
            </Badge>
          </div>
          <CardDescription className="text-base">
            {event.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start">
                <Calendar className="h-5 w-5 mr-3 mt-1 text-gray-500" />
                <div>
                  <p className="font-semibold">Data de início</p>
                  <p className="text-gray-600">{formatDate(event.startDate)}</p>
                  <p className="text-sm text-gray-500">
                    às {formatTime(event.startDate)}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <Calendar className="h-5 w-5 mr-3 mt-1 text-gray-500" />
                <div>
                  <p className="font-semibold">Data de término</p>
                  <p className="text-gray-600">{formatDate(event.endDate)}</p>
                  <p className="text-sm text-gray-500">
                    às {formatTime(event.endDate)}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start">
                <MapPin className="h-5 w-5 mr-3 mt-1 text-gray-500" />
                <div>
                  <p className="font-semibold">Local</p>
                  <p className="text-gray-600">{event.location}</p>
                </div>
              </div>

              {event.maxAttendees && (
                <div className="flex items-start">
                  <Users className="h-5 w-5 mr-3 mt-1 text-gray-500" />
                  <div>
                    <p className="font-semibold">Capacidade</p>
                    <p className="text-gray-600">
                      Até {event.maxAttendees} participantes
                    </p>
                    {enrollmentData?.enrollmentCount !== undefined && (
                      <p className="text-sm text-gray-500">
                        {enrollmentData.enrollmentCount} inscritos
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {isEnrolled && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Você está inscrito neste evento!
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-4">
            {canUserEnroll && (
              <Button
                onClick={() => enrollMutation.mutate()}
                disabled={enrollMutation.isPending}
                className="flex-1"
              >
                {enrollMutation.isPending ? "Inscrevendo..." : "Inscrever-se"}
              </Button>
            )}

            {isEnrolled && canEnroll(event) && (
              <Button
                variant="destructive"
                onClick={() =>
                  cancelEnrollmentMutation.mutate(enrollmentData.enrollmentId)
                }
                disabled={cancelEnrollmentMutation.isPending}
                className="flex-1"
              >
                {cancelEnrollmentMutation.isPending
                  ? "Cancelando..."
                  : "Cancelar inscrição"}
              </Button>
            )}

            {/* NOVO: Botão de Impressão em Lote para Admins */}
            {user?.role === "ADMIN" && event?.badgeTemplateUrl && (
              <a
                href={`${
                  import.meta.env.VITE_API_URL
                }/events/${id}/print-badges`}
                target="_blank" // Abre em nova aba, o que é bom para downloads
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button variant="outline" className="w-full">
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir Crachás em Lote
                </Button>
              </a>
            )}

            {!canEnroll(event) && !isEnrolled && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  As inscrições para este evento foram encerradas.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventDetails;
