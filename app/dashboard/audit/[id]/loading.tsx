export default function AuditDetailLoading() {
  return (
    <div className="min-h-screen bg-[#fcfcfc] p-4 sm:p-6 lg:p-12 xl:p-24">
      <div className="max-w-5xl mx-auto animate-pulse space-y-8">
        <div className="h-4 w-36 rounded bg-gray-200" />
        <div className="space-y-3 text-center">
          <div className="h-12 w-3/4 mx-auto rounded bg-gray-200" />
          <div className="h-5 w-5/6 mx-auto rounded bg-gray-200" />
        </div>
        <div className="h-20 rounded-3xl bg-white border border-gray-100" />
        <div className="h-64 rounded-3xl bg-white border border-gray-100" />
      </div>
    </div>
  )
}
