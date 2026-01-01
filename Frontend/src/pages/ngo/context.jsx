import { createContext, useContext, useMemo, useState, useEffect } from "react";
import {
  initialCamps,
  initialSlots,
  initialRegistrations,
} from "./constants";
import {
  getMyCamps,
  createCamp as apiCreateCamp,
  updateCamp as apiUpdateCamp,
  deleteCamp as apiDeleteCamp,
  createSlot as apiCreateSlot,
  getCampSlots as apiGetCampSlots,
  updateSlot as apiUpdateSlot,
  deleteSlot as apiDeleteSlot,
} from "../../services/ngoApi";

const NgoDataContext = createContext(null);

export function NgoDataProvider({ children }) {
  const [camps, setCamps] = useState(initialCamps);
  const [slots, setSlots] = useState(initialSlots);
  const [registrations, setRegistrations] = useState(initialRegistrations);
  const [selectedCampId, setSelectedCampId] = useState(
    initialCamps[0]?._id ?? ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch camps from API on mount when token is available
  useEffect(() => {
    const fetchCamps = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("No token found, skipping camps fetch");
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await getMyCamps();
        if (response.data.success) {
          const campsData = response.data.data || [];
          setCamps(campsData);
          
          // Select first camp and fetch its slots
          if (campsData.length > 0) {
            const firstCampId = campsData[0]._id;
            setSelectedCampId(firstCampId);
            
            // Fetch slots for the first camp
            try {
              const slotsResponse = await apiGetCampSlots(firstCampId);
              if (slotsResponse.data.success) {
                setSlots(slotsResponse.data.data || []);
              }
            } catch (slotErr) {
              console.error("Failed to fetch slots for first camp:", slotErr);
              setSlots([]);
            }
          } else {
            setSlots([]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch camps:", err);
        setError(err.response?.data?.message || "Failed to fetch camps");
      } finally {
        setLoading(false);
      }
    };

    fetchCamps();
  }, []);

  // Fetch slots when selected camp changes
  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedCampId) return;

      try {
        setLoading(true);
        setError(null);
        const response = await apiGetCampSlots(selectedCampId);
        if (response.data.success) {
          const slotsData = response.data.data || [];
          console.log("[FETCH_SLOTS] Slots fetched for camp:", selectedCampId, slotsData);
          setSlots(slotsData);
        }
      } catch (err) {
        console.error("Failed to fetch slots:", err);
        setError(err.response?.data?.message || "Failed to fetch slots");
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [selectedCampId]);

  const stats = useMemo(() => {
    const totalCamps = camps.length;
    const active = camps.filter((camp) => camp.status === "active").length;
    const upcoming = camps.filter(
      (camp) => new Date(camp.startDate) > new Date()
    ).length;
    const completed = camps.filter((camp) => camp.status === "completed").length;
    const totalSlots = slots.length;
    const totalRegistered = registrations.length;
    const expectedDonors = camps.reduce(
      (acc, camp) => acc + (Number(camp.expectedDonors) || 0),
      0
    );
    const actualDonors = registrations.length;

    return {
      totalCamps,
      active,
      upcoming,
      completed,
      totalSlots,
      totalRegistered,
      expectedDonors,
      actualDonors,
    };
  }, [camps, slots, registrations]);

  const expectedActualRatio = stats.expectedDonors
    ? Math.min(
        100,
        Math.round((stats.actualDonors / stats.expectedDonors) * 100)
      )
    : 0;

  const campLookup = useMemo(() => {
    return camps.reduce((acc, camp) => {
      acc[camp._id] = camp;
      return acc;
    }, {});
  }, [camps]);

  const setCampFocus = (campId) => {
    setSelectedCampId(campId);
  };

  const createCamp = async (payload) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiCreateCamp({
        campName: payload.campName,
        description: payload.description,
        location: payload.location,
        city: payload.city,
        state: payload.state,
        pincode: payload.pincode,
        startDate: payload.startDate,
        endDate: payload.endDate,
        contactPersonName: payload.contactPersonName,
        contactMobile: payload.contactMobile,
        expectedDonors: Number(payload.expectedDonors || 0),
      });

      if (response.data.success) {
        const newCamp = response.data.data;
        setCamps((prev) => [newCamp, ...prev]);
        setSelectedCampId(newCamp._id);
        return newCamp;
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to create camp";
      const errorDetails = err.response?.data?.errors || [];
      
      console.error("Create camp error:", errorMsg);
      console.error("Validation errors:", errorDetails);
      
      // Combine error message with details
      const fullErrorMsg = errorDetails.length > 0 
        ? `${errorMsg}: ${errorDetails.join(", ")}`
        : errorMsg;
      
      setError(fullErrorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateCamp = async (campId, updates) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiUpdateCamp(campId, updates);

      if (response.data.success) {
        setCamps((prev) =>
          prev.map((camp) =>
            camp._id === campId ? { ...camp, ...response.data.data } : camp
          )
        );
        return response.data.data;
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to update camp";
      setError(errorMsg);
      console.error("Update camp error:", errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteCamp = async (campId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiDeleteCamp(campId);

      if (response.data.success) {
        setCamps((prev) => prev.filter((camp) => camp._id !== campId));
        setSlots((prev) => prev.filter((slot) => slot.campId !== campId));
        setRegistrations((prev) =>
          prev.filter((registration) => registration.campId !== campId)
        );

        setSelectedCampId((current) => {
          if (current === campId) {
            const remaining = camps.filter((camp) => camp._id !== campId);
            return remaining[0]?._id ?? "";
          }
          return current;
        });
        return true;
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to delete camp";
      setError(errorMsg);
      console.error("Delete camp error:", errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const createSlot = async (payload) => {
    try {
      setLoading(true);
      setError(null);

      if (!payload.campId) {
        setError("Camp ID is required");
        return null;
      }

      const response = await apiCreateSlot({
        campId: payload.campId,
        slotTime: payload.slotTime,
        maxDonors: Number(payload.maxDonors || 0),
      });

      if (response.data.success) {
        const newSlot = response.data.data;
        console.log("[CREATE_SLOT] New slot created:", newSlot);
        setSlots((prev) => [newSlot, ...prev]);
        setCamps((prev) =>
          prev.map((camp) =>
            camp._id === payload.campId
              ? { ...camp, totalSlots: camp.totalSlots + 1 }
              : camp
          )
        );
        return newSlot;
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to create slot";
      const errorDetails = err.response?.data?.errors || [];
      
      console.error("Create slot error:", errorMsg);
      console.error("Validation errors:", errorDetails);
      
      const fullErrorMsg = errorDetails.length > 0 
        ? `${errorMsg}: ${errorDetails.join(", ")}`
        : errorMsg;
      
      setError(fullErrorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const registerDonor = (payload) => {
    const { campId, slotId, mobileNumber } = payload;
    const slot = slots.find((item) => item._id === slotId);
    if (!slot) {
      return { ok: false, error: "Slot not found." };
    }
    if (slot.bookedCount >= slot.maxDonors) {
      return { ok: false, error: "Selected slot is already full." };
    }

    const isDuplicate = registrations.some(
      (registration) =>
        registration.campId === campId &&
        registration.mobileNumber.trim() === mobileNumber.trim()
    );

    if (isDuplicate) {
      return { ok: false, error: "Duplicate registration detected for this camp." };
    }

    const nextRegistration = {
      _id: crypto.randomUUID(),
      ...payload,
    };

    setRegistrations((prev) => [nextRegistration, ...prev]);
    setSlots((prev) =>
      prev.map((item) =>
        item._id === slotId
          ? { ...item, bookedCount: Math.min(item.bookedCount + 1, item.maxDonors) }
          : item
      )
    );
    setCamps((prev) =>
      prev.map((camp) =>
        camp._id === campId
          ? { ...camp, registeredDonors: (camp.registeredDonors || 0) + 1 }
          : camp
      )
    );

    return { ok: true };
  };

  const value = {
    camps,
    slots,
    registrations,
    stats,
    expectedActualRatio,
    campLookup,
    selectedCampId,
    setSelectedCampId: setCampFocus,
    createCamp,
    createSlot,
    updateCamp,
    deleteCamp,
    registerDonor,
    setRegistrations,
    loading,
    error,
  };

  return (
    <NgoDataContext.Provider value={value}>{children}</NgoDataContext.Provider>
  );
}

export const useNgoData = () => {
  const context = useContext(NgoDataContext);
  if (!context) {
    throw new Error("useNgoData must be used within NgoDataProvider");
  }
  return context;
};
