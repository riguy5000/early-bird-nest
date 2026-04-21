import { useState, useRef, useEffect, useMemo } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { MapPin, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PlaceResult {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  types: string[];
}

export interface PlaceDetails {
  placeId: string;
  formattedAddress: string;
  streetAddress?: string;
  streetNumber?: string;
  streetName?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  geometry?: { lat: number; lng: number } | null;
  types?: string[];
}

interface GooglePlacesAutocompleteProps {
  id?: string;
  label?: string;
  placeholder?: string;
  value?: string;
  required?: boolean;
  error?: string;
  onPlaceSelect: (place: PlaceDetails) => void;
  onInputChange?: (value: string) => void;
  className?: string;
  country?: string;
  // Legacy props (kept for compatibility, ignored)
  types?: string[];
  componentRestrictions?: { country?: string | string[] };
}

export function GooglePlacesAutocomplete({
  id = 'address',
  label = 'Address',
  placeholder = 'Start typing an address...',
  value = '',
  required = false,
  error,
  onPlaceSelect,
  onInputChange,
  className = '',
  country = 'us',
}: GooglePlacesAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [predictions, setPredictions] = useState<PlaceResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // One session token per autocomplete session (until selection) — required for billing-friendly Google Places usage.
  const sessionToken = useMemo(
    () =>
      (typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`),
    // Reset session whenever a place gets confirmed
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedPlace?.placeId],
  );

  // Keep input synced if parent clears it
  useEffect(() => {
    if (value !== inputValue && document.activeElement !== inputRef.current) {
      setInputValue(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const fetchPredictions = async (query: string) => {
    setIsLoading(true);
    setApiError(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('google-places', {
        body: { action: 'autocomplete', input: query, sessionToken, country },
      });
      if (fnErr) throw fnErr;
      if (data?.error) throw new Error(data.error);
      const list: PlaceResult[] = data?.predictions || [];
      setPredictions(list);
      setShowDropdown(true);
    } catch (err: any) {
      console.error('Places autocomplete error', err);
      setApiError(err?.message || 'Failed to fetch suggestions');
      setPredictions([]);
      setShowDropdown(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    setSelectedPlace(null);
    setApiError(null);
    onInputChange?.(newValue);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (newValue.trim().length >= 3) {
        fetchPredictions(newValue.trim());
      } else {
        setPredictions([]);
        setShowDropdown(false);
      }
    }, 280);
  };

  const handlePlaceSelect = async (prediction: PlaceResult) => {
    setShowDropdown(false);
    setIsLoading(true);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('google-places', {
        body: { action: 'details', placeId: prediction.placeId, sessionToken },
      });
      if (fnErr) throw fnErr;
      if (data?.error) throw new Error(data.error);
      const place: PlaceDetails = data?.place;
      if (!place) throw new Error('No place details returned');

      // Display only the clean street line in the input, not the full formatted address.
      const cleanStreet = place.streetAddress || prediction.mainText;
      setInputValue(cleanStreet);
      setSelectedPlace(place);
      onPlaceSelect({ ...place, streetAddress: cleanStreet });
    } catch (err: any) {
      console.error('Place details error', err);
      setApiError(err?.message || 'Failed to fetch address details');
    } finally {
      setIsLoading(false);
    }
  };

  // Click-outside to close
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => () => debounceRef.current && clearTimeout(debounceRef.current), []);

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label htmlFor={id} className="flex items-center gap-1">
          {label}
          {required && <span className="text-destructive">*</span>}
        </Label>
      )}

      <div className="relative">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            ref={inputRef}
            id={id}
            type="text"
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => predictions.length > 0 && setShowDropdown(true)}
            className={`pl-10 pr-10 ${error ? 'border-destructive' : ''} ${
              selectedPlace ? 'border-green-500' : ''
            }`}
            autoComplete="off"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {selectedPlace && !isLoading && <CheckCircle className="h-4 w-4 text-green-500" />}
            {apiError && !isLoading && <AlertCircle className="h-4 w-4 text-destructive" />}
          </div>
        </div>

        {showDropdown && predictions.length > 0 && (
          <Card ref={dropdownRef} className="absolute z-50 w-full mt-1 max-h-64 overflow-auto">
            <CardContent className="p-0">
              {predictions.map((prediction) => (
                <Button
                  key={prediction.placeId}
                  type="button"
                  variant="ghost"
                  className="w-full justify-start h-auto p-3 rounded-none border-b border-border last:border-b-0"
                  onClick={() => handlePlaceSelect(prediction)}
                >
                  <div className="flex items-start space-x-3 text-left">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm">{prediction.mainText}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {prediction.secondaryText}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>
        )}

        {showDropdown && predictions.length === 0 && !isLoading && inputValue.length >= 3 && (
          <Card ref={dropdownRef} className="absolute z-50 w-full mt-1">
            <CardContent className="p-3 text-center text-sm text-muted-foreground">
              No addresses found for "{inputValue}"
            </CardContent>
          </Card>
        )}
      </div>

      {(error || apiError) && (
        <p className="text-destructive text-sm flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error || apiError}
        </p>
      )}
    </div>
  );
}
