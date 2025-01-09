import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight, LogIn } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import { checkSubscription } from "@/lib/subscription";
import SubscriptionButton from "@/components/SubscriptionButton";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@clerk/nextjs/server";

export default async function Home() {
  try {
    const session = await auth();
    const userId = session.userId;
    const isAuth = !!userId;
    const isPro = await checkSubscription();

    let firstChat = null;
    if (userId) {
      const chatsData = await db.select().from(chats).where(eq(chats.userId, userId));
      if (chatsData.length > 0) {
        firstChat = chatsData[0];
      }
    }

    return (
      <div className="w-screen min-h-screen bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center">
              <h1 className="mr-3 text-5xl font-semibold">Chat with any PDF</h1>
              <UserButton afterSignOutUrl="/" />
            </div>

            <div className="flex mt-2">
              {isAuth && firstChat && (
                <>
                  <Link href={`/chat/${firstChat.id}`}>
                    <Button>
                      Go to Chats <ArrowRight className="ml-2" />
                    </Button>
                  </Link>
                  <div className="ml-3">
                    <SubscriptionButton isPro={isPro} />
                  </div>
                </>
              )}
            </div>

            <p className="max-w-xl mt-1 text-lg text-slate-600">
              Join millions of students, researchers, and professionals to instantly
              answer questions and understand research with AI.
            </p>

            <div className="w-full mt-4">
              {isAuth ? (
                <FileUpload />
              ) : (
                <Link href="/sign-in">
                  <Button>
                    Login to get Started!
                    <LogIn className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error in Home component:", error);
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        <p>Something went wrong. Please try again later.</p>
      </div>
    );
  }
}
