import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { 
  RefreshCw, 
  Target, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2,
  Database,
  Users,
  Zap
} from "lucide-react";

export default function DataIntegrityTab() {
  const queryClient = useQueryClient();
  const [lastSyncResult, setLastSyncResult] = useState(null);

  const syncTracksMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post("/data-integrity/sync-tracks");
      return response.data;
    },
    onSuccess: (data) => {
      setLastSyncResult(data);
      toast.success(`Sincronização concluída! ${data.syncCount} usuários processados.`);
      
      // Disparar confetes para celebrar a integridade dos dados!
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#3b82f6', '#8b5cf6']
      });

      queryClient.invalidateQueries(["admin-events"]);
      queryClient.invalidateQueries(["admin-users"]);
      queryClient.invalidateQueries(["admin-stats"]);
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.error || "Erro ao executar sincronização."
      );
    },
  });

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 p-1"
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">Integridade de Dados</h2>
        </div>
        <p className="text-muted-foreground max-w-2xl">
          Mantenha a consistência do ecossistema de trilhas e eventos. Utilize estas ferramentas para auditoria e correção em massa.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card Principal de Ação */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="relative overflow-hidden border-none shadow-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
            {/* Efeito decorativo de fundo */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 bg-blue-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-40 w-40 bg-purple-500/10 rounded-full blur-3xl" />
            
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Recomendado</span>
              </div>
              <CardTitle className="text-2xl flex items-center gap-3">
                <Target className="h-6 w-6 text-blue-600" />
                Sincronização de Trilhas
              </CardTitle>
              <CardDescription className="text-base">
                Esta rotina analisa todas as trilhas e seus respectivos eventos. Se um participante estiver em ao menos um evento da trilha, ele será automaticamente inscrito em todos os outros e na trilha mãe.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4 flex gap-3">
                <Zap className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-300">
                  <p className="font-semibold">O que acontece durante o processo:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1 opacity-90">
                    <li>Varre inscrições anteriores à regra de automação</li>
                    <li>Libera ingressos para eventos irmãos na mesma trilha</li>
                    <li>Garante progresso correto na LearningTrack</li>
                    <li><strong>Sem SPAM:</strong> Nenhum e-mail extra será enviado</li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                <Button 
                  onClick={() => {
                    if(window.confirm("A sincronização irá processar toda a base de dados. Deseja iniciar?")) {
                      syncTracksMutation.mutate();
                    }
                  }} 
                  disabled={syncTracksMutation.isPending}
                  size="lg"
                  className="w-full sm:w-auto h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                >
                  {syncTracksMutation.isPending ? (
                    <>
                      <RefreshCw className="h-5 w-5 mr-3 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Database className="h-5 w-5 mr-2" />
                      Sincronizar Trilhas Legadas
                    </>
                  )}
                </Button>
                
                {syncTracksMutation.isPending && (
                  <p className="text-sm text-muted-foreground animate-pulse">
                    Aguarde, isso pode levar alguns segundos...
                  </p>
                )}
              </div>

              <AnimatePresence>
                {lastSyncResult && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 rounded-xl flex items-start gap-3"
                  >
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-1" />
                    <div>
                      <p className="font-bold text-green-800 dark:text-green-300">Sincronização Finalizada</p>
                      <p className="text-sm text-green-700 dark:text-green-400">
                        {lastSyncResult.syncCount} ciclos de usuário foram analisados e atualizados com sucesso.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sidebar Mini Cards */}
        <motion.div variants={itemVariants} className="space-y-6">
          <Card className="border-dashed border-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-500" />
                Resumo da Auditoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">100%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Conformidade com a nova regra de trilhas após sincronização.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 text-slate-50 border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-400" />
                Aviso Importante
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs opacity-80 leading-relaxed">
              O cancelamento de inscrições continua sendo um processo <strong>individual</strong>. 
              Remover um usuário de um evento da trilha não o removerá automaticamente dos outros.
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
