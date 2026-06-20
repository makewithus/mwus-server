import { SplitLayout, AuthWrapper } from "@/components/auth/hero";
import { EmployeeLoginForm } from "@/components/auth/login-form";

export default function EmployeeLoginPage() {
  return (
    <SplitLayout>
      <AuthWrapper>
        <EmployeeLoginForm />
      </AuthWrapper>
    </SplitLayout>
  );
}
