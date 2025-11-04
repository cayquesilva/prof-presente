import { useEffect, useRef, useState } from "react";

const CertificatePreview = ({ templateImage, config, onConfigChange }) => {
  const canvasRef = useRef(null);
  const [elements, setElements] = useState({});
  const [draggingElement, setDraggingElement] = useState(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // Efeito para desenhar tudo no canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    if (!templateImage) {
      // Se não houver imagem, limpa o canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const template = new Image();
    template.crossOrigin = "anonymous";
    template.src = templateImage;

    template.onload = () => {
      canvas.width = template.width;
      canvas.height = template.height;

      ctx.drawImage(template, 0, 0);

      // Define a baseline para o topo, facilitando o cálculo de coordenadas
      ctx.textBaseline = "top";

      // Configurações e desenho do Nome
      const nameConfig = {
        x: config.nameX || 20,
        y: config.nameY || 20,
        fontSize: config.nameFontSize || 24,
        color: config.nameColor || "#000000",
        text: "Nome do Participante (Exemplo)",
      };
      ctx.fillStyle = nameConfig.color;
      ctx.font = `bold ${nameConfig.fontSize}px sans-serif`;
      const nameMetrics = ctx.measureText(nameConfig.text);
      ctx.fillText(nameConfig.text, nameConfig.x, nameConfig.y);

      // Configurações e desenho das Horas
      const hoursConfig = {
        x: config.hoursX || 20,
        y: config.hoursY || 60,
        fontSize: config.hoursFontSize || 20,
        color: config.hoursColor || "#333333",
        text: "XX,X h",
      };
      ctx.fillStyle = hoursConfig.color;
      ctx.font = `${hoursConfig.fontSize}px sans-serif`;
      const hoursMetrics = ctx.measureText(hoursConfig.text);
      ctx.fillText(hoursConfig.text, hoursConfig.x, hoursConfig.y);

      // Armazena as áreas clicáveis dos elementos
      setElements({
        name: {
          ...nameConfig,
          width: nameMetrics.width,
          height: nameConfig.fontSize,
        },
        hours: {
          ...hoursConfig,
          width: hoursMetrics.width,
          height: hoursConfig.fontSize,
        },
      });
    };

    template.onerror = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#cccccc";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#000000";
      ctx.font = "16px sans-serif";
      ctx.fillText("Erro ao carregar a imagem do modelo.", 10, 30);
    };
  }, [templateImage, config]); // A dependência agora é 'templateImage'

  // Funções para o Drag and Drop
  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    for (const key in elements) {
      const el = elements[key];
      if (
        mouseX >= el.x &&
        mouseX <= el.x + el.width &&
        mouseY >= el.y &&
        mouseY <= el.y + el.height
      ) {
        setDraggingElement(key);
        setOffset({ x: mouseX - el.x, y: mouseY - el.y });
        break;
      }
    }
  };

  const handleMouseMove = (e) => {
    if (!draggingElement) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    const newX = Math.round(mouseX - offset.x);
    const newY = Math.round(mouseY - offset.y);

    if (draggingElement === "name") {
      onConfigChange({ ...config, nameX: newX, nameY: newY });
    } else if (draggingElement === "hours") {
      onConfigChange({ ...config, hoursX: newX, hoursY: newY });
    }
  };

  const handleMouseUp = () => {
    setDraggingElement(null);
  };

  return (
    <div>
      <h4 className="font-medium mb-2">Pré-visualização</h4>
      <div className="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
        {templateImage ? (
          <canvas
            ref={canvasRef}
            style={{
              maxWidth: "100%",
              height: "auto",
              cursor: draggingElement ? "grabbing" : "grab",
              backgroundcolor: "#ccc",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        ) : (
          <div className="text-center text-gray-500 h-48 flex items-center">
            <p>Envie uma imagem de fundo para ver a pré-visualização.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificatePreview;
