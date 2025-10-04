import React, { useRef, useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Printer } from "lucide-react";
import QRCode from "react-qr-code"; // CORREÇÃO: Importando da nova biblioteca 'react-qr-code'
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "sonner";

const API_BASE_URL = import.meta.env.VITE_API_URL.replace("/api", "");

// Componente para um ícone de logo genérico
const LogoPlaceholder = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M50 0L100 28.87V86.6L50 115.47L0 86.6V28.87L50 0Z"
      fill="rgba(255,255,255,0.1)"
    />
    <path
      d="M50 14.43L85.57 35.58V77.87L50 99.02L14.43 77.87V35.58L50 14.43Z"
      stroke="rgba(255,255,255,0.5)"
      strokeWidth="3"
    />
    <path
      d="M2.9 30.5L50 58.3L97.1 30.5"
      stroke="rgba(255,255,255,0.5)"
      strokeWidth="3"
    />
    <path d="M50 112.5V58.3" stroke="rgba(255,255,255,0.5)" strokeWidth="3" />
  </svg>
);

const UniversalBadge = ({ user, badge, awards = [] }) => {
  const badgeRef = useRef(null);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    // Este efeito será acionado APENAS quando 'isPrinting' se tornar 'true'
    if (isPrinting) {
      if (!badgeRef.current) {
        setIsPrinting(false);
        return;
      }

      html2canvas(badgeRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
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
        })
        .finally(() => {
          // Desativa o modo de impressão após a conclusão
          setIsPrinting(false);
        });
    }
  }, [isPrinting, user.name]); // Dependências do efeito

  // A função do botão agora apenas ativa o estado
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
      {/* Componente visual do crachá */}
      <div
        ref={badgeRef}
        className={`relative w-[320px] h-[512px] rounded-2xl shadow-lg overflow-hidden text-white
                   ${
                     isPrinting
                       ? "bg-gray-900" // Cor sólida simples que o html2canvas entende
                       : "bg-gradient-to-br from-gray-800 via-gray-900 to-black" // Gradiente visualmente atraente
                   }`}
      >
        <div className="relative z-10 flex flex-col items-center justify-between h-full p-6">
          {/* SEÇÃO SUPERIOR: Logo e Título */}
          <div className="flex items-center justify-between w-full">
            <LogoPlaceholder />
            {latestAwards.length > 0 && (
              <div className="flex justify-center gap-2">
                {latestAwards.map(({ award }) => (
                  <img
                    key={award.id}
                    src={`${API_BASE_URL}${award.imageUrl}`}
                    alt={award.name}
                    title={award.name}
                    className="h-8 w-8 p-1 rounded-full border-2 border-white/50"
                  />
                ))}
              </div>
            )}
          </div>

          {/* SEÇÃO CENTRAL: Foto e Nome */}
          <div className="flex flex-col items-center text-center mt-2">
            <Avatar
              className={`w-24 h-24 border-2 border-white/80 mb-1 ${
                isPrinting ? "shadow-none" : "shadow-lg" // Remove a sombra durante a impressão
              }`}
            >
              <AvatarImage
                src={user.photoUrl || ""}
                alt={user.name}
                crossOrigin="anonymous"
              />
              <AvatarFallback
                className={`text-3xl ${
                  isPrinting ? "bg-[#374151]" : "bg-gray-700"
                }`} // #374151 é o código hexadecimal para 'gray-700'
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
              }`} // #1f2937 é o código hexadecimal para 'gray-800'
            >
              {badge.badgeCode}
            </p>
          </div>
        </div>
      </div>

      {/* Botão de Impressão */}
      <Button onClick={handlePrint} className="w-full max-w-sm">
        <Printer className="h-4 w-4 mr-2" />
        Imprimir / Salvar PDF
      </Button>
    </div>
  );
};

export default UniversalBadge;
