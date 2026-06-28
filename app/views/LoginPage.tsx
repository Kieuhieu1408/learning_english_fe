"use client";

import AuthPage from "../../components/AuthPage";

interface LoginPageProps {
  onSuccess: () => void;
}

export default function LoginPage({ onSuccess }: LoginPageProps) {
  return <AuthPage onSuccess={onSuccess} />;
}
