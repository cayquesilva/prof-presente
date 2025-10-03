import { useEffect, useRef } from 'react';

const BadgePreview = ({ templateImage, config, qrCodeImageSrc }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Carrega a imagem de fundo (template)
    const template = new Image();
    template.crossOrigin = "anonymous"; // Evita problemas de CORS com a imagem
    template.src = templateImage;

    template.onload = () => {
      // Ajusta o tamanho do canvas para o tamanho da imagem do template
      canvas.width = template.width;
      canvas.height = template.height;

      // 1. Desenha a imagem de fundo
      ctx.drawImage(template, 0, 0);

      // 2. Desenha o nome do participante (texto de exemplo)
      const nameFontSize = config.nameFontSize || 24;
      const nameColor = config.nameColor || '#000000';
      ctx.fillStyle = nameColor;
      ctx.font = `bold ${nameFontSize}px sans-serif`;
      ctx.fillText("Seu Nome Completo Aqui", config.nameX || 0, config.nameY || 0);

      // Carrega a imagem do QR Code de exemplo
      if (qrCodeImageSrc) {
        const qrCode = new Image();
        qrCode.src = qrCodeImageSrc;
        qrCode.onload = () => {
          // 3. Desenha o QR Code na posição e tamanho configurados
          const qrSize = config.qrSize || 100;
          ctx.drawImage(qrCode, config.qrX || 0, config.qrY || 0, qrSize, qrSize);
        };
      }
    };
    
    template.onerror = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#cccccc';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#000000';
        ctx.font = '16px sans-serif';
        ctx.fillText("Erro ao carregar a imagem do modelo.", 10, 30);
    }

  }, [templateImage, config, qrCodeImageSrc]); // Re-desenha sempre que as props mudarem

  return (
    <div>
        <h4 className="font-medium mb-2">Pré-visualização</h4>
        <div className="p-4 border rounded-lg bg-gray-50 flex justify-center items-center">
            {templateImage ? (
                <canvas ref={canvasRef} style={{ maxWidth: '100%', height: 'auto' }} />
            ) : (
                <div className="text-center text-gray-500">
                    <p>Envie uma imagem de fundo para ver a pré-visualização.</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default BadgePreview;