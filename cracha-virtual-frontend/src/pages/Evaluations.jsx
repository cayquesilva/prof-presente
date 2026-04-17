import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "../components/ui/badge";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Star, MessageSquare, Calendar, MapPin } from "lucide-react";
import { toast } from "sonner";

const Evaluations = () => {
  const queryClient = useQueryClient();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: enrollments, isLoading } = useQuery({
    queryKey: ["past-enrollments"],
    queryFn: async () => {
      const response = await api.get("/enrollments");
      const now = new Date();
      return response.data.filter(
        (enrollment) =>
          new Date(enrollment.event.endDate) < now &&
          enrollment.status === "confirmed"
      );
    },
  });

  const { data: myEvaluations } = useQuery({
    queryKey: ["my-evaluations"],
    queryFn: async () => {
      const response = await api.get("/evaluations/my");
      return response.data;
    },
  });

  const evaluateMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post("/evaluations", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["my-evaluations"]);
      toast.success("Avaliação enviada com sucesso!");
      setIsDialogOpen(false);
      setRating(0);
      setComment("");
      setSelectedEvent(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Erro ao enviar avaliação");
    },
  });

  const handleSubmitEvaluation = () => {
    if (rating === 0) {
      toast.error("Por favor, selecione uma nota");
      return;
    }

    evaluateMutation.mutate({
      eventId: selectedEvent.event.id,
      rating,
      comment: comment.trim() || null,
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const hasEvaluated = (eventId) => {
    return myEvaluations?.some((evaluation) => evaluation.eventId === eventId);
  };

  const StarRating = ({ value, onChange, readonly = false }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => !readonly && onChange && onChange(star)}
            className={`transition-colors ${
              readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
            }`}
            disabled={readonly}
          >
            <Star
              className={`h-8 w-8 ${
                star <= value
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Avaliações</h1>
        <p className="text-gray-600">
          Avalie os eventos que você participou e veja suas avaliações anteriores
        </p>
      </div>

      {enrollments?.length === 0 && (
        <Alert>
          <MessageSquare className="h-4 w-4" />
          <AlertDescription>
            Você ainda não participou de nenhum evento para avaliar.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {enrollments?.map((enrollment) => {
          const evaluated = hasEvaluated(enrollment.event.id);
          const evaluation = myEvaluations?.find(
            (evalItem) => evalItem.eventId === enrollment.event.id
          );

          return (
            <Card key={enrollment.id}>
              <CardHeader>
                <CardTitle className="text-lg">{enrollment.event.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {enrollment.event.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{formatDate(enrollment.event.startDate)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span className="line-clamp-1">
                      {enrollment.event.location}
                    </span>
                  </div>
                </div>

                {evaluated ? (
                  <div className="space-y-3 pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Sua avaliação:</span>
                      <Badge className="bg-green-100 text-green-800">
                        Avaliado
                      </Badge>
                    </div>
                    <StarRating value={evaluation.rating} readonly />
                    {evaluation.comment && (
                      <p className="text-sm text-gray-600 italic">
                        "{evaluation.comment}"
                      </p>
                    )}
                  </div>
                ) : (
                    <Dialog
                      open={isDialogOpen && selectedEvent?.id === enrollment.id}
                      onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (!open) {
                          setSelectedEvent(null);
                          setRating(0);
                          setComment("");
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          className="w-full bg-slate-900 hover:bg-black text-white font-black rounded-xl h-11 transition-all active:scale-95"
                          onClick={() => setSelectedEvent(enrollment)}
                        >
                          <Star className="h-4 w-4 mr-2" />
                          Avaliar Evento
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="p-0 gap-0 overflow-hidden sm:rounded-[2.5rem] border-none shadow-2xl max-w-[500px] w-full bg-white dark:bg-slate-900 mx-auto">
                        <DialogHeader className="p-10 pb-8 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-5">
                            <div className="bg-yellow-400 text-white p-4 rounded-3xl shadow-lg shadow-yellow-100 dark:shadow-none">
                              <Star className="h-7 w-7 fill-white" />
                            </div>
                            <div>
                              <DialogTitle className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-tight">
                                Avaliar Evento
                              </DialogTitle>
                              <DialogDescription className="font-bold text-slate-500 text-base mt-0.5 line-clamp-1">
                                {enrollment.event.title}
                              </DialogDescription>
                            </div>
                          </div>
                        </DialogHeader>
                        <div className="flex flex-col">
                          <div className="p-10 space-y-10 bg-white dark:bg-slate-900">
                            <div className="space-y-6 text-center">
                              <Label className="font-black text-slate-400 uppercase text-[10px] tracking-[0.2em] block">Sua Experiência</Label>
                              <div className="flex justify-center transform scale-125 origin-center py-2">
                                <StarRating value={rating} onChange={setRating} />
                              </div>
                              <div className="h-8">
                                <AnimatePresence mode="wait">
                                  {rating > 0 && (
                                    <motion.p
                                      key={rating}
                                      initial={{ opacity: 0, y: 5 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -5 }}
                                      className="text-sm font-black uppercase tracking-widest"
                                    >
                                      {rating === 1 && <span className="text-rose-500">Muito insatisfeito 😠</span>}
                                      {rating === 2 && <span className="text-orange-500">Insatisfeito ☹️</span>}
                                      {rating === 3 && <span className="text-amber-600">Regular 😐</span>}
                                      {rating === 4 && <span className="text-blue-500">Satisfeito 🙂</span>}
                                      {rating === 5 && <span className="text-emerald-500">Excelente! 🤩</span>}
                                    </motion.p>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <Label htmlFor="comment" className="font-black text-slate-700 dark:text-slate-300 ml-1 uppercase text-[10px] tracking-[0.2em]">
                                Comentário Adicional <span className="text-slate-400 font-medium lowercase">(opcional)</span>
                              </Label>
                              <Textarea
                                id="comment"
                                placeholder="O que você mais gostou ou o que podemos melhorar?"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                rows={4}
                                className="rounded-[1.5rem] border-slate-100 bg-slate-50/50 dark:bg-slate-800/50 p-6 resize-none focus-visible:ring-yellow-400 transition-all shadow-inner text-slate-900 dark:text-white font-medium"
                              />
                            </div>
                          </div>

                          <DialogFooter className="p-8 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4">
                            <Button
                              variant="ghost"
                              className="h-14 rounded-2xl font-black uppercase tracking-widest order-2 sm:order-1 sm:flex-1 text-slate-500 hover:text-slate-900"
                              onClick={() => {
                                setIsDialogOpen(false);
                                setSelectedEvent(null);
                                setRating(0);
                                setComment("");
                              }}
                            >
                              Agora não
                            </Button>
                            <Button
                              onClick={handleSubmitEvaluation}
                              disabled={evaluateMutation.isPending || rating === 0}
                              className="h-14 bg-yellow-400 hover:bg-yellow-500 font-black text-white rounded-2xl shadow-2xl shadow-yellow-100 dark:shadow-none active:scale-95 transition-all text-lg uppercase tracking-wider order-1 sm:order-2 sm:flex-[2]"
                            >
                              {evaluateMutation.isPending
                                ? "Enviando..."
                                : "Enviar Avaliação"}
                            </Button>
                          </DialogFooter>
                        </div>
                      </DialogContent>
                    </Dialog>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Evaluations;
