import React, { useRef, useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Printer } from "lucide-react";
import QRCode from "react-qr-code";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "sonner";
import Logo from "../assets/logo-prof-presente-white.svg";
import { getAssetUrl } from "../lib/utils";

const LogoPlaceholder = () => <img src={Logo} className="h-7" />;

const UniversalBadge = ({ user, badge, awards = [] }) => {
  const badgeRef = useRef(null);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    if (isPrinting) {
      if (!badgeRef.current) {
        setIsPrinting(false);
        return;
      }

      // Cor de fundo sólida que o html2canvas entende
      const originalBackgroundColor = document.body.style.backgroundColor;
      document.body.style.backgroundColor = "#FFF"; // Um branco simples

      html2canvas(badgeRef.current, {
        scale: 3,
        useCORS: true,
        // CORREÇÃO: Fornece uma cor de fundo explícita e compatível
        backgroundColor: null, // Deixamos nulo para que a cor do próprio elemento seja usada
      })
        .then((canvas) => {
          const imgData = canvas.toDataURL("image/png");
          const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: [54, 86],
          });
          pdf.addImage(imgData, "PNG", 0, 0, 54, 86);
          pdf.save(`cracha_universal_${user.name.replace(/\s/g, "_")}.pdf`);
          toast.success("Download do crachá iniciado!");
        })
        .catch((error) => {
          console.error("Erro ao gerar PDF:", error);
          toast.error("Ocorreu um erro ao gerar o PDF do crachá.");
        })
        .finally(() => {
          document.body.style.backgroundColor = originalBackgroundColor;

          setIsPrinting(false);
        });
    }
  }, [isPrinting, user.name]);

  const handlePrint = () => {
    if (!isPrinting) {
      toast.info("Preparando o crachá para impressão...");
      setIsPrinting(true);
    }
  };

  if (!user || !badge) {
    return <p>Carregando dados do crachá...</p>;
  }

  const latestAwards = Array.isArray(awards) ? awards.slice(0, 5) : [];

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        ref={badgeRef}
        className={`relative w-[320px] h-[512px] rounded-2xl shadow-lg overflow-hidden text-white
                   ${
                     isPrinting
                       ? // CORREÇÃO: Usando o valor hexadecimal direto que o html2canvas entende
                         "bg-[#111827]"
                       : "bg-gradient-to-br from-gray-800 via-gray-900 to-black"
                   }`}
      >
        {/* O restante do conteúdo do crachá permanece o mesmo */}
        <div className="relative z-10 flex flex-col items-center justify-between h-full p-6">
          {/* SEÇÃO SUPERIOR: Logo e Título */}
          <div className="flex items-center justify-between w-full">
            <LogoPlaceholder />
            {latestAwards.length > 0 && (
              <div className="flex justify-center gap-2">
                {latestAwards.map(({ award }) => (
                  <img
                    key={award.id}
                    src={getAssetUrl(award.imageUrl)}
                    alt={award.name}
                    title={award.name}
                    className="h-7 w-7 rounded-full border-1 border-white/50"
                  />
                ))}
              </div>
            )}
          </div>

          {/* SEÇÃO CENTRAL: Foto e Nome */}
          <div className="flex flex-col items-center text-center mt-2">
            <Avatar
              className={`w-24 h-24 border-2 border-white/80 mb-1 ${
                isPrinting ? "shadow-none" : "shadow-lg"
              }`}
            >
              <AvatarImage
                src={getAssetUrl(user.photoUrl)}
                alt={user.name}
                crossOrigin="anonymous"
              />
              <AvatarFallback
                className={`text-3xl ${
                  isPrinting ? "bg-[#374151]" : "bg-gray-700"
                }`}
              >
                {user.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-bold tracking-tight leading-tight mb-1">
              {user.name}
            </h2>
          </div>

          {/* SEÇÃO INFERIOR: QR Code */}
          <div className="flex flex-col items-center text-center bg-white/95 p-4 rounded-xl backdrop-blur-sm w-[100%]">
            <QRCode
              size={256}
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              value={JSON.stringify({
                userId: user.id,
                badgeCode: badge.badgeCode,
                badgeType: "user",
              })}
              viewBox={`0 0 256 256`}
            />
            <p
              className={`mt-2 font-mono text-sm font-bold tracking-wider ${
                isPrinting ? "text-[#1f2937]" : "text-gray-800"
              }`}
            >
              {badge.badgeCode}
            </p>
          </div>
        </div>
      </div>

      <Button
        onClick={handlePrint}
        className="w-full max-w-sm"
        disabled={isPrinting}
      >
        <Printer className="h-4 w-4 mr-2" />
        {isPrinting ? "Gerando PDF..." : "Imprimir / Salvar PDF"}
      </Button>
    </div>
  );
};

export default UniversalBadge;
