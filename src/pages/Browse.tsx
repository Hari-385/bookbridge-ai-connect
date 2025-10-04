import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  book_type: string;
  mode: string;
  price: number | null;
  image_url: string | null;
  user_id: string;
  profiles: {
    full_name: string;
  };
}

export default function Browse() {
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [modeFilter, setModeFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const { data, error } = await supabase
        .from("books")
        .select(`
          *,
          profiles!inner(full_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBooks(data || []);
    } catch (error) {
      console.error("Error fetching books:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMode = modeFilter === "all" || book.mode === modeFilter;
    const matchesType = typeFilter === "all" || book.book_type === typeFilter;
    return matchesSearch && matchesMode && matchesType;
  });

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
          <div className="text-center">Loading books...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Browse Books
          </h1>
          <p className="text-muted-foreground text-lg">
            Discover your next great read from our community
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by title, author, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <Select value={modeFilter} onValueChange={setModeFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modes</SelectItem>
                <SelectItem value="sell">For Sale</SelectItem>
                <SelectItem value="donate">Donation</SelectItem>
                <SelectItem value="exchange">Exchange</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="textbook">Textbook</SelectItem>
                <SelectItem value="novel">Novel</SelectItem>
                <SelectItem value="storybook">Storybook</SelectItem>
                <SelectItem value="comics">Comics</SelectItem>
                <SelectItem value="biography">Biography</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Books Grid */}
        {filteredBooks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No books found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBooks.map((book) => (
              <Card
                key={book.id}
                className="overflow-hidden hover:shadow-[var(--shadow-hover)] transition-all cursor-pointer hover:scale-105 animate-fade-in"
                onClick={() => navigate(`/book/${book.id}`)}
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
                  <p className="text-sm text-muted-foreground mb-2">by {book.author}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {book.book_type}
                    </Badge>
                    {book.mode === "sell" && book.price && (
                      <span className="font-semibold text-primary">₹{book.price}</span>
                    )}
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
