import { useRef } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Download, Printer } from "lucide-react";
import { toast } from "sonner";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const BadgeGenerator = ({ badge, onClose }) => {
  const badgeRef = useRef(null);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleDownload = async () => {
    try {
      if (!badgeRef.current) return;

      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(badgeRef.current, {
        scale: 3,
        backgroundColor: "#ffffff",
        logging: false,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: false,
      });

      canvas.toBlob((blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = `cracha-${badge.enrollment?.user?.name || badge.id}.png`;
        link.href = url;
        link.click();
        window.URL.revokeObjectURL(url);
        toast.success("Crachá baixado com sucesso!");
      });
    } catch (error) {
      console.error("Erro ao baixar crachá:", error);
      toast.error(`Erro ao baixar crachá: ${error.message}`);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    const badgeHTML = badgeRef.current.outerHTML;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Imprimir Crachá</title>
          <style>
            @media print {
              body {
                margin: 0;
                padding: 20px;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
              }
              @page {
                size: A4;
                margin: 0;
              }
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
          </style>
        </head>
        <body>
          ${badgeHTML}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Crachá Virtual</h3>
            <Button variant="ghost" onClick={onClose} size="sm">
              ✕
            </Button>
          </div>

          {/* Crachá para visualização/impressão */}
          <div
            ref={badgeRef}
            className="text-white p-8 rounded-2xl shadow-2xl mb-6"
            style={{
              width: "400px",
              minHeight: "550px",
              background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #EC4899 100%)"
            }}
          >
            {/* Header do Crachá */}
            <div className="text-center mb-6">
              <div className="w-28 h-28 bg-white rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
                {badge.enrollment?.user?.photoUrl ? (
                  <img
                    src={badge.enrollment.user.photoUrl}
                    alt={badge.enrollment.user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full rounded-full flex items-center justify-center text-white text-3xl font-bold"
                    style={{ background: "linear-gradient(135deg, #818CF8 0%, #A78BFA 100%)" }}
                  >
                    {badge.enrollment?.user?.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </div>
                )}
              </div>
              <h4 className="text-2xl font-bold mb-1">
                {badge.enrollment?.user?.name}
              </h4>
              <p className="text-sm" style={{ color: "#C7D2FE" }}>
                {badge.enrollment?.user?.email}
              </p>
            </div>

            {/* Divisor */}
            <div className="my-6" style={{ borderTop: "2px solid rgba(255, 255, 255, 0.3)" }}></div>

            {/* Informações do Evento */}
            <div className="space-y-4">
              <div>
                <h5 className="text-lg font-semibold mb-2" style={{ color: "#C7D2FE" }}>
                  Evento
                </h5>
                <p className="text-xl font-bold">
                  {badge.enrollment?.event?.title}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="mb-1" style={{ color: "#C7D2FE" }}>Data</p>
                  <p className="font-semibold">
                    {formatDate(badge.enrollment?.event?.startDate)}
                  </p>
                </div>
                <div>
                  <p className="mb-1" style={{ color: "#C7D2FE" }}>Local</p>
                  <p className="font-semibold truncate">
                    {badge.enrollment?.event?.location}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs mb-1" style={{ color: "#C7D2FE" }}>ID do Crachá</p>
                <p
                  className="font-mono text-sm px-3 py-2 rounded"
                  style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}
                >
                  {badge.id}
                </p>
              </div>
            </div>

            {/* QR Code */}
            <div className="mt-6">
              <div className="p-4 rounded-xl" style={{ backgroundColor: "#ffffff" }}>
                {badge.qrCodeUrl ? (
                  <img
                    src={`${API_BASE_URL.replace('/api', '')}${badge.qrCodeUrl}`}
                    alt="QR Code"
                    className="w-full h-auto"
                    style={{ maxWidth: "200px", margin: "0 auto", display: "block" }}
                    crossOrigin="anonymous"
                    onError={(e) => {
                      console.error('Erro ao carregar QR Code:', badge.qrCodeUrl);
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = '<p style="text-align: center; color: #6B7280;">QR Code não disponível</p>';
                    }}
                  />
                ) : (
                  <div
                    className="flex items-center justify-center"
                    style={{ minHeight: "200px", color: "#6B7280" }}
                  >
                    <p>QR Code não disponível</p>
                  </div>
                )}
                <p className="text-center text-xs mt-3" style={{ color: "#4B5563" }}>
                  Apresente este QR Code na entrada
                </p>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3">
            <Button onClick={handleDownload} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Baixar PNG
            </Button>
            <Button onClick={handlePrint} variant="outline" className="flex-1">
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BadgeGenerator;
