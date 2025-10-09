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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Label } from "./ui/label";
import { Combobox } from "./ui/combobox";

const teachingSegmentOptions = [
  { value: "ADMINISTRATIVO", label: "Administrativo" },
  { value: "INFANTIL", label: "Ed. Infantil" },
  { value: "FUNDAMENTAL1", label: "Fundamental I" },
  { value: "FUNDAMENTAL2", label: "Fundamental II" },
  { value: "EJA", label: "EJA" },
];

const contractTypeOptions = [
  { value: "EFETIVO", label: "Efetivo" },
  { value: "PRESTADOR", label: "Prestador" },
];

const ReportsDashboard = () => {
  // Estados para o Relatório por Evento
  const [selectedEventId, setSelectedEventId] = useState("");
  const [eventReportData, setEventReportData] = useState(null);

  // Estados para o Relatório por Escola
  const [selectedWorkplaceId, setSelectedWorkplaceId] = useState("");
  const [workplaceReportData, setWorkplaceReportData] = useState(null);
  const [dateRange, setDateRange] = useState(undefined);
  const [awardsReportData, setAwardsReportData] = useState(null);

  // NOVOS ESTADOS para o Relatório Filtrado
  const [filters, setFilters] = useState({
    segment: "",
    contractType: "",
    neighborhood: "",
    professionId: "",
  });
  const [filteredReportData, setFilteredReportData] = useState(null);

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

  // NOVA BUSCA: Busca a lista de profissões
  const { data: professions, isLoading: isLoadingProfessions } = useQuery({
    queryKey: ["allProfessionsForReport"],
    queryFn: async () => {
      const response = await api.get("/professions?limit=500");
      return response.data.professions;
    },
  });

  // NOVA BUSCA: Busca a lista de bairros para o filtro
  const { data: filterOptions, isLoading: isLoadingFilters } = useQuery({
    queryKey: ["reportFilterOptions"],
    queryFn: async () => {
      const response = await api.get("/reports/filters/options");
      return response.data;
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

  // NOVA MUTATION: para o relatório filtrado
  const {
    mutate: generateFilteredReport,
    isPending: isGeneratingFilteredReport,
  } = useMutation({
    mutationFn: (activeFilters) => {
      const params = new URLSearchParams(activeFilters);
      return api.get(`/reports/frequency/by-filter?${params.toString()}`);
    },
    onSuccess: (response) => {
      setFilteredReportData(response.data);
      toast.success("Relatório personalizado gerado com sucesso!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Falha ao gerar relatório.");
      setFilteredReportData(null);
    },
  });

  // NOVA MUTATION: para o relatório de premiações
  const { mutate: generateAwardsReport, isPending: isGeneratingAwardsReport } =
    useMutation({
      mutationFn: () => api.get("/reports/awards"),
      onSuccess: (response) => {
        setAwardsReportData(response.data);
        toast.success("Relatório de premiações gerado com sucesso!");
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || "Falha ao gerar relatório.");
        setAwardsReportData(null);
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

  // NOVA FUNÇÃO: Para gerar e baixar o PDF do relatório de escola
  const handleDownloadWorkplacePdf = () => {
    if (!workplaceReportData) {
      toast.error("Gere um relatório de escola primeiro para poder baixá-lo.");
      return;
    }

    const doc = new jsPDF();
    const { workplace, summary, userFrequency, period } = workplaceReportData;

    // Título
    doc.setFontSize(18);
    doc.text(`Relatório de Frequência: ${workplace.name}`, 14, 22);

    // Subtítulo e Sumário
    doc.setFontSize(11);
    doc.setTextColor(100);
    const startDateText =
      period.startDate && period.startDate !== "Início"
        ? format(new Date(period.startDate), "dd/MM/yyyy")
        : "Início";
    const endDateText =
      period.endDate && period.endDate !== "Fim"
        ? format(new Date(period.endDate), "dd/MM/yyyy")
        : "Fim";
    doc.text(`Período: ${startDateText} a ${endDateText}`, 14, 30);
    const summaryText = `Usuários: ${summary.totalUsers} | Total de Check-ins: ${summary.totalCheckins} | Participação da Unidade: ${summary.attendanceRate}%`;
    doc.text(summaryText, 14, 36);

    // Tabela
    const tableColumn = [
      "Usuário",
      "Total de Check-ins",
      "Eventos Participados",
    ];
    const tableRows = [];

    userFrequency.forEach((item) => {
      // Formata a lista de eventos para caber na célula do PDF, usando quebra de linha
      const eventsString = Object.values(item.events)
        .map((event) => `${event.title} (${event.checkinCount}x)`)
        .join("\n");

      const rowData = [item.name, item.totalCheckins.toString(), eventsString];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 42,
    });

    const fileName = `Relatorio_${workplace.name.replace(/\s+/g, "_")}.pdf`;
    doc.save(fileName);
  };

  // NOVA FUNÇÃO: para lidar com a mudança nos filtros
  const handleFilterChange = (key, value) => {
    const finalValue = value === "all" ? "" : value;
    setFilters((prev) => ({ ...prev, [key]: finalValue }));
  };

  // NOVA FUNÇÃO: para gerar o relatório filtrado
  const handleGenerateFilteredReport = () => {
    // Remove chaves de filtro vazias para não poluir a URL
    const activeFilters = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value)
    );
    // Agora, mesmo que activeFilters esteja vazio, a chamada será feita
    generateFilteredReport(activeFilters);
  };

  // NOVA FUNÇÃO: Para baixar o PDF do relatório filtrado
  const handleDownloadFilteredPdf = () => {
    if (!filteredReportData) {
      toast.error("Gere um relatório personalizado primeiro.");
      return;
    }

    const doc = new jsPDF();
    const { summary, userFrequency, filters } = filteredReportData;

    const filterText = Object.entries(filters)
      .map(([key, value]) => `${key}: ${value}`)
      .join(" | ");

    doc.setFontSize(18);
    doc.text("Relatório de Frequência Personalizado", 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Filtros Aplicados: ${filterText}`, 14, 30);

    const summaryText = `Usuários Encontrados: ${summary.totalUsersFound} | Com Check-in: ${summary.usersWithCheckin} | Sem Check-in: ${summary.usersWithoutCheckin} | Participação: ${summary.attendanceRate}%`;
    doc.text(summaryText, 14, 36);

    const tableColumn = [
      "Usuário",
      "Total de Check-ins",
      "Eventos Participados",
    ];
    const tableRows = userFrequency.map((item) => {
      const eventsString = Object.values(item.events)
        .map((event) => `${event.title} (${event.checkinCount}x)`)
        .join("\n");
      return [item.name, item.totalCheckins.toString(), eventsString];
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 42,
    });

    doc.save("Relatorio_Personalizado.pdf");
  };

  // NOVA FUNÇÃO: para baixar o PDF do relatório de premiações
  const handleDownloadAwardsPdf = () => {
    if (!awardsReportData) {
      toast.error("Gere o relatório de premiações primeiro.");
      return;
    }

    const doc = new jsPDF();
    const { summary, awardsReport } = awardsReportData;

    doc.setFontSize(18);
    doc.text("Relatório de Premiações", 14, 22);

    doc.setFontSize(11);
    doc.setTextColor(100);
    const summaryText = `Total de Prêmios Disponíveis: ${summary.totalAwardsAvailable} | Total de Concessões: ${summary.totalAwardsGiven} | Total de Usuários Premiados: ${summary.totalUniqueRecipients}`;
    doc.text(summaryText, 14, 30);

    let startY = 40;

    awardsReport.forEach((award) => {
      if (startY > 260) {
        // Adiciona nova página se o conteúdo estiver muito baixo
        doc.addPage();
        startY = 20;
      }
      doc.setFontSize(14);
      doc.text(
        `${award.name} (${award.recipients.length} premiados)`,
        14,
        startY
      );
      startY += 6;

      const tableColumn = ["Usuário", "Email", "Data da Premiação"];
      const tableRows = award.recipients.map((recipient) => [
        recipient.user.name,
        recipient.user.email,
        format(new Date(recipient.awardedAt), "dd/MM/yyyy HH:mm"),
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: startY,
      });

      startY = doc.lastAutoTable.finalY + 10; // Pega a posição final da tabela para o próximo item
    });

    doc.save("Relatorio_Premiacoes.pdf");
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
            <Combobox
              options={
                events?.map((event) => ({
                  value: event.id,
                  label: event.title,
                })) || []
              }
              value={selectedEventId}
              onSelect={setSelectedEventId}
              placeholder={
                isLoadingEvents
                  ? "Carregando eventos..."
                  : "Selecione um evento"
              }
              searchPlaceholder="Pesquisar evento..."
              className="md:w-[350px]"
            />
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
            <Combobox
              options={
                workplaces?.map((wp) => ({
                  value: wp.id,
                  label: `${wp.name} - ${wp.city}`,
                })) || []
              }
              value={selectedWorkplaceId}
              onSelect={setSelectedWorkplaceId}
              placeholder={
                isLoadingWorkplaces
                  ? "Carregando escolas..."
                  : "Selecione uma escola"
              }
              searchPlaceholder="Pesquisar escola..."
              className="md:w-[350px]"
            />
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
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>
                  Resultados para: {workplaceReportData.workplace?.name}
                </CardTitle>
                <div className="text-sm text-muted-foreground flex flex-wrap gap-4 pt-2">
                  <span>
                    Período:
                    <strong>
                      {workplaceReportData.period?.startDate &&
                      workplaceReportData.period.startDate !== "Início"
                        ? format(
                            new Date(workplaceReportData.period.startDate),
                            "dd/MM/yyyy"
                          )
                        : "Início"}
                    </strong>{" "}
                    a
                    <strong>
                      {" "}
                      {workplaceReportData.period?.endDate &&
                      workplaceReportData.period.endDate !== "Fim"
                        ? format(
                            new Date(workplaceReportData.period.endDate),
                            "dd/MM/yyyy"
                          )
                        : "Fim"}
                    </strong>
                  </span>
                  <span>
                    Total de Usuários na Escola:{" "}
                    <strong>{workplaceReportData.summary?.totalUsers}</strong>
                  </span>
                  <span>
                    Total de Check-ins:{" "}
                    <strong>
                      {workplaceReportData.summary?.totalCheckins}
                    </strong>
                  </span>
                  <span>
                    Participação da Unidade:{" "}
                    <Badge>
                      {workplaceReportData.summary?.attendanceRate}%
                    </Badge>
                  </span>
                </div>
              </div>
              <Button variant="outline" onClick={handleDownloadWorkplacePdf}>
                <Download className="mr-2 h-4 w-4" />
                Baixar PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {workplaceReportData.userFrequency?.length > 0 ? (
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
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum usuário com atividade encontrada para os filtros
                selecionados.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* CARD: Relatório Personalizado (Filtrado) - COM ALTERAÇÕES */}
      <Card>
        <CardHeader>
          <CardTitle>Relatório Geral Personalizado</CardTitle>
          <CardDescription>
            Combine diferentes filtros para gerar um relatório de frequência
            específico.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Filtro de Segmento */}
            <div className="space-y-2">
              <Label>Segmento de Ensino</Label>
              <Combobox
                options={[
                  { value: "all", label: "Todos" },
                  ...teachingSegmentOptions,
                ]}
                value={filters.segment || "all"}
                onSelect={(value) => handleFilterChange("segment", value)}
                placeholder="Selecione..."
                searchPlaceholder="Pesquisar segmento..."
              />
            </div>

            {/* Filtro de Vínculo */}
            <div className="space-y-2">
              <Label>Tipo de Vínculo</Label>
              <Combobox
                options={[
                  { value: "all", label: "Todos" },
                  ...contractTypeOptions,
                ]}
                value={filters.contractType || "all"}
                onSelect={(value) => handleFilterChange("contractType", value)}
                placeholder="Selecione..."
                searchPlaceholder="Pesquisar vínculo..."
              />
            </div>

            {/* Filtro de Profissão */}
            <div className="space-y-2">
              <Label>Profissão</Label>
              <Combobox
                options={[
                  { value: "all", label: "Todas" },
                  ...(professions?.map((p) => ({
                    value: p.id,
                    label: p.name,
                  })) || []),
                ]}
                value={filters.professionId || "all"}
                onSelect={(value) => handleFilterChange("professionId", value)}
                placeholder={
                  isLoadingProfessions ? "Carregando..." : "Selecione..."
                }
                searchPlaceholder="Pesquisar profissão..."
              />
            </div>

            {/* Filtros de Localização */}
            <div className="space-y-2">
              <Label>Bairro</Label>
              <Combobox
                options={[
                  { value: "all", label: "Todos" },
                  ...(filterOptions?.neighborhoods.map((n) => ({
                    value: n,
                    label: n,
                  })) || []),
                ]}
                value={filters.neighborhood || "all"}
                onSelect={(value) => handleFilterChange("neighborhood", value)}
                placeholder={
                  isLoadingFilters ? "Carregando..." : "Selecione..."
                }
                searchPlaceholder="Pesquisar bairro..."
              />
            </div>
          </div>
          <div className="pt-4">
            <Button
              onClick={handleGenerateFilteredReport}
              disabled={isGeneratingFilteredReport}
            >
              {isGeneratingFilteredReport && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Gerar Relatório Personalizado
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* NOVO CARD: Resultados do Relatório Filtrado */}
      {filteredReportData && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>
                  Resultados do Relatório Geral Personalizado
                </CardTitle>
                {/* SUMÁRIO ATUALIZADO */}
                <div className="text-sm text-muted-foreground flex flex-wrap gap-4 pt-2">
                  <span>
                    Usuários no Filtro:{" "}
                    <strong>
                      {filteredReportData.summary?.totalUsersFound}
                    </strong>
                  </span>
                  <span>
                    Com Check-in:{" "}
                    <strong>
                      {filteredReportData.summary?.usersWithCheckin}
                    </strong>
                  </span>
                  <span>
                    Sem Check-in:{" "}
                    <strong>
                      {filteredReportData.summary?.usersWithoutCheckin}
                    </strong>
                  </span>
                  <span>
                    Participação:{" "}
                    <Badge>{filteredReportData.summary?.attendanceRate}%</Badge>
                  </span>
                  <span>
                    Total de Check-ins:{" "}
                    <strong>{filteredReportData.summary?.totalCheckins}</strong>
                  </span>
                </div>
              </div>
              {/* NOVO BOTÃO DE DOWNLOAD */}
              <Button variant="outline" onClick={handleDownloadFilteredPdf}>
                <Download className="mr-2 h-4 w-4" />
                Baixar PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {filteredReportData.userFrequency?.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Total de Check-ins</TableHead>
                    <TableHead>Eventos Participados</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReportData.userFrequency.map((item) => (
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
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma atividade encontrada para os filtros selecionados.
              </p>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* NOVO CARD: Relatório de Premiações */}
      <Card>
        <CardHeader>
          <CardTitle>Relatório de Premiações</CardTitle>
          <CardDescription>
            Visualize todos os prêmios concedidos e seus respectivos ganhadores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => generateAwardsReport()}
            disabled={isGeneratingAwardsReport}
          >
            {isGeneratingAwardsReport && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Gerar Relatório de Premiações
          </Button>
        </CardContent>
      </Card>

      {/* NOVO CARD: Resultados do Relatório de Premiações */}
      {awardsReportData && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Resultados do Relatório de Premiações</CardTitle>
                <div className="text-sm text-muted-foreground flex flex-wrap gap-4 pt-2">
                  <span>
                    Prêmios Disponíveis:{" "}
                    <strong>
                      {awardsReportData.summary?.totalAwardsAvailable}
                    </strong>
                  </span>
                  <span>
                    Total de Concessões:{" "}
                    <strong>
                      {awardsReportData.summary?.totalAwardsGiven}
                    </strong>
                  </span>
                  <span>
                    Usuários Premiados (únicos):{" "}
                    <strong>
                      {awardsReportData.summary?.totalUniqueRecipients}
                    </strong>
                  </span>
                </div>
              </div>
              <Button variant="outline" onClick={handleDownloadAwardsPdf}>
                <Download className="mr-2 h-4 w-4" />
                Baixar PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {awardsReportData.awardsReport?.map((award) => (
                <AccordionItem value={award.id} key={award.id}>
                  <AccordionTrigger>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold">{award.name}</span>
                      <Badge>{award.recipients.length} Ganhador(es)</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Usuário</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Data da Premiação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {award.recipients.map((recipient) => (
                          <TableRow key={recipient.user.id}>
                            <TableCell>{recipient.user.name}</TableCell>
                            <TableCell>{recipient.user.email}</TableCell>
                            <TableCell>
                              {format(
                                new Date(recipient.awardedAt),
                                "dd/MM/yyyy HH:mm"
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReportsDashboard;
