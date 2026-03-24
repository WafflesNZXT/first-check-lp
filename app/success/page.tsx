export default function SuccessPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <h1 className="text-3xl font-bold mb-4">Payment Confirmed! 🎉</h1>
      <p className="text-lg text-gray-600 mb-8 max-w-md">
        I'm ready to start your audit. To get your report within 24 hours, please send a quick email:
      </p>
      
      <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg text-left max-w-lg w-full mb-8">
        <p className="font-bold mb-2">Send to: wafi.syed5@gmail.com</p>
        <p className="font-bold mb-2">Subject: Audit URL - [Your Name]</p>
        <ul className="list-disc ml-5 space-y-2 text-sm">
          <li>Your website URL</li>
          <li>Focus areas (SEO, UX, etc.)</li>
          <li>Any specific questions</li>
        </ul>
      </div>

      <a 
        href="mailto:wafi.syed5@gmail.com?subject=My First Check Audit URL"
        className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
      >
        Open Mail App & Reply
      </a>
    </div>
  );
}