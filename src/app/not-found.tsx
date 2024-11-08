import { Button } from "@/components/ui/button";
import Link from "next/link";
//
const NotFound = () => {
  return (
    <main className="relative flex flex-col justify-center items-center bg-gradient-to-br from-blue-400 to-purple-500 px-4 h-screen">
      <div className="flex flex-col justify-center items-center mx-auto max-w-xl text-center">
        <span className="bg-black/20 mb-5 px-3.5 py-1 rounded-md font-medium text-white text-xl">
          404
        </span>
        <h1 className="mt-2 font-bold text-6xl text-white md:text-8xl lg:text-9xl tracking-tight">
          Page Not Found
        </h1>
        <p className="mt-5 font-medium text-base text-neutral-300">
          The page you are looking for does not exist. But don&apos;t worry, you can{" "}
          <Link href="/dashboard" className="hover:to-blue-800 text-white underline hover:underline">
            go to the dashboard
          </Link>{" "}
          or{" "}
          <Link href="/blogs" className="text-white underline">
            check out our blogs.
          </Link>
          <span className="-mt-8">
            ✨
          </span>
          
        </p>
        <Link href="/" className="block mt-8">
          <Button>Back to Homepage</Button>
        </Link>
      </div>
    </main>
  );
};

export default NotFound;