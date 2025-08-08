"use client";

import { useConvexAuth } from "convex/react";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Loader from "@/components/Loader";

export default function Home() {
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/signin");
    }
    router.push("/funnel");
  }, [router]);

  return (
    <>
      <div className="flex justify-center items-center h-screen">
        <Loader />
      </div>
    </>
  );
}

// function SignOutButton() {
//   const { isAuthenticated } = useConvexAuth();
//   const { signOut } = useAuthActions();
//   const router = useRouter();
//   return (
//     <>
//       {isAuthenticated && (
//         <button
//           className="bg-slate-200 dark:bg-slate-800 text-foreground rounded-md px-2 py-1"
//           onClick={() =>
//             void signOut().then(() => {
//               router.push("/auth/signin");
//             })
//           }
//         >
//           Sign out
//         </button>
//       )}
//     </>
//   );
// }
