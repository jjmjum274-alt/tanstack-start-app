import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({ meta: [{ title: "الدخول | بهار الهند" }] }),
});

function AuthPage() {
  const { lang } = useI18n();
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true); // التبديل بين الواجهتين
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) nav({ to: "/" });
    });
  }, [nav]);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault(); // منع الصفحة من التحديث
    setLoading(true);

    if (isLogin) {
      // عملية تسجيل الدخول
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(lang === "ar" ? "أهلاً بك مرة أخرى!" : "Welcome back!");
        nav({ to: "/" });
      }
    } else {
      // عملية إنشاء حساب جديد
      const { error } = await supabase.auth.signUp({
        email, 
        password,
        options: { data: { full_name: name } },
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(lang === "ar" ? "تم إنشاء الحساب! يمكنك الدخول الآن" : "Account created!");
        setIsLogin(true); // يرجعه لصفحة الدخول بعد النجاح
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 pattern-indian bg-muted/10">
      <Card className="w-full max-w-md p-8 shadow-2xl border-0 bg-background/95 backdrop-blur-md rounded-2xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-5xl">🌶️</div>
          <h1 className="font-display text-3xl font-bold text-primary mb-2">{lang === "ar" ? "بهار الهند" : "Indian Bhar"}</h1>
          <p className="text-muted-foreground">{lang === "ar" ? "مرحباً بك في عالم النكهات الهندية الأصيلة" : "Welcome to authentic Indian flavors"}</p>
        </div>

        {/* أزرار التبديل - هذي اللي كانت تسبب المشكلة والحين فصلناها */}
        <div className="flex bg-muted p-1 rounded-xl mb-8">
          <button 
            type="button" 
            onClick={() => { setIsLogin(true); setEmail(""); setPassword(""); }} 
            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all duration-300 ${isLogin ? "bg-background shadow-md text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            {lang === "ar" ? "تسجيل دخول" : "Sign In"}
          </button>
          <button 
            type="button" 
            onClick={() => { setIsLogin(false); setEmail(""); setPassword(""); }} 
            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all duration-300 ${!isLogin ? "bg-background shadow-md text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            {lang === "ar" ? "حساب جديد" : "Sign Up"}
          </button>
        </div>

        <form onSubmit={handleAction} className="space-y-5">
          {!isLogin && (
            <div className="space-y-2 text-start animate-in fade-in slide-in-from-top-2">
                <Label className="font-bold text-foreground/80">{lang === "ar" ? "الاسم الكامل" : "Full Name"}</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required={!isLogin} className="h-12 bg-muted/30" />
            </div>
          )}
          <div className="space-y-2 text-start">
              <Label className="font-bold text-foreground/80">{lang === "ar" ? "البريد الإلكتروني" : "Email"}</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" className="h-12 text-left bg-muted/30" />
          </div>
          <div className="space-y-2 text-start">
              <Label className="font-bold text-foreground/80">{lang === "ar" ? "كلمة المرور" : "Password"}</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} dir="ltr" className="h-12 text-left bg-muted/30" />
          </div>
          
          <Button type="submit" disabled={loading} className="w-full h-14 bg-primary hover:bg-primary-glow text-base font-bold mt-6 rounded-xl shadow-lg shadow-primary/20">
            {loading ? <Loader2 className="animate-spin" /> : (isLogin ? (lang === "ar" ? "دخول" : "Sign In") : (lang === "ar" ? "إنشاء حساب" : "Create Account"))}
          </Button>
        </form>
      </Card>
    </div>
  );
}