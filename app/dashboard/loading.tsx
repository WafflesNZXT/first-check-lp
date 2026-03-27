export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#fcfcfc] p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto animate-pulse space-y-6">
        <div className="h-8 w-56 rounded-xl bg-gray-200" />
        <div className="h-40 rounded-3xl bg-white border border-gray-100" />
        <div className="space-y-3">
          <div className="h-5 w-32 rounded bg-gray-200" />
          <div className="h-28 rounded-3xl bg-white border border-gray-100" />
          <div className="h-28 rounded-3xl bg-white border border-gray-100" />
        </div>
      </div>
    </div>
  )
}
