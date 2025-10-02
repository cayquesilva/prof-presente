import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";

const TeacherRanking = () => {
  const { data: rankings, isLoading } = useQuery({
    queryKey: ["teacher-ranking"],
    queryFn: async () => {
      const response = await api.get("/teacher-badges/ranking?limit=20");
      return response.data.rankings;
    },
  });

  const getPositionIcon = (position) => {
    switch (position) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-amber-600" />;
      default:
        return <Award className="h-5 w-5 text-gray-400" />;
    }
  };

  const getPositionBadge = (position) => {
    if (position === 1) {
      return (
        <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white">
          1º Lugar
        </Badge>
      );
    } else if (position === 2) {
      return (
        <Badge className="bg-gradient-to-r from-gray-300 to-gray-500 text-white">
          2º Lugar
        </Badge>
      );
    } else if (position === 3) {
      return (
        <Badge className="bg-gradient-to-r from-amber-500 to-amber-700 text-white">
          3º Lugar
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-white">
        {position}º Lugar
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 ">
          Ranking de Professores
        </h1>
        <p className="text-gray-600">
          Professores mais ativos com maior número de presenças e participações
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Top Professores
          </CardTitle>
          <CardDescription>
            Classificação baseada no número total de check-ins realizados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Carregando ranking...</p>
            </div>
          ) : rankings?.length === 0 ? (
            <div className="text-center py-8">
              <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                Nenhum professor com check-ins registrados ainda
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Posição</TableHead>
                  <TableHead>Professor</TableHead>
                  <TableHead className="text-center">Check-ins</TableHead>
                  <TableHead className="text-right">Classificação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankings?.map((item) => (
                  <TableRow
                    key={item.teacher.id}
                    className={
                      item.position <= 3
                        ? "bg-gradient-to-r from-gray-50 to-white"
                        : ""
                    }
                  >
                    <TableCell>
                      <div className="flex items-center justify-center">
                        {getPositionIcon(item.position)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={item.teacher.photoUrl}
                            alt={item.teacher.name}
                          />
                          <AvatarFallback>
                            {item.teacher.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{item.teacher.name}</p>
                          <p className="text-sm text-gray-500">
                            {item.teacher.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="secondary"
                        className="font-bold text-lg px-4 py-1"
                      >
                        {item.totalCheckins}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {getPositionBadge(item.position)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {rankings?.slice(0, 3).map((item, index) => (
          <Card
            key={item.teacher.id}
            className={`${
              index === 0
                ? "bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300"
                : index === 1
                ? "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300"
                : "bg-gradient-to-br from-amber-50 to-amber-100 border-amber-300"
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {item.position}º Colocado
                </CardTitle>
                {getPositionIcon(item.position)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage
                    src={item.teacher.photoUrl}
                    alt={item.teacher.name}
                  />
                  <AvatarFallback>
                    {item.teacher.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{item.teacher.name}</p>
                  <p className="text-sm text-gray-600">
                    {item.totalCheckins} check-ins
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TeacherRanking;
