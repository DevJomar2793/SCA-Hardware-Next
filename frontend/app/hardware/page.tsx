"use client";

import { useCallback, useEffect, useState } from "react";
import { HardwareDirectory } from "@/components/HardwareDirectory";
import { fetchHardwareList } from "@/services/api";
import { Hardware } from "@/types/hardware";

export default function HardwarePage() {
  const [hardwareItems, setHardwareItems] = useState<Hardware[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHardware = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchHardwareList();
      console.log(`Fetched ${data.length} hardware items from API`);
      setHardwareItems(data);
    } catch (err) {
      console.error("Failed to fetch hardware:", err);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadHardware();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadHardware]);

  return (
    <HardwareDirectory
      hardwareItems={hardwareItems}
      isLoading={isLoading}
      error={error}
      onErrorChange={setError}
      onReload={loadHardware}
    />
  );
}
