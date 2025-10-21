// ARQUIVO: src/components/AppTour.jsx

import React, { useState, useEffect, useRef } from "react";
import Joyride, { STATUS, EVENTS, ACTIONS } from "react-joyride";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import { useMediaQuery } from "../hooks/use-mobile";

// Passos para Desktop
const dashboardStepsDesktop = [
  {
    target: "#nav-link-eventos",
    content:
      'Bem-vindo! Para começar, clique no menu "Eventos" para ver as formações disponíveis.',
    title: "1/5: Explore os Eventos",
    placement: "right",
    disableBeacon: true,
  },
];

// NOVOS PASSOS PARA MOBILE
const dashboardStepsMobile = [
  {
    target: "#mobile-menu-trigger",
    content:
      "Bem-vindo! Para começar, clique aqui para abrir o menu de navegação.",
    title: "Abra o Menu",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: "#nav-link-eventos",
    content:
      'Ótimo! Agora clique em "Eventos" para ver as formações disponíveis.',
    title: "1/5: Explore os Eventos",
    placement: "right",
    disableOverlay: true,
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
    disableOverlay: true,
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

const AppTour = ({ user, setSidebarOpen }) => {
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState([]);
  const [stepIndex, setStepIndex] = useState(0);
  const location = useLocation();
  const intervalRef = useRef(null);
  const { updateAuthUser } = useAuth();
  const queryClient = useQueryClient();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const { mutate: completeOnboarding } = useMutation({
    mutationFn: () => api.put("/users/me/complete-onboarding"),
    onSuccess: () => {
      updateAuthUser({ hasCompletedOnboarding: true });
      queryClient.setQueryData(["user-profile", user.id], (oldData) => {
        if (oldData) return { ...oldData, hasCompletedOnboarding: true };
      });
    },
  });

  useEffect(() => {
    // ... (lógica de espera e definição de passos - permanece a mesma)
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRun(false);
    if (user && !user.hasCompletedOnboarding) {
      const path = location.pathname;
      let currentSteps = [];
      if (path.startsWith("/dashboard")) {
        currentSteps = isMobile ? dashboardStepsMobile : dashboardStepsDesktop;
      } else if (path.startsWith("/events")) currentSteps = eventsSteps;
      else if (path.startsWith("/profile")) currentSteps = profileSteps;

      if (currentSteps.length > 0) {
        const firstTarget = currentSteps[0].target;
        intervalRef.current = setInterval(() => {
          if (document.querySelector(firstTarget)) {
            clearInterval(intervalRef.current);
            setSteps(currentSteps);
            setStepIndex(0);
            setRun(true);
          }
        }, 200);
      } else {
        setRun(false);
        setSteps([]);
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user, location.pathname, isMobile]);

  // --- LÓGICA DE CONCLUSÃO CORRIGIDA ---
  const handleJoyrideCallback = (data) => {
    const { action, index, status, type, step } = data;

    // A lógica de pular/fechar/finalizar permanece a mesma
    if (
      [STATUS.FINISHED, STATUS.SKIPPED, ACTIONS.CLOSE].includes(status) ||
      action === ACTIONS.CLOSE
    ) {
      const finalStepTarget = profileSteps[profileSteps.length - 1].target;
      if (
        status === STATUS.SKIPPED ||
        action === ACTIONS.CLOSE ||
        (status === STATUS.FINISHED && step.target === finalStepTarget)
      ) {
        setRun(false);
        completeOnboarding();
      }
      return;
    }

    if ([EVENTS.STEP_AFTER].includes(type)) {
      const nextStepIndex = index + (action === ACTIONS.PREV ? -1 : 1);

      // Abre a sidebar no mobile e pausa o tour
      if (
        isMobile &&
        step.target === "#mobile-menu-trigger" &&
        action === ACTIONS.NEXT
      ) {
        setRun(false); // Pausa o tour
        setSidebarOpen(true);

        // Espera um pouco e reinicia o tour no próximo passo
        setTimeout(() => {
          setStepIndex(nextStepIndex);
          setRun(true);
        }, 500); // 500ms para garantir que a sidebar esteja totalmente renderizada

        return; // Impede a execução do resto da função
      }

      setStepIndex(nextStepIndex);
    }
  };

  if (!run || steps.length === 0) {
    return null;
  }

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
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
        nextLabelWithProgress: `Avançar: etapa ${stepIndex + 1} de ${
          steps.length
        }`,
      }}
    />
  );
};

export default AppTour;
