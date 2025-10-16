import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Scanner } from "@yudiel/react-qr-scanner";
import api from "../lib/api";
import {
  CircleCheck as CheckCircle,
  Circle as XCircle,
  QrCode,
  Keyboard,
  Camera,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useDebounce } from "../hooks/useDebounce";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

const CheckIn = () => {
  const [scanResult, setScanResult] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [scanError, setScanError] = useState(null);

  // Buscar eventos disponíveis
  const { data: eventsData } = useQuery({
    queryKey: ["events-for-checkin"],
    queryFn: async () => {
      const response = await api.get("/events", { params: { limit: 100 } });
      return response.data;
    },
  });

  // Buscar usuários por nome
  const { data: usersData } = useQuery({
    queryKey: ["users-search", debouncedSearch, selectedEvent],
    queryFn: async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) return { users: [] };
      const response = await api.get("/badges/search", {
        params: {
          query: debouncedSearch,
          eventId: selectedEvent,
        },
      });
      return response.data;
    },
    enabled: !!debouncedSearch && debouncedSearch.length >= 2,
  });

  const checkInMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post("/checkins", data);
      return response.data;
    },
    onSuccess: (data) => {
      setScanResult({
        success: true,
        message: "Check-in realizado com sucesso!",
        data,
      });
      toast.success("Check-in realizado com sucesso!");
      setManualInput("");
      setSearchQuery("");
    },
    onError: (error) => {
      setScanResult({
        success: false,
        message: error.response?.data?.error || "Erro ao realizar check-in",
      });
      toast.error(error.response?.data?.error || "Erro ao realizar check-in");
    },
  });

  const handleStartScanner = () => {
    if (!selectedEvent) {
      toast.error("Selecione um evento primeiro");
      return;
    }
    setScanError(null);
    setScanResult(null);
    setIsScanning(true);
  };

  const handleStopScanner = () => {
    setIsScanning(false);
  };

  const handleManualCheckIn = () => {
    if (!selectedEvent) {
      toast.error("Selecione um evento primeiro");
      return;
    }
    if (!manualInput.trim()) {
      toast.error("Por favor, insira o código do crachá");
      return;
    }

    checkInMutation.mutate({
      badgeCode: manualInput.trim().toUpperCase(),
      eventId: selectedEvent,
    });
  };

  const handleUserSelect = (user) => {
    if (!selectedEvent) {
      toast.error("Selecione um evento primeiro");
      return;
    }
    if (!user.badgeCode) {
      toast.error("Usuário não possui crachá");
      return;
    }

    checkInMutation.mutate({
      badgeCode: user.badgeCode,
      eventId: selectedEvent,
    });
  };

  // Limpa o resultado ao mudar de evento
  useEffect(() => {
    setScanResult(null);
  }, [selectedEvent]);

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Check-in de Participantes</h1>
        <p className="text-gray-600">
          Realize check-in usando QR code, código do crachá ou nome do
          participante
        </p>
      </div>

      {/* Seleção de Evento */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Selecionar Evento
          </CardTitle>
          <CardDescription>
            Escolha o evento para realizar o check-in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione um evento" />
            </SelectTrigger>
            <SelectContent>
              {eventsData?.events?.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.title} -{" "}
                  {new Date(event.startDate).toLocaleDateString("pt-BR")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedEvent && (
        <>
          {/* Resultado do Check-in */}
          {scanResult && (
            <Alert
              className={`mb-6 ${
                scanResult.success
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <div className="flex items-center gap-2">
                {scanResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <AlertDescription
                  className={
                    scanResult.success ? "text-green-800" : "text-red-800"
                  }
                >
                  {scanResult.message}
                  {scanResult.data?.checkin?.userBadge?.user && (
                    <div className="mt-2 font-semibold">
                      Usuário: {scanResult.data.checkin.userBadge.user.name}
                    </div>
                  )}
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Métodos de Check-in */}
          <Tabs defaultValue="qr" className="w-full">
            <div className="w-full overflow-x-auto pb-2 scrollbar-thin">
              <TabsList className="inline-flex w-auto space-x-2 sm:grid sm:w-full sm:grid-cols-3">
                <TabsTrigger value="qr">
                  <QrCode className="h-4 w-4 mr-2" />
                  QR Code
                </TabsTrigger>
                <TabsTrigger value="manual">
                  <Keyboard className="h-4 w-4 mr-2" />
                  Código Manual
                </TabsTrigger>
                <TabsTrigger value="search">
                  <Camera className="h-4 w-4 mr-2" />
                  Buscar Nome
                </TabsTrigger>
              </TabsList>
            </div>

            {/* --- Scanner --- */}
            <TabsContent value="qr">
              <Card>
                <CardHeader>
                  <CardTitle>Escanear QR Code</CardTitle>
                  <CardDescription>
                    Aponte a câmera para o QR code do crachá. A leitura é
                    automática.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!isScanning ? (
                    <Button onClick={handleStartScanner} className="w-full">
                      <Camera className="h-4 w-4 mr-2" />
                      Ativar Câmera
                    </Button>
                  ) : (
                    <Button
                      onClick={handleStopScanner}
                      variant="destructive"
                      className="w-full"
                    >
                      Desativar Câmera
                    </Button>
                  )}

                  {isScanning && (
                    <div className="mt-4">
                      <Scanner
                        onScan={(detectedCodes) => {
                          if (!detectedCodes || detectedCodes.length === 0)
                            return;
                          const first = detectedCodes[0];
                          const text = first.rawValue || "";
                          if (text) {
                            console.log("✅ QR Code detectado:", text);
                            toast.success("QR Code lido com sucesso!");
                            setIsScanning(false);
                            setScanError(null);

                            checkInMutation.mutate({
                              qrCodeValue: text,
                              eventId: selectedEvent,
                            });
                          }
                        }}
                        onError={(err) => {
                          if (
                            err &&
                            typeof err.message === "string" &&
                            !err.message.includes("NotFoundException")
                          ) {
                            console.error("Erro de leitura:", err);
                            setScanError(err.message);
                          }
                        }}
                        constraints={{
                          facingMode: "environment",
                        }}
                        allowMultiple={false}
                        styles={{
                          container: { width: "100%" },
                          video: { borderRadius: "0.5rem" },
                        }}
                      />
                      {scanError && (
                        <div className="...">
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Erro: {scanError}
                        </div>
                      )}
                      <div className="text-center text-sm text-gray-500 p-2 border rounded-lg mt-2">
                        <p>Aponte a câmera para o QR Code.</p>
                        <p>
                          Garanta boa iluminação e que o código esteja focado.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* --- Manual --- */}
            <TabsContent value="manual">
              <Card>
                <CardHeader>
                  <CardTitle>Entrada Manual do Código</CardTitle>
                  <CardDescription>
                    Digite o código do crachá (ex: JOAO-SILVA-1234)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="manual-badge">Código do Crachá</Label>
                    <Input
                      id="manual-badge"
                      placeholder="Ex: JOAO-SILVA-1234"
                      value={manualInput}
                      onChange={(e) =>
                        setManualInput(e.target.value.toUpperCase())
                      }
                      onKeyPress={(e) => {
                        if (e.key === "Enter") handleManualCheckIn();
                      }}
                      className="mt-2"
                    />
                  </div>
                  <Button
                    onClick={handleManualCheckIn}
                    disabled={checkInMutation.isPending}
                    className="w-full"
                  >
                    {checkInMutation.isPending
                      ? "Realizando check-in..."
                      : "Realizar Check-in"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* --- Buscar por nome --- */}
            <TabsContent value="search">
              <Card>
                <CardHeader>
                  <CardTitle>Buscar por Nome</CardTitle>
                  <CardDescription>
                    Digite o nome do participante para realizar o check-in
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="search-name">Nome do Participante</Label>
                    <Input
                      id="search-name"
                      placeholder="Digite o nome..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  {usersData?.users && usersData.users.length > 0 && (
                    <div className="border rounded-lg divide-y">
                      {usersData.users.map((user) => (
                        <div
                          key={user.id}
                          className="p-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                          onClick={() => handleUserSelect(user)}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium break-words">
                              {user.name}
                            </p>
                            <p className="text-sm text-gray-600 truncate">
                              {user.email}
                            </p>
                            {user.badgeCode && (
                              <p className="text-xs text-gray-500 font-mono mt-1">
                                {user.badgeCode}
                              </p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-shrink-0"
                          >
                            Check-in
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchQuery.length >= 2 &&
                    (!usersData?.users || usersData.users.length === 0) && (
                      <p className="text-center text-gray-500 py-4">
                        Nenhum participante encontrado
                      </p>
                    )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default CheckIn;
