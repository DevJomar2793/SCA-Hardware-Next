"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DeploymentPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/employee");
  }, [router]);

  return null;
}
