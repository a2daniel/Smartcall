import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">SmartCall</h1>
          <p className="text-muted-foreground mb-8">Healthcare Shift Management System</p>
          
          <div className="space-y-4">
            <Link
              href="/login"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              Sign In
            </Link>
            
            <Link
              href="/signup"
              className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              Sign Up
            </Link>
          </div>

          <div className="mt-8 text-sm text-muted-foreground">
            <p>Role-based access:</p>
            <div className="mt-2 space-y-1">
              <p>👨‍⚕️ Staff - View and accept shifts</p>
              <p>👩‍💼 Manager - Log call-outs and monitor</p>
              <p>🔧 Admin - System management</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
