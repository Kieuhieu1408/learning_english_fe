"use client";

import React, { useEffect, useState } from "react";

import KeySettingPage from "./views/KeySettingPage";
import LoginPage from "./views/LoginPage";
import MainPage from "./views/MainPage";
import ResultPage from "./views/ResultPage";
import TestPage from "./views/TestPage";

type ActiveView = "login" | "main" | "settings" | "test" | "results";

export default function Home() {
  const [activeView, setActiveView] = useState<ActiveView>("login");

  // Check JWT token on mount to decide initial view
  useEffect(() => {
    const token = localStorage.getItem("jwt_token");
    if (token) {
      setActiveView("main");
    }
  }, []);

  switch (activeView) {
    case "login":
      return <LoginPage onSuccess={() => setActiveView("main")} />;

    case "main":
      return (
        <MainPage
          onOpenSettings={() => setActiveView("settings")}
          onOpenTest={() => setActiveView("test")}
        />
      );

    case "settings":
      return <KeySettingPage onBack={() => setActiveView("main")} />;

    case "test":
      return (
        <TestPage
          onBack={() => setActiveView("main")}
          onViewResults={() => setActiveView("results")}
        />
      );

    case "results":
      return <ResultPage onBack={() => setActiveView("main")} />;

    default:
      return <LoginPage onSuccess={() => setActiveView("main")} />;
  }
}
