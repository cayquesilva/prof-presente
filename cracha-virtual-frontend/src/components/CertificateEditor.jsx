import React, { useState, useRef, useEffect } from "react";
import { 
  Undo, Redo, ZoomIn, ZoomOut, Save, Eye, Trash2, 
  Type, Image as ImageIcon, QrCode, MousePointer2, 
  Smartphone, Layers, AlignLeft, AlignCenter, AlignRight,
  Bold, Italic, Underline, School, Calendar, User, Clock,
  ChevronDown, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

const CertificateEditor = ({ initialConfig, templateImage, onSave, eventData }) => {
  const [elements, setElements] = useState([]);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [zoom, setZoom] = useState(0.75);
  const canvasRef = useRef(null);
  const [dragging, setDragging] = useState(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPreview, setIsPreview] = useState(false);
  const [activeTab, setActiveTab] = useState("elements");

  // Map backend config to internal list of elements
  useEffect(() => {
    if (initialConfig) {
      const mappedElements = [];
      const keys = ['name', 'hours', 'date', 'logo', 'phrase'];
      
      keys.forEach(key => {
        if (initialConfig[key]) {
          mappedElements.push({
            id: key,
            type: key === 'logo' ? 'image' : 'text',
            subType: key,
            x: initialConfig[key].x || 50,
            y: initialConfig[key].y || 50,
            fontSize: initialConfig[key].fontSize || (key === 'name' ? 32 : 18),
            color: initialConfig[key].color || "#000000",
            size: initialConfig[key].size || 80,
            maxWidth: initialConfig[key].maxWidth || 600,
            text: initialConfig[key].text || "",
            align: 'left', // Internal default
            fontFamily: 'sans-serif'
          });
        }
      });
      setElements(mappedElements);
    }
  }, [initialConfig]);

  const selectedElement = elements.find(el => el.id === selectedElementId);

  const updateElement = (id, updates) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
  };

  const handleMouseDown = (e, element) => {
    setSelectedElementId(element.id);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragging(element.id);
    setOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e) => {
    if (!dragging || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - canvasRect.left - offset.x) / zoom;
    const y = (e.clientY - canvasRect.top - offset.y) / zoom;

    updateElement(dragging, { x: Math.round(x), y: Math.round(y) });
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging]);

  const handleSave = () => {
    const finalConfig = {};
    elements.forEach(el => {
      if (el.subType) {
        finalConfig[el.subType] = {
          x: el.x,
          y: el.y,
          fontSize: el.fontSize,
          color: el.color,
          size: el.size,
          maxWidth: el.maxWidth,
          text: el.text
        };
      }
    });
    onSave(finalConfig);
    toast.success("Modelo de certificado salvo!");
  };

  const addVariable = (type) => {
    const config = {
      nome_aluno: { subType: 'name', text: '{nome}', fontSize: 32 },
      carga_horaria: { subType: 'hours', text: '{horas} h', fontSize: 20 },
      data_emissao: { subType: 'date', text: '{data}', fontSize: 18 },
      nome_curso: { subType: 'phrase', text: 'Curso: {evento}', fontSize: 24 },
    };

    const baseData = config[type];
    if (elements.some(el => el.subType === baseData.subType)) {
      toast.info("Este elemento já está no canvas.");
      return;
    }

    const newElement = {
      id: baseData.subType,
      type: 'text',
      subType: baseData.subType,
      x: 300,
      y: 200,
      fontSize: baseData.fontSize,
      color: "#000000",
      text: baseData.text,
      align: 'center',
      fontFamily: 'sans-serif'
    };

     setElements([...elements, newElement]);
  };

  const getElementLabel = (el) => {
    if (el.subType === 'name') return '{NOME}';
    if (el.subType === 'hours') return '{HORAS}';
    if (el.subType === 'date') return '{DATA}';
    if (el.subType === 'phrase') return el.text || '{TEXTO DO CERTIFICADO}';
    return el.text || '{TEXTO}';
  };

  return (
    <div className="flex flex-col flex-1 h-full bg-slate-100 overflow-hidden rounded-xl border border-slate-200">
      {/* Top Header */}
      <div className="bg-white px-6 py-2 border-b flex items-center justify-between shadow-sm z-20">
        <div className="flex items-center gap-3">
          <div className="size-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <School size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold leading-none">Editor de Certificados</h2>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Prof Presente</p>
          </div>
        </div>

         <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-lg mr-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`h-7 text-xs px-4 ${!isPreview ? 'bg-white shadow-sm hover:bg-white' : 'text-slate-500'}`}
              onClick={() => setIsPreview(false)}
            >
              Editor
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className={`h-7 text-xs px-4 ${isPreview ? 'bg-white shadow-sm hover:bg-white' : 'text-slate-500'}`}
              onClick={() => setIsPreview(true)}
            >
              Preview
            </Button>
          </div>
          <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700 h-8" onClick={handleSave}>
            <Save size={16} /> <span className="text-xs font-bold">Salvar Modelo</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
         <aside className={`w-64 bg-white border-r flex flex-col z-10 shadow-lg transition-transform ${isPreview ? '-translate-x-full absolute' : ''}`}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="px-4 border-b">
              <TabsList className="w-full bg-transparent gap-4">
                 <TabsTrigger value="elements" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent text-xs font-bold uppercase py-4">Elementos</TabsTrigger>
                <TabsTrigger value="templates" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent text-xs font-bold uppercase py-4">Config</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="elements" className="flex-1 overflow-y-auto p-4 space-y-6 m-0">
               <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Variáveis Dinâmicas</h3>
                <div className="space-y-2">
                  {[
                    { id: 'nome_aluno', icon: User, label: '{NOME}' },
                    { id: 'data_emissao', icon: Calendar, label: '{DATA}' },
                    { id: 'nome_curso', icon: School, label: '{CURSO}' },
                    { id: 'carga_horaria', icon: Clock, label: '{HORAS}' }
                  ].map(v => (
                    <div 
                      key={v.id}
                      onClick={() => addVariable(v.id)}
                      className="flex items-center gap-3 p-2 bg-slate-50 border rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all active:scale-95 group"
                    >
                      <v.icon size={16} className="text-blue-600" />
                      <span className="text-xs font-medium text-slate-700">{v.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Mídia</h3>
                <div className="grid grid-cols-2 gap-2">
                   <div 
                    onClick={() => addVariable('logo')}
                    className="flex flex-col items-center justify-center p-3 rounded-xl border border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer group"
                   >
                    <ImageIcon size={20} className="text-slate-400 group-hover:text-blue-600 mb-1" />
                    <span className="text-[10px] font-bold">Logotipo</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Texto do Certificado</h3>
                <div className="space-y-2">
                  <Label className="text-[10px] text-slate-500 font-bold">Conteúdo do Certificado</Label>
                  <Textarea 
                    placeholder="Ex: Certificamos que {nome} participou do {evento}..."
                    className="text-xs min-h-[100px]"
                    value={elements.find(el => el.subType === 'phrase')?.text || ""}
                    onChange={(e) => {
                      const phraseEl = elements.find(el => el.subType === 'phrase');
                      if (phraseEl) {
                        updateElement(phraseEl.id, { text: e.target.value });
                      } else {
                        addVariable('nome_curso');
                      }
                    }}
                  />
                  <p className="text-[9px] text-slate-400 italic font-medium">Use: {'{nome}'}, {'{evento}'}, {'{horas}'}, {'{data}'}</p>
                </div>
              </div>
            </TabsContent>

             <TabsContent value="templates" className="flex-1 overflow-y-auto p-4 space-y-6 m-0">

              <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Imagem de Fundo</h3>
                <p className="text-[10px] text-slate-500 mb-2 italic">A imagem deve ser carregada no painel principal.</p>
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <p className="text-[10px] text-blue-700 font-bold mb-1">Dica do Prof!</p>
                  <p className="text-[10px] text-blue-600/80 leading-relaxed">Você pode carregar o fundo clicando em 'Salvar Modelo' após anexar o arquivo no formulário principal.</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 bg-slate-100 relative overflow-auto flex items-center justify-center p-8 flex-col gap-4">
          {/* Internal Toolbar */}
          <div className="bg-white shadow-xl rounded-full px-4 py-2 border flex items-center gap-4 z-10 sticky top-0">
            <div className="flex border-r pr-4 gap-1">
              <Button variant="ghost" size="icon" className="size-8"><Undo size={16} /></Button>
              <Button variant="ghost" size="icon" className="size-8 text-slate-300"><Redo size={16} /></Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="size-6" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}><ZoomOut size={14} /></Button>
              <span className="text-xs font-bold w-12 text-center">{Math.round(zoom * 100)}%</span>
              <Button variant="ghost" size="icon" className="size-6" onClick={() => setZoom(z => Math.min(1.5, z + 0.1))}><ZoomIn size={14} /></Button>
            </div>
          </div>

          <div 
            ref={canvasRef}
            className="bg-white shadow-2xl relative shrink-0 transition-transform origin-center"
            style={{ 
              width: "842px", 
              height: "595px",
              transform: `scale(${zoom})`,
              boxShadow: "0 0 50px rgba(0,0,0,0.1)"
            }}
          >
            {/* Canvas Background / Template Image */}
            {templateImage ? (
              <img src={templateImage} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
            ) : (
              <div className="absolute inset-0 border-[20px] border-blue-600/5 pointer-events-none" />
            )}

            {elements.map(el => (
              <div
                key={el.id}
                onMouseDown={(e) => handleMouseDown(e, el)}
                style={{
                  position: "absolute",
                  left: `${el.x}px`,
                  top: `${el.y}px`,
                  cursor: "move",
                  userSelect: "none",
                  zIndex: selectedElementId === el.id ? 50 : 10,
                }}
                 className={`group ${selectedElementId === el.id && !isPreview ? 'ring-2 ring-blue-600' : ''} ${!isPreview ? 'hover:ring-1 hover:ring-blue-300' : ''}`}
              >
                {el.id === 'logo' ? (
                  <div className="bg-slate-100 border border-slate-300 flex items-center justify-center relative overflow-hidden" 
                       style={{ width: `${el.size}px`, height: `${el.size}px` }}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">LOGOTIPO</span>
                  </div>
                ) : (
                  <div 
                    style={{ 
                      fontSize: `${el.fontSize}px`, 
                      color: el.color,
                      maxWidth: el.subType === 'phrase' ? `${el.maxWidth}px` : 'none',
                      fontFamily: el.fontFamily
                    }}
                    className="font-bold relative p-2"
                  >
                     {el.subType === 'phrase' ? (el.text || '{texto}') : getElementLabel(el)}
                  </div>
                )}

                 {selectedElementId === el.id && !isPreview && (
                  <>
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[8px] px-2 py-0.5 rounded font-black uppercase whitespace-nowrap">Selecionado</div>
                    <div className="absolute -top-1 -left-1 size-2 bg-white border border-blue-600 rounded-full" />
                    <div className="absolute -top-1 -right-1 size-2 bg-white border border-blue-600 rounded-full" />
                    <div className="absolute -bottom-1 -left-1 size-2 bg-white border border-blue-600 rounded-full" />
                    <div className="absolute -bottom-1 -right-1 size-2 bg-white border border-blue-600 rounded-full" />
                  </>
                )}
              </div>
            ))}
          </div>
        </main>

        {/* Right Sidebar: Properties */}
         <aside className={`w-64 bg-white border-l z-10 shadow-lg flex flex-col transition-transform ${isPreview ? 'translate-x-full absolute right-0' : ''}`}>
          <div className="p-4 border-b">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Propriedades</h3>
            <p className="text-[10px] font-medium text-slate-500 mt-1">
              Elemento selecionado: <span className="text-blue-600 font-bold uppercase">{selectedElementId || 'Nenhum'}</span>
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {selectedElement ? (
              <>
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase">Fonte e Estilo</Label>
                  <Select 
                    value={selectedElement.fontFamily} 
                    onValueChange={(v) => updateElement(selectedElement.id, { fontFamily: v })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Fonte" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sans-serif">Sans Serif (Padrão)</SelectItem>
                      <SelectItem value="serif">Serif (Clássico)</SelectItem>
                      <SelectItem value="monospace">Monospace</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[9px] text-slate-500 uppercase">Tamanho</Label>
                      <div className="relative">
                        <Input 
                          type="number" 
                          className="h-8 text-xs pr-7" 
                          value={selectedElement.subType === 'logo' ? selectedElement.size : selectedElement.fontSize}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            if (selectedElement.subType === 'logo') updateElement(selectedElement.id, { size: val });
                            else updateElement(selectedElement.id, { fontSize: val });
                          }}
                        />
                        <span className="absolute right-2 top-2 text-[9px] text-slate-400">px</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                       <Label className="text-[9px] text-slate-500 uppercase">Cor</Label>
                       <div className="flex items-center gap-2 h-8 border rounded-lg px-2 bg-slate-50">
                          <input 
                            type="color" 
                            className="size-4 rounded cursor-pointer border-none bg-transparent"
                            value={selectedElement.color || '#000000'}
                            onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                          />
                          <span className="text-[9px] font-mono font-bold uppercase">{selectedElement.color || '#000000'}</span>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase">Alinhamento</Label>
                  <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
                    {[
                      { id: 'left', icon: AlignLeft },
                      { id: 'center', icon: AlignCenter },
                      { id: 'right', icon: AlignRight }
                    ].map(a => (
                      <Button 
                        key={a.id}
                        variant="ghost" 
                        size="sm" 
                        className={`flex-1 h-7 rounded-md ${selectedElement.align === a.id ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
                        onClick={() => updateElement(selectedElement.id, { align: a.id })}
                      >
                        <a.icon size={14} />
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase">Posição Precisão (X, Y)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-bold w-4">X</span>
                      <Input 
                        type="number" 
                        className="h-7 text-xs" 
                        value={selectedElement.x} 
                        onChange={(e) => updateElement(selectedElement.id, { x: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-bold w-4">Y</span>
                      <Input 
                        type="number" 
                        className="h-7 text-xs" 
                        value={selectedElement.y} 
                        onChange={(e) => updateElement(selectedElement.id, { y: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                </div>

                {selectedElement.subType === 'phrase' && (
                   <div className="space-y-2 pt-2">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase">Largura Máxima Texto</Label>
                    <div className="flex items-center gap-2">
                      <Slider 
                        min={100} 
                        max={800} 
                        step={10} 
                        value={[selectedElement.maxWidth]} 
                        onValueChange={([v]) => updateElement(selectedElement.id, { maxWidth: v })}
                      />
                      <span className="text-[10px] font-bold w-8">{selectedElement.maxWidth}</span>
                    </div>
                  </div>
                )}

                <div className="pt-8 border-t">
                  <Button 
                    variant="ghost" 
                    className="w-full h-9 gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 font-bold text-xs"
                    onClick={() => {
                       setElements(prev => prev.filter(el => el.id !== selectedElementId));
                       setSelectedElementId(null);
                    }}
                  >
                    <Trash2 size={14} /> Remover Elemento
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center bg-slate-50 rounded-xl border border-dashed p-4">
                <MousePointer2 size={24} className="text-slate-300 mb-2" />
                <p className="text-[10px] font-medium text-slate-400 italic">Selecione um elemento no canvas para editar suas propriedades.</p>
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-50 mt-auto border-t">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
              <div className="size-2 bg-green-500 rounded-full animate-pulse" /> Alterações monitoradas
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CertificateEditor;
