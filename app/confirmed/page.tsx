export default function Confirmed() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="h-20 w-20 bg-green-500/20 border border-green-500/50 rounded-full flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-4xl font-bold mb-4">Email Verified!</h1>
      <p className="text-gray-400 max-w-sm">
        Thanks for joining the waitlist. We've officially added your project to the queue.
      </p>
      <a href="/" className="mt-8 text-blue-400 hover:underline text-sm">Return Home</a>
    </main>
  );
}