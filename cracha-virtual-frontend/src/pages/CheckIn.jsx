import { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useMutation, useQuery } from "@tanstack/react-query";
import api from "../lib/api";

import {
  CircleCheck as CheckCircle,
  Circle as XCircle,
  MapPin,
  QrCode,
  Keyboard,
  Camera,
  Calendar,
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
  const [scanner, setScanner] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Buscar eventos disponíveis
  const { data: eventsData } = useQuery({
    queryKey: ["events-for-checkin"],
    queryFn: async () => {
      const response = await api.get("/events", {
        params: { limit: 100 },
      });
      return response.data;
    },
  });

  // Buscar usuários por nome (autocomplete)
  const { data: usersData } = useQuery({
    queryKey: ["users-search", debouncedSearch, selectedEvent],
    queryFn: async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) return { users: [] };
      const response = await api.get("/user-badges/search", {
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

  const initializeScanner = () => {
    if (!selectedEvent) {
      toast.error("Selecione um evento primeiro");
      return;
    }

    if (scanner) {
      scanner.clear();
    }

    const html5QrcodeScanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      false
    );

    html5QrcodeScanner.render(
      (decodedText) => {
        try {
          // Tentar parsear como JSON primeiro
          let qrData;
          try {
            qrData = JSON.parse(decodedText);
          } catch {
            // Se não for JSON, usar como está
            qrData = decodedText;
          }

          checkInMutation.mutate({
            qrCodeValue:
              typeof qrData === "string" ? qrData : JSON.stringify(qrData),
            eventId: selectedEvent,
          });
          html5QrcodeScanner.clear();
          setIsScanning(false);
        } catch (e) {
          console.error("Erro ao processar QR Code:", e);
          toast.error("Erro ao processar QR Code: " + e.message);
        }
      },
      (errorMessage) => {
        console.log("QR Code scanning error:", errorMessage);
      }
    );

    setScanner(html5QrcodeScanner);
    setIsScanning(true);
  };

  const stopScanner = () => {
    if (scanner) {
      scanner.clear();
      setIsScanning(false);
      setScanner(null);
    }
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

  useEffect(() => {
    return () => {
      if (scanner) {
        scanner.clear();
      }
    };
  }, [scanner]);

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
            <SelectTrigger>
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
            <TabsList className="grid w-full grid-cols-3">
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

            <TabsContent value="qr">
              <Card>
                <CardHeader>
                  <CardTitle>Escanear QR Code</CardTitle>
                  <CardDescription>
                    Use a câmera para escanear o QR code do crachá
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!isScanning ? (
                    <Button onClick={initializeScanner} className="w-full">
                      <Camera className="h-4 w-4 mr-2" />
                      Iniciar Scanner
                    </Button>
                  ) : (
                    <Button
                      onClick={stopScanner}
                      variant="destructive"
                      className="w-full"
                    >
                      Parar Scanner
                    </Button>
                  )}
                  <div id="qr-reader" className="w-full"></div>
                </CardContent>
              </Card>
            </TabsContent>

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
                        if (e.key === "Enter") {
                          handleManualCheckIn();
                        }
                      }}
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
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-gray-600">
                              {user.email}
                            </p>
                            {user.badgeCode && (
                              <p className="text-xs text-gray-500 font-mono mt-1">
                                {user.badgeCode}
                              </p>
                            )}
                          </div>
                          <Button size="sm" variant="outline">
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
