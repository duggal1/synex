import { Button } from "@/components/ui/button";
import Link from "next/link";
//
const NotFound = () => {
  return (
    <main className="relative flex flex-col justify-center items-center h-screen px-4 bg-gradient-to-br from-blue-400 to-purple-500">
      <div className="flex flex-col justify-center items-center max-w-xl mx-auto text-center">
        <span className="px-3.5 py-1 mb-5 font-medium text-xl text-white bg-black/20 rounded-md">
          404
        </span>
        <h1 className="mt-2 text-6xl lg:text-9xl font-bold text-white md:text-8xl tracking-tight">
          Page Not Found
        </h1>
        <p className="mt-5 text-base font-medium text-neutral-300 ">
          The page you are looking for does not exist. But don&apos;t worry, you can{" "}
          <Link href="/dashboard" className="text-white underline hover:to-blue-800 hover:underline">
            go to the dashboard
          </Link>{" "}
          or{" "}
          <Link href="/blogs" className="text-white underline ">
            check out our blogs.
          </Link>
          <span className=" -mt-8 ">
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