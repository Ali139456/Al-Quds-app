import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { SavedAddress } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useAddress } from '@/contexts/AddressContext';
import {
  DELIVERY_ZONE_OUT_MESSAGE,
  DELIVERY_ZONE_REQUIRED_MESSAGE,
  DELIVERY_ZONE_TITLE,
  type DeliveryZoneStatus,
  isAddressInDeliveryZone,
  isInRawalpindi,
} from '@/constants/location';
import { reverseGeocode, geocodeAddress } from '@/services/googleGeocoding';
import { getPakPhoneError, normalizePakPhone } from '@/utils/phone';
import { getDeliverySession, setDeliverySession } from '@/utils/storage';
import { toast } from '@/contexts/ToastContext';

const DEFAULT_CITY = 'Rawalpindi';

export function formatDeliveryLine(
  addressLine: string,
  streetNumber?: string,
  instructions?: string
): string {
  const parts = [streetNumber?.trim(), addressLine.trim()].filter(Boolean);
  const base = parts.join(', ');
  const note = instructions?.trim();
  return note ? `${base} | Note: ${note}` : base;
}

type DeliveryContextType = {
  customerName: string;
  customerPhone: string;
  streetNumber: string;
  instructions: string;
  guestAddressLine: string;
  guestLat: number | null;
  guestLng: number | null;
  gettingLocation: boolean;
  searchingLocation: boolean;
  setupComplete: boolean;
  showSetupModal: boolean;
  setCustomerName: (v: string) => void;
  setCustomerPhone: (v: string) => void;
  setStreetNumber: (v: string) => void;
  setInstructions: (v: string) => void;
  setGuestAddressLine: (v: string) => void;
  setShowSetupModal: (v: boolean) => void;
  getPhoneError: () => string | null;
  getDeliveryAddress: () => SavedAddress | null;
  getDeliverySummary: () => string;
  getDeliveryLocationSummary: () => string;
  isDeliveryReady: () => boolean;
  getDeliveryZoneStatus: () => DeliveryZoneStatus;
  validateDelivery: () => boolean;
  saveDeliverySetup: () => Promise<boolean>;
  handleUseCurrentLocation: () => Promise<void>;
  handleSearchLocation: (query: string) => Promise<void>;
  handleMapPress: (lat: number, lng: number) => Promise<void>;
  handleAddressBlur: () => Promise<void>;
  dismissSetupModal: () => void;
  applySavedAddress: (addr: SavedAddress) => Promise<void>;
};

const DeliveryContext = createContext<DeliveryContextType | null>(null);

export function DeliveryProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { selectedAddress, addresses, getCurrentLocation, setSelectedAddress, isLoading: addressesLoading } = useAddress();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [streetNumber, setStreetNumber] = useState('');
  const [instructions, setInstructions] = useState('');
  const [guestAddressLine, setGuestAddressLine] = useState('');
  const [guestLat, setGuestLat] = useState<number | null>(null);
  const [guestLng, setGuestLng] = useState<number | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const openedPickerOnLaunch = useRef(false);

  useEffect(() => {
    (async () => {
      const saved = await getDeliverySession();
      if (saved) {
        setCustomerName(saved.customerName);
        setCustomerPhone(saved.customerPhone);
        setStreetNumber(saved.streetNumber);
        setInstructions(saved.instructions);
        setGuestAddressLine(saved.guestAddressLine);
        setGuestLat(saved.guestLat);
        setGuestLng(saved.guestLng);
        setSetupComplete(saved.setupComplete);
      }
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (user?.name && !customerName) setCustomerName(user.name);
    if (user?.phone && !customerPhone) setCustomerPhone(user.phone);
  }, [user?.id, hydrated]);

  // Show address picker on launch only when delivery is not set yet.
  useEffect(() => {
    if (!hydrated || addressesLoading || openedPickerOnLaunch.current) return;
    openedPickerOnLaunch.current = true;
    const hasSavedDelivery =
      !!user &&
      !!selectedAddress &&
      isAddressInDeliveryZone(selectedAddress);
    if (!hasSavedDelivery && !setupComplete) {
      setShowSetupModal(true);
    }
  }, [hydrated, addressesLoading, user, selectedAddress, setupComplete]);

  useEffect(() => {
    if (!selectedAddress) return;
    if (selectedAddress.streetNumber) setStreetNumber(selectedAddress.streetNumber);
    if (selectedAddress.instructions) setInstructions(selectedAddress.instructions);
  }, [selectedAddress?.id]);

  // Keep map/search display in sync with the chosen saved address (not device GPS).
  useEffect(() => {
    if (!user || !selectedAddress) return;
    const line = selectedAddress.area
      ? `${selectedAddress.area}, ${selectedAddress.addressLine}`
      : selectedAddress.addressLine;
    setGuestAddressLine(line);
    setGuestLat(selectedAddress.latitude);
    setGuestLng(selectedAddress.longitude);
  }, [user?.id, selectedAddress?.id]);

  const persistSession = useCallback(
    async (complete: boolean) => {
      await setDeliverySession({
        customerName,
        customerPhone,
        streetNumber,
        instructions,
        guestAddressLine,
        guestLat,
        guestLng,
        setupComplete: complete,
      });
      setSetupComplete(complete);
    },
    [customerName, customerPhone, streetNumber, instructions, guestAddressLine, guestLat, guestLng]
  );

  const getPhoneError = useCallback(() => getPakPhoneError(customerPhone), [customerPhone]);

  const buildGuestAddress = useCallback((): SavedAddress | null => {
    if (guestLat === null || guestLng === null || !isInRawalpindi(guestLat, guestLng)) {
      return null;
    }
    const line = guestAddressLine.trim() || 'Delivery location';
    return {
      id: 'guest',
      userId: 'guest',
      label: 'Delivery',
      addressLine: formatDeliveryLine(line, streetNumber, instructions),
      streetNumber: streetNumber.trim() || undefined,
      instructions: instructions.trim() || undefined,
      city: DEFAULT_CITY,
      latitude: guestLat,
      longitude: guestLng,
    };
  }, [guestAddressLine, guestLat, guestLng, streetNumber, instructions]);

  const buildUserAddress = useCallback((): SavedAddress | null => {
    if (!selectedAddress) return null;
    if (!isAddressInDeliveryZone(selectedAddress)) return null;
    return {
      ...selectedAddress,
      addressLine: formatDeliveryLine(
        selectedAddress.area
          ? `${selectedAddress.area}, ${selectedAddress.addressLine}`
          : selectedAddress.addressLine,
        streetNumber || selectedAddress.streetNumber,
        instructions || selectedAddress.instructions
      ),
      streetNumber: streetNumber.trim() || selectedAddress.streetNumber,
      instructions: instructions.trim() || selectedAddress.instructions,
    };
  }, [selectedAddress, streetNumber, instructions]);

  const getDeliveryAddress = useCallback((): SavedAddress | null => {
    let address: SavedAddress | null = null;
    if (user && selectedAddress) {
      address = buildUserAddress();
    } else if (guestLat !== null && guestLng !== null) {
      address = buildGuestAddress();
    } else {
      address = buildGuestAddress();
    }
    if (address && !isAddressInDeliveryZone(address)) return null;
    return address;
  }, [guestLat, guestLng, user, selectedAddress, buildUserAddress, buildGuestAddress]);

  const getDeliveryLocationSummary = useCallback((): string => {
    if (user && selectedAddress) {
      const line = selectedAddress.area
        ? `${selectedAddress.area}, ${selectedAddress.addressLine}`
        : selectedAddress.addressLine;
      return formatDeliveryLine(line, streetNumber || selectedAddress.streetNumber);
    }
    if (guestLat !== null && guestLng !== null) {
      const line = guestAddressLine.trim() || 'Delivery location';
      return formatDeliveryLine(line, streetNumber);
    }
    return 'Set delivery address';
  }, [guestLat, guestLng, guestAddressLine, streetNumber, user, selectedAddress]);

  const getDeliverySummary = useCallback((): string => {
    const addr = getDeliveryAddress();
    if (!addr) return 'Set delivery address';
    return addr.addressLine;
  }, [getDeliveryAddress]);

  const isDeliveryReady = useCallback((): boolean => {
    return getDeliveryAddress() !== null;
  }, [getDeliveryAddress]);

  const getDeliveryZoneStatus = useCallback((): DeliveryZoneStatus => {
    if (user && selectedAddress) {
      return isAddressInDeliveryZone(selectedAddress) ? 'in_zone' : 'out_of_zone';
    }
    const lat = guestLat ?? null;
    const lng = guestLng ?? null;
    if (lat == null || lng == null) return 'not_set';
    return isInRawalpindi(lat, lng) ? 'in_zone' : 'out_of_zone';
  }, [guestLat, guestLng, selectedAddress, user]);

  const applyGeocoded = useCallback((addressLine: string, lat: number, lng: number) => {
    if (!isInRawalpindi(lat, lng)) {
      toast.warning(DELIVERY_ZONE_OUT_MESSAGE, DELIVERY_ZONE_TITLE);
      return false;
    }
    setGuestLat(lat);
    setGuestLng(lng);
    setGuestAddressLine(addressLine);
    return true;
  }, []);

  const handleUseCurrentLocation = useCallback(async () => {
    setGettingLocation(true);
    const coords = await getCurrentLocation();
    if (!coords) {
      setGettingLocation(false);
      toast.error(
        'Could not get location. Allow location access in your browser or device settings.',
        'Location'
      );
      return;
    }
    if (!isInRawalpindi(coords.lat, coords.lng)) {
      setGettingLocation(false);
      toast.warning(DELIVERY_ZONE_OUT_MESSAGE, DELIVERY_ZONE_TITLE);
      return;
    }
    const geocoded = await reverseGeocode(coords.lat, coords.lng);
    setGettingLocation(false);
    const label = geocoded?.addressLine || geocoded?.formattedAddress || 'Current location';
    applyGeocoded(label, coords.lat, coords.lng);
  }, [getCurrentLocation, applyGeocoded]);

  const handleSearchLocation = useCallback(
    async (query: string) => {
      const q = query.trim();
      if (!q) {
        toast.warning('Enter an area or street to search.', 'Search');
        return;
      }
      setSearchingLocation(true);
      const geocoded = await geocodeAddress(q);
      setSearchingLocation(false);
      if (!geocoded) {
        toast.warning('Location not found. Try e.g. Saddar, Chaklala, Commercial Market.', 'Not found');
        return;
      }
      setGuestAddressLine(geocoded.addressLine || geocoded.formattedAddress);
      applyGeocoded(geocoded.addressLine || geocoded.formattedAddress, geocoded.lat, geocoded.lng);
    },
    [applyGeocoded]
  );

  const handleAddressBlur = useCallback(async () => {
    if (user || !guestAddressLine.trim() || (guestLat !== null && guestLng !== null)) return;
    const geocoded = await geocodeAddress(guestAddressLine);
    if (geocoded) {
      applyGeocoded(geocoded.addressLine || geocoded.formattedAddress, geocoded.lat, geocoded.lng);
    }
  }, [user, guestAddressLine, guestLat, guestLng, applyGeocoded]);

  const handleMapPress = useCallback(
    async (lat: number, lng: number) => {
      if (!isInRawalpindi(lat, lng)) {
        toast.warning(DELIVERY_ZONE_OUT_MESSAGE, DELIVERY_ZONE_TITLE);
        return;
      }
      setGuestLat(lat);
      setGuestLng(lng);
      const geocoded = await reverseGeocode(lat, lng);
      if (geocoded) {
        setGuestAddressLine(geocoded.addressLine || geocoded.formattedAddress);
      } else {
        setGuestAddressLine('Selected location');
      }
    },
    []
  );

  const validateLocationSetup = useCallback((): boolean => {
    if (!buildGuestAddress()) {
      toast.warning('Pick your delivery point on the map.', 'Location required');
      return false;
    }
    return true;
  }, [buildGuestAddress]);

  const validateDelivery = useCallback((): boolean => {
    if (!customerName.trim()) {
      toast.warning('Please enter your name.', 'Required');
      return false;
    }
    const phoneErr = getPakPhoneError(customerPhone);
    if (phoneErr) {
      toast.warning(phoneErr, 'Invalid number');
      return false;
    }
    if (!streetNumber.trim()) {
      const hasSavedDetail =
        selectedAddress?.streetNumber?.trim() ||
        selectedAddress?.addressLine?.trim() ||
        guestAddressLine.trim();
      if (!hasSavedDetail) {
        toast.warning('Please enter your house / street number or full address.', 'Required');
        return false;
      }
    }
    const zoneStatus = getDeliveryZoneStatus();
    if (zoneStatus === 'out_of_zone') {
      toast.warning(DELIVERY_ZONE_OUT_MESSAGE, DELIVERY_ZONE_TITLE);
      return false;
    }
    const address = getDeliveryAddress();
    if (!address) {
      if (user && addresses.length === 0) {
        toast.warning(DELIVERY_ZONE_REQUIRED_MESSAGE, 'Address required');
      } else if (user) {
        toast.warning(DELIVERY_ZONE_REQUIRED_MESSAGE, 'Address required');
      } else {
        toast.warning(DELIVERY_ZONE_REQUIRED_MESSAGE, 'Delivery details');
      }
      return false;
    }
    if (!isAddressInDeliveryZone(address)) {
      toast.warning(DELIVERY_ZONE_OUT_MESSAGE, DELIVERY_ZONE_TITLE);
      return false;
    }
    return true;
  }, [customerName, customerPhone, streetNumber, getDeliveryAddress, getDeliveryZoneStatus, user, addresses.length]);

  const saveDeliverySetup = useCallback(async (): Promise<boolean> => {
    if (!validateLocationSetup()) return false;
    if (user && selectedAddress) {
      await setSelectedAddress(null);
    }
    await persistSession(true);
    setShowSetupModal(false);
    toast.success('Delivery location saved.', 'Ready to order');
    return true;
  }, [validateLocationSetup, persistSession, user, selectedAddress, setSelectedAddress]);

  const dismissSetupModal = useCallback(() => {
    if (isDeliveryReady()) {
      void persistSession(true);
    }
    setShowSetupModal(false);
  }, [isDeliveryReady, persistSession]);

  const applySavedAddress = useCallback(
    async (addr: SavedAddress) => {
      if (!isAddressInDeliveryZone(addr)) {
        toast.warning(DELIVERY_ZONE_OUT_MESSAGE, DELIVERY_ZONE_TITLE);
        return;
      }
      await setSelectedAddress(addr.id);
      const line = addr.area ? `${addr.area}, ${addr.addressLine}` : addr.addressLine;
      const sn = addr.streetNumber?.trim() || streetNumber;
      const inst = addr.instructions?.trim() || instructions;
      setGuestLat(addr.latitude);
      setGuestLng(addr.longitude);
      setGuestAddressLine(line);
      if (addr.streetNumber) setStreetNumber(addr.streetNumber);
      if (addr.instructions) setInstructions(addr.instructions);
      await setDeliverySession({
        customerName,
        customerPhone,
        streetNumber: sn,
        instructions: inst,
        guestAddressLine: line,
        guestLat: addr.latitude,
        guestLng: addr.longitude,
        setupComplete: true,
      });
      setSetupComplete(true);
      setShowSetupModal(false);
      toast.success(`Delivering to ${addr.label}`, 'Address selected');
    },
    [setSelectedAddress, customerName, customerPhone, streetNumber, instructions]
  );

  const value = useMemo(
    () => ({
      customerName,
      customerPhone,
      streetNumber,
      instructions,
      guestAddressLine,
      guestLat,
      guestLng,
      gettingLocation,
      searchingLocation,
      setupComplete,
      showSetupModal,
      setCustomerName,
      setCustomerPhone,
      setStreetNumber,
      setInstructions,
      setGuestAddressLine,
      setShowSetupModal,
      getPhoneError,
      getDeliveryAddress,
      getDeliverySummary,
      getDeliveryLocationSummary,
      isDeliveryReady,
      getDeliveryZoneStatus,
      validateDelivery,
      saveDeliverySetup,
      handleUseCurrentLocation,
      handleSearchLocation,
      handleMapPress,
      handleAddressBlur,
      dismissSetupModal,
      applySavedAddress,
    }),
    [
      customerName,
      customerPhone,
      streetNumber,
      instructions,
      guestAddressLine,
      guestLat,
      guestLng,
      gettingLocation,
      searchingLocation,
      setupComplete,
      showSetupModal,
      getPhoneError,
      getDeliveryAddress,
      getDeliverySummary,
      getDeliveryLocationSummary,
      isDeliveryReady,
      getDeliveryZoneStatus,
      validateDelivery,
      saveDeliverySetup,
      handleUseCurrentLocation,
      handleSearchLocation,
      handleMapPress,
      handleAddressBlur,
      dismissSetupModal,
      applySavedAddress,
    ]
  );

  return <DeliveryContext.Provider value={value}>{children}</DeliveryContext.Provider>;
}

export function useDelivery() {
  const ctx = useContext(DeliveryContext);
  if (!ctx) throw new Error('useDelivery must be used within DeliveryProvider');
  return ctx;
}
