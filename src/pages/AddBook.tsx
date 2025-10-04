import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload } from "lucide-react";

export default function AddBook() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    category: "",
    book_type: "",
    mode: "",
    price: "",
    description: "",
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      let imageUrl = null;

      // Upload image if provided
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${session.user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('book-images')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('book-images')
          .getPublicUrl(filePath);

        imageUrl = publicUrl;
      }

      // Insert book
      const { error } = await supabase.from("books").insert([{
        title: formData.title,
        author: formData.author,
        category: formData.category,
        book_type: formData.book_type as "textbook" | "novel" | "storybook" | "comics" | "biography" | "other",
        mode: formData.mode as "sell" | "donate" | "exchange",
        price: formData.mode === "sell" ? parseFloat(formData.price) : null,
        description: formData.description,
        image_url: imageUrl,
        user_id: session.user.id,
      }]);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Book added successfully",
      });
      navigate("/my-books");
    } catch (error) {
      console.error("Error adding book:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add book",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="max-w-2xl mx-auto shadow-[var(--shadow-book)]">
          <CardHeader>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Add New Book
            </CardTitle>
            <CardDescription>
              Share a book with the BookBridge community
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Book Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="author">Author *</Label>
                <Input
                  id="author"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Input
                  id="category"
                  placeholder="e.g., Fiction, Science, History"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="book_type">Book Type *</Label>
                <Select
                  value={formData.book_type}
                  onValueChange={(value) => setFormData({ ...formData, book_type: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select book type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="textbook">Textbook</SelectItem>
                    <SelectItem value="novel">Novel</SelectItem>
                    <SelectItem value="storybook">Storybook</SelectItem>
                    <SelectItem value="comics">Comics</SelectItem>
                    <SelectItem value="biography">Biography</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mode">Mode *</Label>
                <Select
                  value={formData.mode}
                  onValueChange={(value) => setFormData({ ...formData, mode: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sell">Sell</SelectItem>
                    <SelectItem value="donate">Donate</SelectItem>
                    <SelectItem value="exchange">Exchange</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.mode === "sell" && (
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the book condition and details"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Book Image</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="cursor-pointer"
                  />
                  {imageFile && (
                    <span className="text-sm text-muted-foreground">
                      {imageFile.name}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-primary to-accent"
                  disabled={loading}
                >
                  {loading ? "Adding..." : "Add Book"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/my-books")}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
