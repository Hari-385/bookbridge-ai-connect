import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, MessageCircle, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BookDetail {
  id: string;
  title: string;
  author: string;
  category: string;
  book_type: string;
  mode: string;
  price: number | null;
  image_url: string | null;
  description: string | null;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [book, setBook] = useState<BookDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
    if (id) fetchBook(id);
  }, [id]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setCurrentUser(session?.user);
  };

  const fetchBook = async (bookId: string) => {
    try {
      const { data, error } = await supabase
        .from("books")
        .select(`
          *,
          profiles!inner(full_name, avatar_url)
        `)
        .eq("id", bookId)
        .single();

      if (error) throw error;
      setBook(data);
    } catch (error) {
      console.error("Error fetching book:", error);
      toast({
        title: "Error",
        description: "Failed to load book details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getModeColor = (mode: string) => {
    switch (mode) {
      case "sell":
        return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
      case "donate":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
      case "exchange":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const handleContact = () => {
    if (!currentUser) {
      toast({
        title: "Sign in required",
        description: "Please sign in to contact the seller",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    
    toast({
      title: "Coming soon",
      description: "Chat feature will be available in the next update",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">Loading book details...</div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-semibold mb-4">Book not found</h2>
          <Button onClick={() => navigate("/browse")}>Back to Browse</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Button
          variant="ghost"
          onClick={() => navigate("/browse")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Browse
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Book Image */}
          <div className="aspect-[3/4] bg-gradient-to-br from-secondary to-muted rounded-lg overflow-hidden relative shadow-[var(--shadow-book)]">
            {book.image_url ? (
              <img
                src={book.image_url}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-9xl text-muted-foreground">📚</span>
              </div>
            )}
            <Badge className={`absolute top-4 right-4 text-base ${getModeColor(book.mode)}`}>
              {book.mode}
            </Badge>
          </div>

          {/* Book Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {book.title}
              </h1>
              <p className="text-xl text-muted-foreground mb-4">by {book.author}</p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="outline" className="text-sm">
                  {book.book_type}
                </Badge>
                <Badge variant="outline" className="text-sm">
                  {book.category}
                </Badge>
              </div>

              {book.mode === "sell" && book.price && (
                <div className="text-3xl font-bold text-primary mb-4">
                  ₹{book.price}
                </div>
              )}
            </div>

            {book.description && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground">{book.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Owner Info */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Listed by</h3>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={book.profiles.avatar_url || undefined} />
                    <AvatarFallback>
                      <User className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{book.profiles.full_name || "Anonymous User"}</p>
                    <p className="text-sm text-muted-foreground">
                      Listed {new Date(book.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Button */}
            {currentUser?.id !== book.user_id && (
              <Button
                onClick={handleContact}
                className="w-full bg-gradient-to-r from-primary to-accent text-lg py-6"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Contact Seller
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
