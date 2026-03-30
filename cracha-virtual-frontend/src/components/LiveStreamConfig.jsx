import React, { useState, useEffect } from "react";
import api from "../lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { Video, Loader2, Save, Youtube, Sparkles } from "lucide-react";

const LiveStreamConfig = ({ eventId }) => {
    const queryClient = useQueryClient();
    const [streamId, setStreamId] = useState("");
    const [status, setStatus] = useState("SCHEDULED");

    const { data: liveStream, isLoading } = useQuery({
        queryKey: ["liveStream", eventId],
        queryFn: async () => {
            try {
                const res = await api.get(`/live-streams/events/${eventId}`);
                return res.data;
            } catch (err) {
                if (err.response?.status === 404) return null;
                throw err;
            }
        },
    });

    useEffect(() => {
        if (liveStream) {
            setStreamId(liveStream.streamId || "");
            setStatus(liveStream.status || "SCHEDULED");
        }
    }, [liveStream]);

    const saveMutation = useMutation({
        mutationFn: async (data) => {
            const res = await api.post(`/live-streams/events/${eventId}`, data);
            return res.data;
        },
        onSuccess: () => {
            toast.success("Configuração de transmissão salva!");
            queryClient.invalidateQueries(["liveStream", eventId]);
        },
        onError: (err) => {
            toast.error(err.response?.data?.error || "Erro ao salvar transmissão");
        },
    });

    const connectYoutubeMutation = useMutation({
        mutationFn: async () => {
            const res = await api.get('/live-streams/youtube/auth');
            return res.data;
        },
        onSuccess: (data) => {
            window.location.href = data.url;
        },
        onError: () => {
            toast.error("Erro ao conectar com o Google");
        }
    });

    const handleSave = (e) => {
        e.preventDefault();
        saveMutation.mutate({ provider: "YOUTUBE", streamId, status });
    };

    const handleAutoGenerate = () => {
        if (window.confirm("Isso criará automaticamente uma live privada (Não Listada) no canal do YouTube conectado. Tem certeza?")) {
            saveMutation.mutate({ provider: "YOUTUBE", streamId: "auto", status: "SCHEDULED" });
        }
    };

    if (isLoading) {
        return <div className="p-4 flex justify-center"><Loader2 className="animate-spin w-5 h-5 text-accent" /></div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Video className="w-5 h-5 text-accent" />
                    <h3 className="text-lg font-semibold">Transmissão Online</h3>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => connectYoutubeMutation.mutate()}
                    disabled={connectYoutubeMutation.isPending}
                >
                    <Youtube className="w-4 h-4 mr-2 text-red-600" />
                    {connectYoutubeMutation.isPending ? "Conectando..." : "Conectar Conta YouTube"}
                </Button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
                Configure a sala de cinema VIP (LiveStream) nativa da plataforma. Você pode gerar o link pelo YouTube automaticamente ou colar o ID de uma live já existente.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border p-4 rounded-lg bg-red-50/50 flex flex-col justify-center items-center text-center space-y-3">
                    <Sparkles className="w-8 h-8 text-red-500" />
                    <h4 className="font-semibold text-gray-800">Gerar Live Automática</h4>
                    <p className="text-xs text-gray-600">A plataforma criará a live no seu YouTube e vinculará a este evento na mesma hora.</p>
                    <Button
                        onClick={handleAutoGenerate}
                        disabled={saveMutation.isPending}
                        className="w-full bg-red-600 hover:bg-red-700"
                    >
                        {saveMutation.isPending && streamId === 'auto' ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Youtube className="w-4 h-4 mr-2" />}
                        Gerar Tudo Sozinho
                    </Button>
                </div>

                <form onSubmit={handleSave} className="space-y-4 border p-4 rounded-lg bg-gray-50 flex flex-col justify-between">
                    <div className="space-y-2">
                        <Label htmlFor="streamId">ID do Vídeo do YouTube (Manual)</Label>
                        <div className="flex gap-2">
                            <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-gray-300 rounded-l-md font-mono shrink-0">
                                youtube.com/live/
                            </span>
                            <Input
                                id="streamId"
                                placeholder="Ex: dQw4w9WgXcQ"
                                value={streamId}
                                onChange={(e) => setStreamId(e.target.value)}
                                className="rounded-l-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="status">Status da Transmissão</Label>
                        <select
                            id="status"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-accent focus:border-accent p-2 text-sm"
                        >
                            <option value="SCHEDULED">Agendado (Aguardando Início)</option>
                            <option value="LIVE">Ao Vivo Agora</option>
                            <option value="ENDED">Encerrada</option>
                        </select>
                    </div>

                    <Button type="submit" disabled={saveMutation.isPending} className="w-full" variant="outline">
                        {saveMutation.isPending && streamId !== 'auto' ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Salvar ID Manual
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default LiveStreamConfig;
