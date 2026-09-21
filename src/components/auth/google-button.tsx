import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/app/actions/auth";

export function GoogleButton() {
  return (
    <form action={signInWithGoogle}>
      <Button type="submit" variant="outline" className="w-full">
        Continue with Google
      </Button>
    </form>
  );
}
