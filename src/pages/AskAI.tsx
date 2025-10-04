import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Send } from "lucide-react";

export default function AskAI() {
  const { toast } = useToast();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!question.trim()) {
      toast({
        title: "Question required",
        description: "Please enter a question",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setAnswer("");

    try {
      const { data, error } = await supabase.functions.invoke("ai-doubt-solver", {
        body: { question },
      });

      if (error) throw error;

      if (data?.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      setAnswer(data.answer);
    } catch (error) {
      console.error("Error asking AI:", error);
      toast({
        title: "Error",
        description: "Failed to get answer from AI",
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
        <div className="max-w-3xl mx-auto">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 mb-4">
              <Sparkles className="h-8 w-8 text-primary animate-pulse" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                AI Doubt Solver
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Ask questions about books, chapters, or literary concepts
            </p>
          </div>

          <Card className="shadow-[var(--shadow-book)] mb-6">
            <CardHeader>
              <CardTitle>Ask Your Question</CardTitle>
              <CardDescription>
                Our AI assistant is here to help with any book-related questions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="e.g., What are the main themes in 'To Kill a Mockingbird'?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <Button
                onClick={handleAsk}
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary to-accent"
              >
                {loading ? (
                  <>Thinking...</>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Ask AI
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {answer && (
            <Card className="shadow-[var(--shadow-book)] animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI Answer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                  {answer}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
