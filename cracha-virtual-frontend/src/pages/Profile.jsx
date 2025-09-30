import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
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
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Download,
  FileJson,
  Database,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

const Profile = () => {
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState(false);

  const { data: userData } = useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: async () => {
      const response = await api.get(`/users/${user.id}`);
      return response.data;
    },
    enabled: !!user?.id,
  });

  const exportUserData = async () => {
    setIsExporting(true);
    try {
      const [enrollments, badges, evaluations, checkins] = await Promise.all([
        api.get("/enrollments"),
        api.get("/badges/my-badges"),
        api.get("/evaluations/my"),
        api.get("/checkins/my"),
      ]);

      const exportData = {
        exportDate: new Date().toISOString(),
        user: {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          cpf: userData.cpf,
          phone: userData.phone,
          address: userData.address,
          createdAt: userData.createdAt,
        },
        statistics: {
          totalEnrollments: enrollments.data.length,
          totalBadges: badges.data.data?.length || 0,
          totalEvaluations: evaluations.data.length,
          totalCheckins: checkins.data.length,
        },
        enrollments: enrollments.data,
        badges: badges.data.data || [],
        evaluations: evaluations.data,
        checkins: checkins.data,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `meus-dados-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Dados exportados com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar dados:", error);
      toast.error("Erro ao exportar dados");
    } finally {
      setIsExporting(false);
    }
  };

  if (!userData) {
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
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Meu Perfil</h1>
        <p className="text-gray-600">
          Gerencie suas informações pessoais e dados da conta
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="data">
            <Database className="h-4 w-4 mr-2" />
            Meus Dados
          </TabsTrigger>
          <TabsTrigger value="privacy">
            <Shield className="h-4 w-4 mr-2" />
            Privacidade
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>
                Suas informações básicas cadastradas no sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <Input
                      id="name"
                      value={userData.name}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <Input
                      id="email"
                      value={userData.email}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={userData.cpf}
                    disabled
                    className="bg-gray-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <Input
                      id="phone"
                      value={userData.phone || "Não informado"}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <Input
                    id="address"
                    value={userData.address || "Não informado"}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Membro desde</Label>
                <p className="text-sm text-gray-600">
                  {new Date(userData.createdAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Exportar Meus Dados</CardTitle>
              <CardDescription>
                Baixe uma cópia completa de todos os seus dados armazenados no
                sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <FileJson className="h-4 w-4" />
                <AlertDescription>
                  O arquivo exportado conterá todas as suas informações pessoais,
                  inscrições, crachás, avaliações e check-ins em formato JSON.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <h4 className="font-semibold text-sm">O que será exportado:</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Informações pessoais (nome, email, CPF, telefone, endereço)
                  </li>
                  <li className="flex items-center gap-2">
                    <FileJson className="h-4 w-4" />
                    Histórico de inscrições em eventos
                  </li>
                  <li className="flex items-center gap-2">
                    <FileJson className="h-4 w-4" />
                    Crachás virtuais emitidos
                  </li>
                  <li className="flex items-center gap-2">
                    <FileJson className="h-4 w-4" />
                    Avaliações de eventos realizadas
                  </li>
                  <li className="flex items-center gap-2">
                    <FileJson className="h-4 w-4" />
                    Histórico de check-ins
                  </li>
                </ul>
              </div>

              <Button
                onClick={exportUserData}
                disabled={isExporting}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? "Exportando..." : "Exportar Meus Dados"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacidade e Segurança</CardTitle>
              <CardDescription>
                Configurações de privacidade e informações sobre seus dados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Seus dados estão protegidos e são usados apenas para o
                  funcionamento do sistema de crachás virtuais.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2">
                    Como seus dados são usados:
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Identificação em eventos</li>
                    <li>• Geração de crachás virtuais</li>
                    <li>• Registro de check-ins</li>
                    <li>• Comunicações sobre eventos</li>
                    <li>• Análises estatísticas (anonimizadas)</li>
                  </ul>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold text-sm mb-2">
                    Seus direitos:
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Exportar seus dados a qualquer momento</li>
                    <li>• Solicitar correção de dados incorretos</li>
                    <li>• Solicitar exclusão da sua conta</li>
                    <li>• Revogar consentimentos</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
