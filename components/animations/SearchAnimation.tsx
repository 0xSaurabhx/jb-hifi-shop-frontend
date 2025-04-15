"use client";

const SearchAnimation = ({ isSearching }: { isSearching: boolean }) => {
  if (!isSearching) return null;

  return (
    <div className="absolute inset-0 backdrop-blur-sm bg-white/30">
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative">
          {/* Ripple effect */}
          <div className="absolute -inset-4 animate-ping rounded-full bg-yellow-300 opacity-75"></div>
          <div className="absolute -inset-4 animate-pulse rounded-full bg-yellow-400 opacity-50"></div>
          {/* Search icon */}
          <svg
            className="h-8 w-8 animate-bounce text-black"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default SearchAnimation;
