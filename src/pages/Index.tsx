import { Calculator } from "@/components/Calculator";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <header className="mb-8 text-center animate-fade-in">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">
          Calculator
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Simple & elegant
        </p>
      </header>
      
      <Calculator />
      
      <footer className="mt-8 text-xs text-muted-foreground animate-fade-in">
        Tap the buttons to calculate
      </footer>
    </div>
  );
};

export default Index;
