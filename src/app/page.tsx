import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">TogetherList</h1>
      <p className="text-muted-foreground">
        A shared grocery list and meal planner for your household.
      </p>
      <Button disabled>Coming soon</Button>
    </main>
  );
}
