import { Link } from "@tanstack/react-router";

export function LandingNav() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/60">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="h-8 w-8 rounded-lg bg-gold-gradient grid place-items-center text-primary-foreground text-sm font-bold">र</div>
          <span className="font-display text-lg tracking-tight">Rasoi <span className="text-gold-gradient italic">Intelligence</span></span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition">Features</a>
          <a href="#how" className="hover:text-foreground transition">How it works</a>
          <a href="#pricing" className="hover:text-foreground transition">Pricing</a>
          <Link to="/clients" className="hover:text-foreground transition">Demo</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition">Sign in</Link>
          <Link to="/register" className="text-sm px-4 py-2 rounded-full bg-gold-gradient text-primary-foreground font-medium hover:opacity-90 transition">
            Start free
          </Link>
        </div>
      </div>
    </header>
  );
}