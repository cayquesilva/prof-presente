import { useRef } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Download, Printer } from "lucide-react";
import { toast } from "sonner";

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
        scale: 2,
        backgroundColor: null,
        logging: false,
      });

      canvas.toBlob((blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = `cracha-${badge.id}.png`;
        link.href = url;
        link.click();
        window.URL.revokeObjectURL(url);
        toast.success("Crachá baixado com sucesso!");
      });
    } catch (error) {
      console.error("Erro ao baixar crachá:", error);
      toast.error("Erro ao baixar crachá");
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
            className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white p-8 rounded-2xl shadow-2xl mb-6"
            style={{ width: "400px", minHeight: "550px" }}
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
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white text-3xl font-bold">
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
              <p className="text-indigo-100 text-sm">
                {badge.enrollment?.user?.email}
              </p>
            </div>

            {/* Divisor */}
            <div className="border-t-2 border-white/30 my-6"></div>

            {/* Informações do Evento */}
            <div className="space-y-4">
              <div>
                <h5 className="text-lg font-semibold mb-2 text-indigo-100">
                  Evento
                </h5>
                <p className="text-xl font-bold">
                  {badge.enrollment?.event?.title}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-indigo-100 mb-1">Data</p>
                  <p className="font-semibold">
                    {formatDate(badge.enrollment?.event?.startDate)}
                  </p>
                </div>
                <div>
                  <p className="text-indigo-100 mb-1">Local</p>
                  <p className="font-semibold truncate">
                    {badge.enrollment?.event?.location}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-indigo-100 text-xs mb-1">ID do Crachá</p>
                <p className="font-mono text-sm bg-white/20 px-3 py-2 rounded">
                  {badge.id}
                </p>
              </div>
            </div>

            {/* QR Code */}
            <div className="mt-6">
              <div className="bg-white p-4 rounded-xl shadow-xl">
                <img
                  src={badge.qrCodeUrl}
                  alt="QR Code"
                  className="w-full h-auto"
                  style={{ maxWidth: "200px", margin: "0 auto", display: "block" }}
                />
                <p className="text-center text-xs text-gray-600 mt-3">
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
