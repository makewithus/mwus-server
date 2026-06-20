import { SplitLayout, AuthWrapper } from "@/components/auth/hero";
import { AdminLoginForm } from "@/components/auth/login-form";

export default function AdminLoginPage() {
  return (
    <SplitLayout>
      <AuthWrapper>
        <AdminLoginForm />
      </AuthWrapper>
    </SplitLayout>
  );
}
