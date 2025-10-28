import sfuLogo from "@/assets/sfu-logo.png";

export const Navbar = () => {
  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4 py-3 flex items-center gap-3">
        <img src={sfuLogo} alt="SFU Logo" className="h-10 w-auto" />
        <div>
          <h1 className="text-xl font-bold">SFU Course Map</h1>
          <p className="text-xs text-muted-foreground">Visualize Course Prerequisites</p>
        </div>
      </div>
    </nav>
  );
};
