import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Search, BookOpen, Heart, RefreshCw, ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-books.jpg";

export default function Index() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        // User is already logged in, stay on home page
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-accent/30" />
        
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Share the Joy of Reading
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8">
              Exchange, donate, or sell books with BookBridge. Discover your next great read while giving books a second life.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => navigate("/browse")}
                size="lg"
                className="bg-gradient-to-r from-primary to-accent text-lg hover:shadow-[var(--shadow-hover)] transition-shadow"
              >
                Browse Books
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              {!user && (
                <Button 
                  onClick={() => navigate("/auth")}
                  size="lg"
                  variant="outline"
                  className="text-lg border-2 border-primary hover:bg-primary/10"
                >
                  Get Started
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-background to-secondary/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16">How BookBridge Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-2xl bg-card shadow-[var(--shadow-book)] hover:shadow-[var(--shadow-hover)] transition-all hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Discover Books</h3>
              <p className="text-muted-foreground">
                Browse through thousands of books available for exchange, donation, or purchase.
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-card shadow-[var(--shadow-book)] hover:shadow-[var(--shadow-hover)] transition-all hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-6">
                <RefreshCw className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Exchange & Share</h3>
              <p className="text-muted-foreground">
                Trade books with other readers or offer yours for donation to spread the love of reading.
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-card shadow-[var(--shadow-book)] hover:shadow-[var(--shadow-hover)] transition-all hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Build Community</h3>
              <p className="text-muted-foreground">
                Connect with fellow book lovers and create a sustainable reading community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-accent">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <BookOpen className="h-16 w-16 text-primary-foreground mx-auto mb-6" />
          <h2 className="text-4xl font-bold text-primary-foreground mb-6">
            Ready to Start Your Reading Journey?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Join thousands of book lovers sharing their favorite reads and discovering new stories.
          </p>
          <Button 
            onClick={() => navigate(user ? "/my-books" : "/auth")}
            size="lg"
            variant="secondary"
            className="text-lg hover:scale-105 transition-transform"
          >
            {user ? "Add Your Books" : "Join BookBridge Today"}
          </Button>
        </div>
      </section>
    </div>
  );
}
