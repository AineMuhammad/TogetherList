export const dynamic = "force-dynamic";

import { AuthCard } from "@/components/auth/auth-card";
import { CredentialsForm } from "@/components/auth/credentials-form";
import { signInWithCredentials } from "@/app/actions/auth";

export default function SignInPage() {
  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to your TogetherList account."
      footerText="New here?"
      footerLink={{ href: "/sign-up", label: "Create an account" }}
    >
      <CredentialsForm action={signInWithCredentials} mode="sign-in" />
    </AuthCard>
  );
}
