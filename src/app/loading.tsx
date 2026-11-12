export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 md:px-6" aria-busy="true" aria-label="Loading">
      <div className="skeleton h-10 w-72" />
      <div className="skeleton mt-4 h-5 w-96 max-w-full" />
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-56 rounded-3xl" />)}
      </div>
    </div>
  );
}
