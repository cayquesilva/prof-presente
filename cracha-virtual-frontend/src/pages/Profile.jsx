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
  CreditCard,
  QrCode as QrCodeIcon,
  Award,
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

  const { data: userBadge } = useQuery({
    queryKey: ["user-badge"],
    queryFn: async () => {
      const response = await api.get("/user-badges/my-badge");
      return response.data;
    },
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
          <TabsTrigger value="badge">
            <CreditCard className="h-4 w-4 mr-2" />
            Meu Crachá
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

        <TabsContent value="badge" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Meu Crachá Universal</CardTitle>
              <CardDescription>
                Use este crachá para fazer check-in em qualquer evento que você esteja inscrito
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userBadge ? (
                <div className="space-y-6">
                  {/* Código do Crachá */}
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-lg border-2 border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Código do Crachá</p>
                        <p className="text-3xl font-bold font-mono text-blue-900">
                          {userBadge.badgeCode}
                        </p>
                      </div>
                      <CreditCard className="h-12 w-12 text-blue-600" />
                    </div>
                    <p className="text-sm text-gray-600">
                      Use este código para fazer check-in manualmente em qualquer evento
                    </p>
                  </div>

                  {/* QR Code */}
                  <div className="flex flex-col items-center">
                    <div className="bg-white p-6 rounded-xl border-2 border-gray-200 shadow-sm">
                      <img
                        src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000'}${userBadge.qrCodeUrl}`}
                        alt="QR Code do Crachá"
                        className="w-64 h-64"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = '<p class="text-gray-500">QR Code não disponível</p>';
                        }}
                      />
                    </div>
                    <div className="mt-4 text-center">
                      <p className="text-sm text-gray-600 flex items-center gap-2 justify-center">
                        <QrCodeIcon className="h-4 w-4" />
                        Apresente este QR Code na entrada dos eventos
                      </p>
                    </div>
                  </div>

                  {/* Estatísticas */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <Award className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                          <p className="text-2xl font-bold">{userBadge._count?.userCheckins || 0}</p>
                          <p className="text-sm text-gray-600">Check-ins Realizados</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <CreditCard className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                          <p className="text-2xl font-bold">
                            {new Date(userBadge.issuedAt).toLocaleDateString("pt-BR")}
                          </p>
                          <p className="text-sm text-gray-600">Data de Emissão</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Informações */}
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      Seu crachá é único e pessoal. Não compartilhe seu código ou QR code com outras pessoas.
                      Este crachá pode ser usado em qualquer evento que você esteja inscrito e aprovado.
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">Carregando crachá...</p>
                </div>
              )}
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
