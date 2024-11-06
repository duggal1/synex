
import { Button } from "@/components/ui/button";
import Link from 'next/link';

const NotFound = () => {
    return (
        <main className="relative flex flex-col justify-center items-center px-4">


            <div className="flex flex-col justify-center items-center mx-auto h-screen">

                <div className="flex flex-col justify-center items-center h-full">
                    <span className="bg-gradient-to-br from-violet-400 to-purple-600 px-3.5 py-1 rounded-md font-medium text-neutral-50 text-sm not-found">
                        404
                    </span>
                    <h1 className="mt-5 font-bold text-3xl text-neutral-50 md:text-5xl">
                        Not Found
                    </h1>
                    <p className="mx-auto mt-5 max-w-xl font-medium text-base text-center text-neutral-400">
                        The page you are looking for does not exist. <br /> But don&apos;t worry, we&apos;ve got you covered. You can{" "}
                        <Link href="/resources/help" className="text-foreground">
                            contact us
                        </Link>
                        .
                    </p>
                    <Link href="/">
                        <Button className="mt-8">
                            Back to homepage
                        </Button>
                    </Link>
                </div>

            </div>

        

        </main>
    )
}

export default NotFound