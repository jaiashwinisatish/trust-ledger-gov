import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  MessageSquare, 
  X, 
  Send, 
  Bot, 
  User as UserIcon, 
  Loader2,
  Search,
  FileQuestion,
  HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatBot() {
  const { user, role } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || !user) return;

    const newMessages: Message[] = [...messages, { role: "user", content }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-chatbot", {
        body: { 
          messages: newMessages,
          userId: user.id,
          role: role
        }
      });

      if (error) throw error;

      setMessages([...newMessages, { role: "assistant", content: data.content }]);
    } catch (err: any) {
      console.error("ChatBot Error:", err);
      if (err.message?.includes("404")) {
        toast.error("AI Service not deployed. Please run 'supabase functions deploy ai-chatbot'");
      } else if (err.message?.includes("500")) {
        toast.error("AI configuration error. Please check your LOVABLE_API_KEY in Supabase.");
      } else {
        toast.error("Assistant is currently unavailable. Check your connection or deployment.");
      }
    } finally {

      setLoading(false);
    }
  };

  const quickActions = [
    { label: "My Documents", icon: Search, query: "Show me my recent documents." },
    { label: "Status Update", icon: FileQuestion, query: "What is the status of my latest upload?" },
    { label: "How to Upload", icon: HelpCircle, query: "How do I upload a new document?" },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <Card className="w-[380px] h-[520px] mb-4 shadow-2xl flex flex-col border-primary/20 animate-in slide-in-from-bottom-5 duration-300">
          <CardHeader className="bg-primary text-primary-foreground py-3 flex flex-row items-center justify-between rounded-t-lg">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Bot className="h-5 w-5" />
              GovDoc AI Assistant
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-primary-foreground hover:bg-black/10 h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {messages.length === 0 && (
              <div className="text-center py-8 space-y-4">
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Bot className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold">How can I help you today?</p>
                  <p className="text-xs text-muted-foreground mt-1">I can help you search, check status, or guide you through procedures.</p>
                </div>
                <div className="grid grid-cols-1 gap-2 pt-2">
                  {quickActions.map((action) => (
                    <Button 
                      key={action.label} 
                      variant="outline" 
                      size="sm" 
                      className="justify-start text-[11px] h-8 border-dashed"
                      onClick={() => sendMessage(action.query)}
                    >
                      <action.icon className="h-3 w-3 mr-2 text-primary" />
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                  msg.role === "user" ? "bg-muted" : "bg-primary/10"
                )}>
                  {msg.role === "user" ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4 text-primary" />}
                </div>
                <div className={cn(
                  "text-sm p-3 rounded-2xl max-w-[80%]",
                  msg.role === "user" ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted rounded-tl-none"
                )}>
                  {msg.content}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted p-3 rounded-2xl rounded-tl-none">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="p-3 border-t">
            <form 
              onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
              className="flex w-full gap-2"
            >
              <Input 
                placeholder="Ask me anything..." 
                value={input} 
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                className="bg-muted border-none text-xs"
              />
              <Button type="submit" size="icon" disabled={loading || !input.trim()} className="shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}

      {/* Toggle Button */}
      <Button 
        onClick={() => setIsOpen(!isOpen)} 
        className={cn(
          "h-14 w-14 rounded-full shadow-lg transition-all duration-300 hover:scale-110",
          isOpen ? "rotate-90" : "rotate-0"
        )}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </Button>
    </div>
  );
}
