import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Shield, FileText } from "lucide-react";
import type { Enums } from "@/integrations/supabase/types";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<Enums<"app_role">>("citizen");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        toast.success("Welcome back!");
        navigate("/dashboard");
      } else {
        await signUp(email, password, fullName, role);
        toast.success("Account created! Check your email to verify.");
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-10">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-20 w-20 bg-primary flex items-center justify-center">
              <Shield className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl font-serif font-bold tracking-tight text-foreground">
            Trust Ledger
          </h1>
          <p className="text-muted-foreground text-sm font-mono uppercase tracking-widest flex items-center justify-center gap-2">
            <FileText className="h-4 w-4" />
            Secure Digital Access
          </p>
        </div>

        <div className="bg-card border-2 border-border p-8">
          <div className="pb-6">
            <h2 className="text-xl font-bold font-serif">{isLogin ? "Authentication" : "Registration"}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isLogin ? "Provide your credentials to access the ledger." : "Register for a secure portal account."}
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="font-bold uppercase text-xs tracking-wider">Full Name</Label>
                  <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Authorized Name" required className="h-12 border-2 border-border rounded-none focus-visible:border-primary focus-visible:ring-0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role" className="font-bold uppercase text-xs tracking-wider">Designation</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as Enums<"app_role">)}>
                    <SelectTrigger className="h-12 border-2 border-border rounded-none focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-2 border-border rounded-none">
                      <SelectItem value="citizen" className="rounded-none">Citizen</SelectItem>
                      <SelectItem value="officer" className="rounded-none">Officer</SelectItem>
                      <SelectItem value="admin" className="rounded-none">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="font-bold uppercase text-xs tracking-wider">Identity</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@gov.org" required className="h-12 border-2 border-border rounded-none focus-visible:border-primary focus-visible:ring-0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="font-bold uppercase text-xs tracking-wider">Passphrase</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required className="h-12 border-2 border-border rounded-none focus-visible:border-primary focus-visible:ring-0" />
            </div>
            <Button type="submit" className="w-full h-12 rounded-none font-bold uppercase tracking-wider text-sm mt-4" disabled={loading}>
              {loading ? "Verifying..." : isLogin ? "Access Ledger" : "Initialize Account"}
            </Button>
          </form>
          
          <div className="mt-6 pt-6 border-t-2 border-border text-center">
            <button onClick={() => setIsLogin(!isLogin)} className="text-sm font-bold text-primary hover:underline">
              {isLogin ? "Require an account? Register" : "Existing account? Return to Auth"}
            </button>
          </div>
        </div>

        <p className="text-center text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Protected by Next-Gen Cryptography
        </p>
      </div>
    </div>
  );
}
