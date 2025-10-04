import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  book_type: string;
  mode: string;
  price: number | null;
  image_url: string | null;
}

export default function MyBooks() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUser(session.user);
    fetchMyBooks(session.user.id);
  };

  const fetchMyBooks = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBooks(data || []);
    } catch (error) {
      console.error("Error fetching books:", error);
      toast({
        title: "Error",
        description: "Failed to load your books",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (bookId: string) => {
    if (!confirm("Are you sure you want to delete this book?")) return;

    try {
      const { error } = await supabase
        .from("books")
        .delete()
        .eq("id", bookId);

      if (error) throw error;

      setBooks(books.filter((book) => book.id !== bookId));
      toast({
        title: "Success",
        description: "Book deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting book:", error);
      toast({
        title: "Error",
        description: "Failed to delete book",
        variant: "destructive",
      });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">Loading your books...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              My Books
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage your book collection
            </p>
          </div>
          <Button
            onClick={() => navigate("/add-book")}
            className="bg-gradient-to-r from-primary to-accent"
          >
            <Plus className="mr-2 h-5 w-5" />
            Add Book
          </Button>
        </div>

        {books.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-semibold mb-2">No books yet</h2>
            <p className="text-muted-foreground mb-6">
              Start building your collection by adding your first book
            </p>
            <Button
              onClick={() => navigate("/add-book")}
              className="bg-gradient-to-r from-primary to-accent"
            >
              <Plus className="mr-2 h-5 w-5" />
              Add Your First Book
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {books.map((book) => (
              <Card
                key={book.id}
                className="overflow-hidden hover:shadow-[var(--shadow-hover)] transition-all animate-fade-in"
              >
                <div className="aspect-[3/4] bg-gradient-to-br from-secondary to-muted relative overflow-hidden">
                  {book.image_url ? (
                    <img
                      src={book.image_url}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-6xl text-muted-foreground">📚</span>
                    </div>
                  )}
                  <Badge className={`absolute top-2 right-2 ${getModeColor(book.mode)}`}>
                    {book.mode}
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-1 line-clamp-1">{book.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">by {book.author}</p>
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="outline" className="text-xs">
                      {book.book_type}
                    </Badge>
                    {book.mode === "sell" && book.price && (
                      <span className="font-semibold text-primary">₹{book.price}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/edit-book/${book.id}`)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDelete(book.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
