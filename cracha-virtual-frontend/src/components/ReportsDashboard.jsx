import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "../lib/api";
import { toast } from "sonner";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
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
import { Badge } from "./ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { cn } from "../lib/utils";
import { format } from "date-fns";
import { Loader2, Calendar as CalendarIcon, Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
const ReportsDashboard = () => {
  // Estados para o Relatório por Evento
  const [selectedEventId, setSelectedEventId] = useState("");
  const [eventReportData, setEventReportData] = useState(null);

  // Estados para o Relatório por Escola
  const [selectedWorkplaceId, setSelectedWorkplaceId] = useState("");
  const [workplaceReportData, setWorkplaceReportData] = useState(null);
  const [dateRange, setDateRange] = useState(undefined);

  // --- BUSCA DE DADOS PARA OS FILTROS ---

  // CORREÇÃO 1: Restaurada a função para buscar eventos
  const { data: events, isLoading: isLoadingEvents } = useQuery({
    queryKey: ["allEventsForReport"],
    queryFn: async () => {
      const response = await api.get(
        "/events?limit=500&sortBy=startDate&order=desc"
      );
      return response.data.events;
    },
  });

  // Busca a lista de escolas (workplaces)
  const { data: workplaces, isLoading: isLoadingWorkplaces } = useQuery({
    queryKey: ["allWorkplacesForReport"],
    queryFn: async () => {
      const response = await api.get("/workplaces?limit=500");
      return response.data.workplaces;
    },
  });

  // --- MUTATIONS PARA GERAR RELATÓRIOS ---

  // Mutation para relatório de evento
  const { mutate: generateEventReport, isPending: isGeneratingEventReport } =
    useMutation({
      mutationFn: (eventId) => api.get(`/reports/frequency/${eventId}`),
      onSuccess: (response) => {
        setEventReportData(response.data);
        toast.success("Relatório por evento gerado com sucesso!");
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || "Falha ao gerar relatório.");
        setEventReportData(null);
      },
    });

  // Mutation para relatório de escola
  const {
    mutate: generateWorkplaceReport,
    isPending: isGeneratingWorkplaceReport,
  } = useMutation({
    mutationFn: ({ workplaceId, startDate, endDate }) => {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      return api.get(`/reports/workplace/${workplaceId}?${params.toString()}`);
    },
    onSuccess: (response) => {
      setWorkplaceReportData(response.data);
      toast.success("Relatório por escola gerado com sucesso!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Falha ao gerar relatório.");
      setWorkplaceReportData(null);
    },
  });

  const handleGenerateReport = () => {
    if (!selectedEventId) {
      toast.warning("Por favor, selecione um evento.");
      return;
    }
    // CORREÇÃO 2: Usando o nome correto da mutation
    generateEventReport(selectedEventId);
  };

  const handleGenerateWorkplaceReport = () => {
    if (!selectedWorkplaceId) {
      toast.warning("Por favor, selecione uma escola.");
      return;
    }
    const params = { workplaceId: selectedWorkplaceId };
    if (dateRange?.from) {
      params.startDate = format(dateRange.from, "yyyy-MM-dd");
    }
    if (dateRange?.to) {
      params.endDate = format(dateRange.to, "yyyy-MM-dd");
    }
    generateWorkplaceReport(params);
  };

  // NOVO: Função para gerar e baixar o PDF do relatório de evento
  const handleDownloadEventPdf = () => {
    if (!eventReportData) {
      toast.error("Gere um relatório primeiro para poder baixá-lo.");
      return;
    }

    const doc = new jsPDF();
    const { event, summary, frequencyData } = eventReportData;

    // Título do Documento
    doc.setFontSize(18);
    doc.text(`Relatório de Frequência: ${event.title}`, 14, 22);

    // Subtítulo e Informações do Sumário
    doc.setFontSize(11);
    doc.setTextColor(100);
    const startDate = format(new Date(event.startDate), "dd/MM/yyyy");
    doc.text(`Data do Evento: ${startDate}`, 14, 30);

    const summaryText = `Inscritos: ${summary.totalEnrollments} | Presentes: ${summary.usersWithCheckin} | Ausentes: ${summary.usersWithoutCheckin} | Participação: ${summary.attendanceRate}%`;
    doc.text(summaryText, 14, 36);

    // Definindo as colunas e as linhas para a tabela
    const tableColumn = ["Participante", "Email", "Check-ins", "Status"];
    const tableRows = [];

    frequencyData.forEach((item) => {
      const rowData = [
        item.user.name,
        item.user.email,
        item.checkinCount.toString(),
        item.hasCheckedIn ? "Presente" : "Ausente",
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 42,
    });

    // Salvando o arquivo
    const fileName = `Relatorio_${event.title.replace(/\s+/g, "_")}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Relatório de Frequência por Evento</CardTitle>
          <CardDescription>
            Selecione um evento para visualizar a lista de presença, ausência e
            a taxa de participação.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Select onValueChange={setSelectedEventId} value={selectedEventId}>
              <SelectTrigger disabled={isLoadingEvents}>
                <SelectValue
                  placeholder={
                    isLoadingEvents
                      ? "Carregando eventos..."
                      : "Selecione um evento"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {events?.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleGenerateReport}
              disabled={isGeneratingEventReport || !selectedEventId}
            >
              {isGeneratingEventReport && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Gerar Relatório
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* CORREÇÃO 3: Usando a variável correta 'eventReportData' */}
      {eventReportData && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>
                  Resultados para: {eventReportData.event.title}
                </CardTitle>
                <div className="text-sm text-muted-foreground flex flex-wrap gap-4 pt-2">
                  <span>
                    Total de Inscritos:{" "}
                    <strong>{eventReportData.summary.totalEnrollments}</strong>
                  </span>
                  <span>
                    Presentes:{" "}
                    <strong>{eventReportData.summary.usersWithCheckin}</strong>
                  </span>
                  <span>
                    Ausentes:{" "}
                    <strong>
                      {eventReportData.summary.usersWithoutCheckin}
                    </strong>
                  </span>
                  <span>
                    Taxa de Participação:{" "}
                    <Badge>{eventReportData.summary.attendanceRate}%</Badge>
                  </span>
                </div>
              </div>
              <Button variant="outline" onClick={handleDownloadEventPdf}>
                <Download className="mr-2 h-4 w-4" />
                Baixar PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Participante</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Check-ins</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventReportData.frequencyData.map((item) => (
                  <TableRow key={item.user.id}>
                    <TableCell className="font-medium">
                      {item.user.name}
                    </TableCell>
                    <TableCell>{item.user.email}</TableCell>
                    <TableCell>{item.checkinCount}</TableCell>
                    <TableCell>
                      {item.hasCheckedIn ? (
                        <Badge variant="default" className="bg-green-600">
                          Presente
                        </Badge>
                      ) : (
                        <Badge variant="destructive">Ausente</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* --- Card para Relatório por Escola (sem alterações) --- */}
      <Card>
        <CardHeader>
          <CardTitle>Relatório de Frequência por Escola</CardTitle>
          <CardDescription>
            Selecione uma escola e um período para visualizar a frequência dos
            seus usuários.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <Select
              onValueChange={setSelectedWorkplaceId}
              value={selectedWorkplaceId}
            >
              <SelectTrigger
                disabled={isLoadingWorkplaces}
                className="md:w-[350px]"
              >
                <SelectValue
                  placeholder={
                    isLoadingWorkplaces
                      ? "Carregando escolas..."
                      : "Selecione uma escola"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {workplaces?.map((wp) => (
                  <SelectItem key={wp.id} value={wp.id}>
                    {wp.name} - {wp.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full md:w-[300px] justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM/yy")} -{" "}
                        {format(dateRange.to, "dd/MM/yy")}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/yy")
                    )
                  ) : (
                    <span>Selecione um período</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button
              onClick={handleGenerateWorkplaceReport}
              disabled={isGeneratingWorkplaceReport || !selectedWorkplaceId}
            >
              {isGeneratingWorkplaceReport && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Gerar Relatório
            </Button>
          </div>
        </CardContent>
      </Card>

      {workplaceReportData && (
        <Card>
          <CardHeader>
            <CardTitle>
              Resultados para: {workplaceReportData.workplace.name}
            </CardTitle>
            <div className="text-sm text-muted-foreground flex flex-wrap gap-4 pt-2">
              <span>
                Período:{" "}
                <strong>
                  {format(
                    new Date(workplaceReportData.period.startDate),
                    "dd/MM/yyyy"
                  )}
                </strong>{" "}
                a{" "}
                <strong>
                  {format(
                    new Date(workplaceReportData.period.endDate),
                    "dd/MM/yyyy"
                  )}
                </strong>
              </span>
              <span>
                Total de Usuários na Escola:{" "}
                <strong>{workplaceReportData.summary.totalUsers}</strong>
              </span>
              <span>
                Total de Check-ins:{" "}
                <strong>{workplaceReportData.summary.totalCheckins}</strong>
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Total de Check-ins</TableHead>
                  <TableHead>Eventos Participados</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workplaceReportData.userFrequency.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.totalCheckins}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {Object.values(item.events).map((event, index) => (
                          <span key={index}>
                            {event.title}{" "}
                            <Badge variant="secondary">
                              {event.checkinCount}x
                            </Badge>
                          </span>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReportsDashboard;
