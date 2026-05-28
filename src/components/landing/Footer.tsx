export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-surface/40">
      <div className="max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-4 gap-8">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gold-gradient grid place-items-center text-primary-foreground text-sm font-bold">र</div>
            <span className="font-display text-lg">Rasoi Intelligence</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground max-w-sm">
            AI-powered analytics that turn your billing data into ₹₹₹. Built for Indian restaurants and the consultants who serve them.
          </p>
        </div>
        <div className="text-sm">
          <div className="font-medium mb-3">Product</div>
          <ul className="space-y-2 text-muted-foreground">
            <li><a href="#features" className="hover:text-foreground">Features</a></li>
            <li><a href="#pricing" className="hover:text-foreground">Pricing</a></li>
            <li><a href="#how" className="hover:text-foreground">How it works</a></li>
          </ul>
        </div>
        <div className="text-sm">
          <div className="font-medium mb-3">Company</div>
          <ul className="space-y-2 text-muted-foreground">
            <li>About</li>
            <li>Privacy</li>
            <li>Contact</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        © 2025 LokLearning. Crafted in India.
      </div>
    </footer>
  );
}