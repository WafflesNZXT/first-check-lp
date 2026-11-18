export default function AuditExample() {
  return (
    <section aria-labelledby="audit-example-title" className="mx-auto max-w-5xl px-5 pb-20">
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 sm:p-10">
        <h2 id="audit-example-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">What Audo found on its own site</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          In a quick audit of useaudo.com, Audo suggested testing the main button copy so it better reflects the free audit offer. “Get Free Score” describes the score, but leaves out the suggested fixes visitors also receive.
        </p>
        <dl className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-5">
            <dt className="text-xs font-medium text-slate-600">Button on the audited page</dt>
            <dd className="mt-2 text-base font-semibold text-slate-900">Get Free Score</dd>
          </div>
          <div className="rounded-xl bg-blue-50 p-5">
            <dt className="text-xs font-medium text-blue-700">Rewrite to test</dt>
            <dd className="mt-2 text-base font-semibold text-slate-900">Get a free audit</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
