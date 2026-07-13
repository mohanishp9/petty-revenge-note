const NoteCardSkeleton = () => {
  return (
    <article
      className="relative rounded-sm transition duration-300 ease-out animate-pulse"
      style={{
        background:
          "linear-gradient(170deg, rgba(242,226,176,0.6) 0%, rgba(245,233,200,0.6) 40%, rgba(237,224,176,0.6) 100%)",
        padding: "1.5rem",
        border: "1px solid rgba(120,80,20,0.1)",
        breakInside: "avoid",
        marginBottom: "1.25rem",
        display: "inline-block",
        width: "100%",
      }}
    >
      <div
        className="absolute bottom-0 left-11 top-0 w-px"
        style={{ background: "rgba(180,40,30,0.15)" }}
      />

      <div className="mb-4 flex items-center gap-3 pl-4">
        {/* Emoji Placeholder */}
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-sm"
          style={{ background: "rgba(120,80,20,0.1)" }}
        />
        <div className="min-w-0 flex-1 space-y-2">
          {/* Username Placeholder */}
          <div className="h-3 w-24 rounded" style={{ background: "rgba(120,80,20,0.15)" }} />
          {/* Date Placeholder */}
          <div className="h-2 w-16 rounded" style={{ background: "rgba(120,80,20,0.1)" }} />
        </div>
      </div>

      {/* Subject Placeholder */}
      <div className="mb-4 pl-4 space-y-2">
        <div className="h-5 w-3/4 rounded" style={{ background: "rgba(120,80,20,0.15)" }} />
      </div>

      {/* Content Placeholder */}
      <div className="mb-6 pl-4 pr-2 space-y-2">
        <div className="h-3 w-full rounded" style={{ background: "rgba(120,80,20,0.1)" }} />
        <div className="h-3 w-full rounded" style={{ background: "rgba(120,80,20,0.1)" }} />
        <div className="h-3 w-4/5 rounded" style={{ background: "rgba(120,80,20,0.1)" }} />
      </div>

      {/* Reaction Summary Placeholder */}
      <div
        className="mb-4 pl-4 pb-3"
        style={{ borderBottom: "1px solid rgba(100,60,10,0.1)" }}
      >
        <div className="h-2 w-32 rounded" style={{ background: "rgba(120,80,20,0.15)" }} />
      </div>

      {/* Action Buttons Placeholder */}
      <div className="grid grid-cols-4 gap-2 pl-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-center justify-center gap-2 rounded-sm px-3 py-2"
            style={{ border: "1px solid rgba(100,60,10,0.1)" }}
          >
            <div className="h-4 w-4 rounded-full" style={{ background: "rgba(120,80,20,0.1)" }} />
            <div className="h-2 w-4 rounded" style={{ background: "rgba(120,80,20,0.1)" }} />
          </div>
        ))}
      </div>

      {/* Total Reactions Placeholder */}
      <div className="mt-4 pl-4">
        <div className="h-2 w-20 rounded" style={{ background: "rgba(120,80,20,0.1)" }} />
      </div>
    </article>
  );
};

export default NoteCardSkeleton;
