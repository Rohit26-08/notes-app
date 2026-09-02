import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f0f13] px-4">
      <div className="mb-8 text-center">
        <div className="text-4xl mb-2">📓</div>
        <h1 className="text-2xl font-bold text-white">My Notes</h1>
        <p className="text-zinc-500 text-sm mt-1">Create your account to get started</p>
      </div>
      <SignUp />
    </div>
  );
}
