export const LoadingState = () => {
  return (
    <div className="flex flex-col items-center justify-center flex-1 min-h-[500px] w-full animate-in fade-in duration-700">
      <div className="relative flex items-center justify-center size-24">
        {/* Animated Rings */}
        <div className="absolute size-full rounded-full border-4 border-monday-border opacity-20"></div>
        <div className="absolute size-full rounded-full border-t-4 border-monday-blue animate-spin"></div>
        <div className="absolute size-16 rounded-full border-b-4 border-monday-lime-green animate-spin [animation-direction:reverse] [animation-duration:1.5s]"></div>

        {/* Icon in center */}
        <div className="bg-white size-12 rounded-2xl flex items-center justify-center shadow-sm z-10">
          <img
            src="/assets/images/icons/buildings-2-black.svg"
            className="size-6 opacity-80"
            alt="loading"
          />
        </div>
      </div>

      <div className="mt-10 text-center space-y-3">
        <h2 className="text-2xl font-bold text-monday-black tracking-tight">
          Preparing Data
        </h2>
        <div className="flex items-center justify-center gap-1.5">
          <span className="size-2 rounded-full bg-monday-blue animate-bounce [animation-duration:1s]"></span>
          <span className="size-2 rounded-full bg-monday-blue animate-bounce [animation-duration:1s] [animation-delay:0.2s]"></span>
          <span className="size-2 rounded-full bg-monday-blue animate-bounce [animation-duration:1s] [animation-delay:0.4s]"></span>
        </div>
        <p className="text-monday-gray font-medium max-w-[280px] mx-auto leading-relaxed">
          We're gathering all your warehouse information. Please wait a moment.
        </p>
      </div>
    </div>
  );
};

export default LoadingState;
