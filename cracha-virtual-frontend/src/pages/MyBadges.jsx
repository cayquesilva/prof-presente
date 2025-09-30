import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { QrCode, Download, Calendar, MapPin, User } from "lucide-react";

const MyBadges = () => {
  const [selectedBadge, setSelectedBadge] = useState(null);

  const {
    data: badges = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["my-badges"],
    queryFn: async () => {
      const response = await api.get("/badges/my-badges");
      return response.data.data;
    },
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const downloadBadge = async (badgeId) => {
    try {
      const response = await api.get(`/badges/${badgeId}/download`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `cracha-${badgeId}.png`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao baixar crachá:", error);
    }
  };

  const BadgeModal = ({ badge, onClose }) => {
    if (!badge) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Crachá Virtual</h3>
              <Button variant="ghost" onClick={onClose}>
                ×
              </Button>
            </div>

            {/* Crachá Virtual */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-700 text-white p-6 rounded-lg mb-4">
              <div className="text-center mb-4">
                <div className="w-20 h-20 bg-white rounded-full mx-auto mb-3 flex items-center justify-center">
                  <User className="h-12 w-12 text-gray-400" />
                </div>
                <h4 className="text-xl font-bold">
                  {badge.enrollment.user.name}
                </h4>
                <p className="text-blue-100">{badge.enrollment.user.email}</p>
              </div>

              <div className="border-t border-blue-400 pt-4">
                <h5 className="font-semibold text-lg mb-2">
                  {badge.enrollment.event.title}
                </h5>
                <div className="space-y-1 text-sm text-blue-100">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    {formatDate(badge.enrollment.event.startDate)}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    {badge.enrollment.event.location}
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="text-center mb-4">
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
                <img
                  src={badge.qrCodeUrl}
                  alt="QR Code"
                  className="w-32 h-32 mx-auto"
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Apresente este QR Code na entrada do evento
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => downloadBadge(badge.id)}
                className="flex-1 flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Baixar Crachá
              </Button>
              <Button variant="outline" onClick={onClose} className="flex-1">
                Fechar
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Meus Crachás</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">
          Erro ao carregar crachás: {error.message}
        </p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Meus Crachás</h1>

      {badges.length === 0 ? (
        <div className="text-center py-12">
          <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">
            Você ainda não possui crachás virtuais.
          </p>
          <p className="text-sm text-gray-500">
            Os crachás são gerados automaticamente quando suas inscrições são
            aprovadas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {badges.map((badge) => (
            <Card
              key={badge.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg line-clamp-2">
                    {badge.enrollment.event.title}
                  </CardTitle>
                  <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                </div>
                <CardDescription className="line-clamp-3">
                  {badge.enrollment.event.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{formatDate(badge.enrollment.event.startDate)}</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span className="line-clamp-1">
                      {badge.enrollment.event.location}
                    </span>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <Button
                      onClick={() => setSelectedBadge(badge)}
                      className="flex-1 flex items-center gap-2"
                    >
                      <QrCode className="h-4 w-4" />
                      Ver Crachá
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => downloadBadge(badge.id)}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedBadge && (
        <BadgeModal
          badge={selectedBadge}
          onClose={() => setSelectedBadge(null)}
        />
      )}
    </div>
  );
};

export default MyBadges;
