// ARQUIVO: src/components/AppTour.jsx

import React, { useState, useEffect, useRef } from "react";
import Joyride, { STATUS, EVENTS, ACTIONS } from "react-joyride";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../hooks/useAuth";

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
  const [stepIndex, setStepIndex] = useState(0);
  const location = useLocation();
  const intervalRef = useRef(null);
  const { updateAuthUser } = useAuth();
  const queryClient = useQueryClient();

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
      if (path.startsWith("/dashboard")) currentSteps = dashboardSteps;
      else if (path.startsWith("/events")) currentSteps = eventsSteps;
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
  }, [user, location.pathname]);

  // --- LÓGICA DE CONCLUSÃO CORRIGIDA ---
  const handleJoyrideCallback = (data) => {
    const { action, index, status, type, step } = data;

    // Se o usuário PULAR ou FECHAR o tour, encerra permanentemente.
    if (status === STATUS.SKIPPED || action === ACTIONS.CLOSE) {
      setRun(false);
      completeOnboarding();
      return;
    }

    // Se um capítulo do tour for FINALIZADO (clicou em "Próximo" ou "Entendido!").
    if (status === STATUS.FINISHED) {
      // Define qual é o alvo do último passo de TODA a jornada.
      // Neste caso, é o último passo da página de Perfil.
      const finalStepTarget = profileSteps[profileSteps.length - 1].target;

      // SÓ encerra permanentemente se o passo que acabou de terminar FOI o último da jornada.
      if (step.target === finalStepTarget) {
        setRun(false);
        completeOnboarding();
      }
      // Se for o final de um capítulo intermediário (como o do dashboard),
      // o tour apenas para, esperando a navegação do usuário. A variável não é alterada.
      return;
    }

    // Lógica para avançar entre os passos de um mesmo capítulo.
    if ([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND].includes(type)) {
      const nextStepIndex = index + (action === ACTIONS.PREV ? -1 : 1);
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
        nextLabelWithProgress: `Avançar: etapa ${stepIndex+1} de ${steps.length}`,
      }}
    />
  );
};

export default AppTour;
