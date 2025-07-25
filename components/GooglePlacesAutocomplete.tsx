import { useState, useRef, useEffect } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { MapPin, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface PlaceResult {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  types: string[];
}

interface PlaceDetails {
  placeId: string;
  formattedAddress: string;
  name?: string;
  streetNumber?: string;
  streetName?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  geometry?: {
    lat: number;
    lng: number;
  };
  types: string[];
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
  types?: string[]; // e.g., ['establishment', 'geocode']
  componentRestrictions?: {
    country?: string | string[];
  };
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
  types = ['geocode'],
  componentRestrictions = { country: 'us' }
}: GooglePlacesAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [predictions, setPredictions] = useState<PlaceResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Mock Google Places API - In production, this would use the actual Google Places API
  const mockPlacesService = {
    getPlacePredictions: async (query: string): Promise<PlaceResult[]> => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (query.length < 3) return [];
      
      // Mock predictions based on common address patterns
      const mockPredictions: PlaceResult[] = [
        {
          placeId: 'mock_place_1',
          description: `${query} Street, New York, NY, USA`,
          mainText: `${query} Street`,
          secondaryText: 'New York, NY, USA',
          types: ['street_address', 'geocode']
        },
        {
          placeId: 'mock_place_2', 
          description: `${query} Avenue, Los Angeles, CA, USA`,
          mainText: `${query} Avenue`,
          secondaryText: 'Los Angeles, CA, USA',
          types: ['street_address', 'geocode']
        },
        {
          placeId: 'mock_place_3',
          description: `${query} Boulevard, Chicago, IL, USA`,
          mainText: `${query} Boulevard`,
          secondaryText: 'Chicago, IL, USA',
          types: ['street_address', 'geocode']
        }
      ];
      
      return mockPredictions.filter(p => 
        p.description.toLowerCase().includes(query.toLowerCase())
      );
    },

    getPlaceDetails: async (placeId: string): Promise<PlaceDetails> => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Mock place details
      const mockDetails: PlaceDetails = {
        placeId,
        formattedAddress: '123 Main Street, New York, NY 10001, USA',
        name: '123 Main Street',
        streetNumber: '123',
        streetName: 'Main Street',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'USA',
        geometry: {
          lat: 40.7128,
          lng: -74.0060
        },
        types: ['street_address', 'geocode']
      };
      
      return mockDetails;
    }
  };

  // Handle input changes with debouncing
  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    setSelectedPlace(null);
    setApiError(null);
    onInputChange?.(newValue);

    // Clear existing debounce timer
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new debounce timer
    debounceRef.current = setTimeout(() => {
      if (newValue.length >= 3) {
        fetchPredictions(newValue);
      } else {
        setPredictions([]);
        setShowDropdown(false);
      }
    }, 300);
  };

  // Fetch place predictions
  const fetchPredictions = async (query: string) => {
    setIsLoading(true);
    setApiError(null);

    try {
      const results = await mockPlacesService.getPlacePredictions(query);
      setPredictions(results);
      setShowDropdown(results.length > 0);
    } catch (error) {
      console.error('Error fetching predictions:', error);
      setApiError('Failed to fetch address suggestions');
      setPredictions([]);
      setShowDropdown(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle place selection
  const handlePlaceSelect = async (prediction: PlaceResult) => {
    setInputValue(prediction.description);
    setShowDropdown(false);
    setIsLoading(true);

    try {
      const placeDetails = await mockPlacesService.getPlaceDetails(prediction.placeId);
      setSelectedPlace(placeDetails);
      onPlaceSelect(placeDetails);
    } catch (error) {
      console.error('Error fetching place details:', error);
      setApiError('Failed to fetch address details');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle clicks outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

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
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            ref={inputRef}
            id={id}
            type="text"
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            className={`pl-10 pr-10 ${error ? 'border-destructive' : ''} ${
              selectedPlace ? 'border-green-500' : ''
            }`}
            autoComplete="address-line1"
          />
          
          {/* Loading/Status Indicator */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {selectedPlace && !isLoading && (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
            {apiError && !isLoading && (
              <AlertCircle className="h-4 w-4 text-destructive" />
            )}
          </div>
        </div>

        {/* Dropdown with predictions */}
        {showDropdown && predictions.length > 0 && (
          <Card ref={dropdownRef} className="absolute z-50 w-full mt-1 max-h-64 overflow-auto">
            <CardContent className="p-0">
              {predictions.map((prediction, index) => (
                <Button
                  key={prediction.placeId}
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

        {/* No results message */}
        {showDropdown && predictions.length === 0 && !isLoading && inputValue.length >= 3 && (
          <Card ref={dropdownRef} className="absolute z-50 w-full mt-1">
            <CardContent className="p-3 text-center text-sm text-muted-foreground">
              No addresses found for "{inputValue}"
            </CardContent>
          </Card>
        )}
      </div>

      {/* Error message */}
      {(error || apiError) && (
        <p className="text-destructive text-sm flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error || apiError}
        </p>
      )}

      {/* Selected place info */}
      {selectedPlace && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-4 w-4" />
            <span className="font-medium">Address verified</span>
          </div>
          <div className="text-green-600 mt-1">
            {selectedPlace.formattedAddress}
          </div>
        </div>
      )}

      {/* Development note */}
      <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
        <p className="font-medium mb-1">🔧 Development Mode</p>
        <p>Using mock Google Places API. In production, integrate with:</p>
        <code className="text-xs bg-background px-1 rounded">
          https://maps.googleapis.com/maps/api/place/
        </code>
      </div>
    </div>
  );
}