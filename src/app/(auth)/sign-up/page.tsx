export const dynamic = "force-dynamic";

import { AuthCard } from "@/components/auth/auth-card";
import { CredentialsForm } from "@/components/auth/credentials-form";
import { signUp } from "@/app/actions/auth";

export default function SignUpPage() {
  return (
    <AuthCard
      title="Create your account"
      description="Share groceries and meal plans with your household."
      footerText="Already have an account?"
      footerLink={{ href: "/sign-in", label: "Sign in" }}
    >
      <CredentialsForm action={signUp} mode="sign-up" />
    </AuthCard>
  );
}
