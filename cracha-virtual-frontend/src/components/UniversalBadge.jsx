import React, { useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Download } from "lucide-react";
import QRCode from "react-qr-code";
import domtoimage from "dom-to-image-more";
import { toast } from "sonner";
import Logo from "../assets/logo-prof-presente-white.svg";
import { getAssetUrl } from "../lib/utils";

const LogoPlaceholder = () => <img src={Logo} className="h-7" />;

const UniversalBadge = ({ user, badge, awards = [] }) => {
  const badgeRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = () => {
    const node = badgeRef.current;
    if (!node) return;

    setIsGenerating(true);
    toast.info("Gerando seu crachá...");

    // Gera um SVG do componente. Esta abordagem é mais robusta contra erros de CSS.
    domtoimage
      .toPng(node, {
        quality: 1.0, // Qualidade da imagem (para PNG não tem tanto efeito quanto JPG)
        width: node.offsetWidth * 2, // Opcional: Aumenta a resolução para melhor qualidade
        height: node.offsetHeight * 2, // Opcional: Aumenta a resolução para melhor qualidade
        style: {
          transform: "scale(2)", // Garante que o conteúdo seja renderizado no tamanho maior
          transformOrigin: "top left",
        },
      })
      .then((dataUrl) => {
        const link = document.createElement("a");
        // Altera a extensão do arquivo para .png
        link.download = `cracha_universal_${user.name.replace(/\s/g, "_")}.png`;
        link.href = dataUrl;
        link.click();
        toast.success("Download do crachá iniciado!");
      })
      .catch((error) => {
        // Altera a mensagem de erro
        console.error("Erro ao gerar PNG do crachá:", error);
        toast.error("Ocorreu um erro ao gerar o crachá. Tente novamente.");
      })
      .finally(() => {
        setIsGenerating(false);
      });
  };

  if (!user || !badge) {
    return <p>Carregando dados do crachá...</p>;
  }

  const latestAwards = Array.isArray(awards) ? awards.slice(0, 5) : [];

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        ref={badgeRef}
        className="relative w-[320px] h-[512px] rounded-2xl shadow-lg overflow-hidden text-white bg-gradient-to-br from-gray-800 via-gray-900 to-black p-6"
      >
        <div className="relative z-10 flex flex-col items-center justify-between h-full">
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
          <div className="flex flex-col items-center text-center mt-2">
            <Avatar className="w-24 h-24 border-2 border-white/80 mb-1 shadow-lg">
              <AvatarImage
                src={getAssetUrl(user.photoUrl)}
                alt={user.name}
                crossOrigin="anonymous"
              />
              <AvatarFallback className="text-3xl bg-gray-700">
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
            <p className="mt-2 font-mono text-sm font-bold tracking-wider text-gray-800">
              {badge.badgeCode}
            </p>
          </div>
        </div>
      </div>

      <Button
        id="download-badge-button"
        onClick={handleDownload}
        className="w-full max-w-sm"
        disabled={isGenerating}
      >
        <Download className="h-4 w-4 mr-2" />
        {isGenerating ? "Gerando..." : "Salvar Crachá como PNG"}
      </Button>
    </div>
  );
};

export default UniversalBadge;
