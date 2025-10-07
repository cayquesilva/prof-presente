import { useState } from "react";
import { Link } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useDebounce } from "../hooks/useDebounce"; // Hook recomendado para debounce
import api from "../lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Calendar, MapPin, Users, Search } from "lucide-react";

// É uma boa prática criar um hook customizado para debounce,
// mas para simplicidade, a lógica pode ser colocada diretamente no componente.
// Se não tiver o hook 'useDebounce', a lógica com useEffect/setTimeout funciona.

const Events = () => {
  const [searchTerm, setSearchTerm] = useState("");
  // Debounce no termo de busca para evitar requisições a cada tecla digitada
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const {
    data,
    error,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    // A chave da query agora inclui o termo de busca.
    // O React Query irá refazer a busca automaticamente quando o termo mudar.
    queryKey: ["events", debouncedSearchTerm],

    // A função de query agora recebe 'pageParam'
    queryFn: async ({ pageParam = 1 }) => {
      const response = await api.get("/events", {
        params: {
          page: pageParam,
          limit: 9, // Buscar 9 por vez para preencher a grade 3x3
          search: debouncedSearchTerm,
        },
      });
      // Corrigido: retornamos o objeto inteiro para ter acesso à paginação
      return response.data;
    },

    // Define como obter o número da próxima página
    getNextPageParam: (lastPage) => {
      const { page, pages } = lastPage.pagination;
      if (page < pages) {
        return page + 1;
      }
      return undefined; // Não há mais páginas
    },
  });

  // Extrai a lista de eventos de todas as páginas carregadas
  const events = data?.pages.flatMap((page) => page.events) ?? [];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    });
  };

  const getEventStatus = (startDate, endDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now < start) {
      return { label: "Próximo", color: "bg-blue-100 text-blue-800" };
    } else if (now >= start && now <= end) {
      return { label: "Em andamento", color: "bg-green-100 text-green-800" };
    } else {
      return { label: "Finalizado", color: "bg-gray-100 text-gray-800" };
    }
  };

  if (isLoading && !data) {
    // Tela de loading inicial
    return <div>Carregando eventos...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">
          Erro ao carregar eventos: {error.message}
        </p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Eventos</h1>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Pesquisar por título, descrição ou local..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">
            {debouncedSearchTerm
              ? "Nenhum evento encontrado para sua pesquisa."
              : "Nenhum evento disponível no momento."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              const eventStatus = getEventStatus(
                event.startDate,
                event.endDate
              );
              return (
                <Card
                  key={event.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg line-clamp-2">
                        {event.title}
                      </CardTitle>
                      <Badge className={eventStatus.color}>
                        {eventStatus.label}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-3">
                      {event.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>{formatDate(event.startDate)}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span className="line-clamp-1">{event.location}</span>
                      </div>
                      {event.maxAttendees && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="h-4 w-4 mr-2" />
                          <span>Até {event.maxAttendees} participantes</span>
                        </div>
                      )}
                      <div className="pt-2">
                        <Link to={`/events/${event.id}`}>
                          <Button className="w-full">Ver detalhes</Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Botão de Paginação "Carregar Mais" */}
          <div className="flex justify-center mt-6">
            {hasNextPage && (
              <Button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? "Carregando..." : "Carregar Mais"}
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Events;
