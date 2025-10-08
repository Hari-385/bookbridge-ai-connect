import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const checkoutSchema = z.object({
  fullName: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  email: z.string().trim().email("Invalid email address").max(255, "Email is too long"),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Invalid phone number (must be 10 digits starting with 6-9)"),
  addressLine1: z.string().trim().min(5, "Address is too short").max(200, "Address is too long"),
  addressLine2: z.string().trim().max(200, "Address is too long").optional(),
  city: z.string().trim().min(2, "City name is too short").max(100, "City name is too long"),
  state: z.string().trim().min(2, "State name is too short").max(100, "State name is too long"),
  pincode: z.string().trim().regex(/^\d{6}$/, "Pincode must be 6 digits"),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface Book {
  id: string;
  title: string;
  author: string;
  price: number;
  available_copies: number;
  user_id: string;
}

export default function Checkout() {
  const navigate = useNavigate();
  const { bookId } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [book, setBook] = useState<Book | null>(null);
  const [quantity, setQuantity] = useState(1);
  
  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      pincode: "",
    },
  });

  useEffect(() => {
    fetchBook();
  }, [bookId]);

  const fetchBook = async () => {
    try {
      const { data, error } = await supabase
        .from("books")
        .select("*")
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
      navigate("/browse");
    }
  };

  const handleSubmit = async (data: CheckoutFormData) => {
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      if (!book) return;

      if (quantity > book.available_copies) {
        toast({
          title: "Error",
          description: "Requested quantity exceeds available copies",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Create order
      const { error: orderError } = await supabase.from("orders").insert([{
        book_id: book.id,
        buyer_id: session.user.id,
        seller_id: book.user_id,
        quantity: quantity,
        total_price: book.price * quantity,
        full_name: data.fullName,
        phone: data.phone,
        address_line1: data.addressLine1,
        address_line2: data.addressLine2 || null,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        payment_method: "cod",
        status: "pending",
      }]);

      if (orderError) throw orderError;

      // Update available copies
      const { error: updateError } = await supabase
        .from("books")
        .update({ available_copies: book.available_copies - quantity })
        .eq("id", book.id);

      if (updateError) throw updateError;

      toast({
        title: "Order Placed!",
        description: "Your order has been placed successfully. You will receive it via Cash on Delivery.",
      });
      navigate("/browse");
    } catch (error) {
      console.error("Error placing order:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to place order",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!book) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">Loading...</div>
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
          onClick={() => navigate(`/book/${bookId}`)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Book Details
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{book.title}</h3>
                <p className="text-sm text-muted-foreground">by {book.author}</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max={book.available_copies}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                />
                <p className="text-sm text-muted-foreground">
                  {book.available_copies} copies available
                </p>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center mb-2">
                  <span>Price per copy:</span>
                  <span>₹{book.price}</span>
                </div>
                <div className="flex justify-between items-center font-semibold text-lg">
                  <span>Total:</span>
                  <span>₹{book.price * quantity}</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm font-semibold">Payment Method</p>
                <p className="text-sm text-muted-foreground">Cash on Delivery (COD)</p>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Address */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery Address</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address *</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number *</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="10-digit number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="addressLine1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address Line 1 *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="addressLine2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address Line 2</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="pincode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pincode *</FormLabel>
                        <FormControl>
                          <Input placeholder="6-digit pincode" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-primary to-accent"
                    disabled={loading || quantity > book.available_copies}
                  >
                    {loading ? "Placing Order..." : "Place Order (COD)"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
