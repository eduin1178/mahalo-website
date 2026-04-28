import { SignIn } from "@clerk/nextjs";

export default function AdminSignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-mahalo-gradient-soft p-6">
      <SignIn
        path="/admin/sign-in"
        routing="path"
        signUpUrl="/admin/sign-in"
        forceRedirectUrl="/admin"
      />
    </main>
  );
}
