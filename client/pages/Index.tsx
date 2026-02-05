import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Index() {
  return (
    <main className="relative">
      <section className="bg-gradient-to-br from-primary/10 via-background to-fuchsia-100/40 py-16 sm:py-24">
        <div className="container max-w-4xl">
          <h1 className="text-balance bg-gradient-to-r from-primary to-fuchsia-600 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl">
            Welcome to Fusion
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            A production-ready full-stack React application with integrated Express backend, TypeScript, and modern tooling.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/">Get Started</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container max-w-4xl">
          <div className="rounded-2xl border bg-card p-6 sm:p-8">
            <h2 className="text-xl font-semibold">Tech Stack</h2>
            <ul className="mt-4 grid list-disc gap-3 pl-6 text-muted-foreground">
              <li>React 18 + React Router 6 (SPA mode)</li>
              <li>TypeScript throughout client and server</li>
              <li>Vite for lightning-fast development</li>
              <li>TailwindCSS 3 for styling</li>
              <li>Express backend integrated with Vite</li>
              <li>Fully responsive and mobile-friendly</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
