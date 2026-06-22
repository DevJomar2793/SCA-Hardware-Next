"use client";

import { useCallback, useEffect, useState } from "react";
import { HardwareDirectory } from "@/components/HardwareDirectory";
import { fetchHardwareList } from "@/services/api";
import { Hardware } from "@/types/hardware";
import Swal from "sweetalert2";

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

  useEffect(() => {
    const message = window.sessionStorage.getItem("hardware-delete-toast");
    if (!message) return;

    window.sessionStorage.removeItem("hardware-delete-toast");
    void Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: message,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
  }, []);

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
