import React, { useState, useEffect, useRef } from "react";
import Joyride, { STATUS } from "react-joyride";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import api from "../lib/api";

const dashboardSteps = [
  {
    target: "#nav-link-eventos",
    content:
      'Bem-vindo! Para começar, clique no menu "Eventos" para ver as formações disponíveis.',
    title: "1/5: Explore os Eventos",
    placement: "right",
    disableBeacon: true,
  },
];

const eventsSteps = [
  {
    target: "#events-list",
    content:
      'Ótimo! Esta é a lista de eventos. Clique em "Ver detalhes" para saber mais e se inscrever.',
    title: "2/5: Lista de Eventos",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: "#nav-link-meu-perfil",
    content:
      'Excelente! Agora, clique em "Meu Perfil" para ver seu crachá e gerenciar suas informações.',
    title: "3/5: Acesse seu Perfil",
    placement: "right",
    disableBeacon: true,
  },
];

const profileSteps = [
  {
    target: "#profile-info-tab",
    content: "Aqui você pode visualizar e editar seus dados pessoais.",
    title: "4/5: Suas Informações",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: "#my-badge-tab",
    content:
      "Clique nesta aba para visualizar seu Crachá Universal, sua identidade para todos os eventos.",
    title: "5/5: Visualize seu Crachá",
    placement: "bottom",
    disableBeacon: true,
  },
];

const AppTour = ({ user }) => {
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState([]);
  const location = useLocation();
  const intervalRef = useRef(null); // Usamos uma ref para controlar o intervalo

  const { mutate: completeOnboarding } = useMutation({
    mutationFn: () => api.put("/users/:id/complete-onboarding"),
  });

  useEffect(() => {
    // Limpa qualquer verificador de intervalo anterior ao mudar de página
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (user && !user.hasCompletedOnboarding) {
      const path = location.pathname;
      let currentSteps = [];

      if (path.startsWith("/dashboard")) {
        currentSteps = dashboardSteps;
      } else if (path.startsWith("/events")) {
        currentSteps = eventsSteps;
      } else if (path.startsWith("/profile")) {
        currentSteps = profileSteps;
      }

      if (currentSteps.length > 0) {
        const firstTarget = currentSteps[0].target;

        // --- NOVA LÓGICA DE ESPERA ---
        // Fica verificando a cada 200ms se o alvo do primeiro passo já apareceu na tela
        intervalRef.current = setInterval(() => {
          if (document.querySelector(firstTarget)) {
            clearInterval(intervalRef.current); // Para de verificar
            setSteps(currentSteps);
            setRun(true); // Inicia o tour
          }
        }, 200);
      } else {
        setRun(false);
        setSteps([]);
      }
    }

    // Função de limpeza para quando o componente for desmontado
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user, location.pathname]);

  const handleJoyrideCallback = (data) => {
    const { status } = data;
    const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      completeOnboarding();
    }
  };

  if (!run || steps.length === 0) {
    return null;
  }

  return (
    <Joyride
      steps={steps}
      run={run}
      callback={handleJoyrideCallback}
      continuous
      showProgress
      showSkipButton
      styles={{ options: { zIndex: 10000, primaryColor: "#18181b" } }}
      locale={{
        back: "Anterior",
        close: "Fechar",
        last: "Entendido!",
        next: "Próximo",
        skip: "Pular",
      }}
    />
  );
};

export default AppTour;
