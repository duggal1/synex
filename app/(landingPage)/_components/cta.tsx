import { Button } from "@/components/ui/button";
import {RetroGrid} from "./magicui/retro-grid";


const CTA = () => {
  return (
    <div className="z-10 relative mx-auto mt-32 px-4 max-w-6xl">
      <div className="relative flex flex-col justify-center items-center bg-black/40 backdrop-blur-xl border border-white/5 rounded-3xl w-full min-h-[500px] overflow-hidden">
        {/* Background Effects */}
        <div className="z-0 absolute inset-0">
          <RetroGrid
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/20" />

        {/* Content */}
        <div className="z-10 relative flex flex-col items-center gap-8 p-8 text-center">
          <h2 className="bg-clip-text bg-gradient-to-b from-white via-white/80 to-blue-500/80 max-w-4xl font-black text-transparent lg:text-51xl text-4xl md:text-5xl text-center tracking-tight">
            Get started with SynexAI
            <span className="block bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 text-transparent">
              today
            </span>
          </h2>
          
          <p className="max-w-xl font-medium text-neutral-400 text-sm md:text-base">
          Join hundreds of businesses automating invoice management with Synex AI—faster processing, zero errors, lower costs.
          </p>

          <div className="flex sm:flex-row flex-col gap-4 mt-4">
            <Button
              className="bg-gradient-to-r from-blue-600 hover:from-blue-500 to-indigo-600 hover:to-indigo-500 shadow-blue-500/20 shadow-xl px-8 py-6 rounded-2xl font-bold text-white tracking-wide hover:scale-105 transition-all duration-300"
            >
              Start for free
            </Button>
            <Button
              variant="outline"
              className="hover:bg-white/5 px-8 py-6 border-white/10 rounded-2xl font-bold text-white tracking-wide transition-all duration-300"
            >
              Schedule demo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CTA;