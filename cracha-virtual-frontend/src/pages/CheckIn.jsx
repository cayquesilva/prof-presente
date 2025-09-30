import { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useMutation } from "@tanstack/react-query";
import api from "../lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  CheckCircle,
  XCircle,
  QrCode,
  Keyboard,
  Camera,
} from "lucide-react";
import { toast } from "sonner";

const CheckIn = () => {
  const [scanner, setScanner] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [manualBadgeId, setManualBadgeId] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  const checkInMutation = useMutation({
    mutationFn: async (badgeId) => {
      const response = await api.post("/checkins", { badgeId });
      return response.data;
    },
    onSuccess: (data) => {
      setScanResult({
        success: true,
        message: "Check-in realizado com sucesso!",
        data,
      });
      toast.success("Check-in realizado com sucesso!");
      setManualBadgeId("");
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
          const data = JSON.parse(decodedText);
          if (data.badgeId) {
            checkInMutation.mutate(data.badgeId);
            html5QrcodeScanner.clear();
            setIsScanning(false);
          }
        } catch (e) {
          toast.error("QR Code inválido");
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
    if (!manualBadgeId.trim()) {
      toast.error("Por favor, insira o ID do crachá");
      return;
    }
    checkInMutation.mutate(manualBadgeId.trim());
  };

  useEffect(() => {
    return () => {
      if (scanner) {
        scanner.clear();
      }
    };
  }, [scanner]);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Check-in</h1>
        <p className="text-gray-600">
          Realize o check-in dos participantes escaneando o QR Code ou inserindo
          o ID manualmente
        </p>
      </div>

      <Tabs defaultValue="scanner" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="scanner">
            <Camera className="h-4 w-4 mr-2" />
            Scanner QR Code
          </TabsTrigger>
          <TabsTrigger value="manual">
            <Keyboard className="h-4 w-4 mr-2" />
            Entrada Manual
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scanner" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scanner de QR Code</CardTitle>
              <CardDescription>
                Posicione o QR Code do crachá na frente da câmera
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                id="qr-reader"
                className={isScanning ? "block" : "hidden"}
              ></div>

              {!isScanning && (
                <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
                  <QrCode className="h-16 w-16 text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">
                    Clique no botão abaixo para iniciar o scanner
                  </p>
                  <Button onClick={initializeScanner}>
                    <Camera className="h-4 w-4 mr-2" />
                    Iniciar Scanner
                  </Button>
                </div>
              )}

              {isScanning && (
                <Button onClick={stopScanner} variant="destructive">
                  Parar Scanner
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Check-in Manual</CardTitle>
              <CardDescription>
                Insira o ID do crachá para realizar o check-in
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="badgeId">ID do Crachá</Label>
                <Input
                  id="badgeId"
                  placeholder="Digite o ID do crachá"
                  value={manualBadgeId}
                  onChange={(e) => setManualBadgeId(e.target.value)}
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
                  ? "Processando..."
                  : "Realizar Check-in"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {scanResult && (
        <Alert
          className={
            scanResult.success
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }
        >
          {scanResult.success ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription
            className={scanResult.success ? "text-green-800" : "text-red-800"}
          >
            <p className="font-semibold">{scanResult.message}</p>
            {scanResult.success && scanResult.data && (
              <div className="mt-2 space-y-1 text-sm">
                <p>Participante: {scanResult.data.badge?.user?.name}</p>
                <p>Evento: {scanResult.data.badge?.enrollment?.event?.title}</p>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default CheckIn;
