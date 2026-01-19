// client/src/pages/jobs/post.tsx - WITH HIGH ACCURACY LOCATION

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { MapPin, Upload, AlertCircle, Loader2, Camera, X, DollarSign, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { insertJobSchema, type Category, botswanaCities } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function PostJob() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const form = useForm({
    resolver: zodResolver(insertJobSchema),
    defaultValues: {
      title: '',
      description: '',
      categoryId: undefined as unknown as number,
      latitude: '',
      longitude: '',
      address: '',
      city: undefined as any,
      region: '',
      urgency: 'normal' as const,
      preferredTime: undefined,
      startDate: undefined,
      expiryDate: undefined,
      photos: [],
      budgetMin: '',
      budgetMax: '',
      allowedProviderType: 'both' as const,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/jobs', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      toast({
        title: 'Job posted successfully!',
        description: 'Service providers in your area will be notified.',
      });
      setLocation('/my-jobs');
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to post job',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // IMPROVED: High-accuracy location with better error handling
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Geolocation not supported',
        description: 'Your browser does not support location services.',
        variant: 'destructive',
      });
      return;
    }

    setIsGettingLocation(true);

    // Request high accuracy location with multiple attempts
    let attempts = 0;
    // FIX: Increased max attempts for a better chance of high accuracy
    const maxAttempts = 5; 
    let bestAccuracy = Infinity;
    let bestPosition: GeolocationPosition | null = null;

    const tryGetLocation = () => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          attempts++;
          const { latitude, longitude, accuracy } = position.coords;
          
          // Keep the most accurate reading
          if (accuracy < bestAccuracy) {
            bestAccuracy = accuracy;
            bestPosition = position;
          }

          // FIX: Set "good enough" threshold to 25m
          if (bestAccuracy <= 25 || attempts >= maxAttempts) {
            if (bestPosition) {
              const { latitude: lat, longitude: lng, accuracy: acc } = bestPosition.coords;
              
              // Store coordinates with accuracy
              setLocationCoords({ lat, lng, accuracy: acc });
              
              // Set form values with high precision (7 decimal places ≈ 1.1cm accuracy)
              form.setValue('latitude', lat.toFixed(7));
              form.setValue('longitude', lng.toFixed(7));
              
              // Reverse geocode to get address
              try {
                const response = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
                );
                const data = await response.json();
                
                if (data.display_name) {
                  form.setValue('address', data.display_name);
                }
                
                // Extract city from address
                if (data.address) {
                  const city = data.address.city || data.address.town || data.address.village;
                  const matchedCity = botswanaCities.find(c => 
                    city?.toLowerCase().includes(c.toLowerCase())
                  );
                  if (matchedCity) {
                    form.setValue('city', matchedCity as any);
                  }
                }

                // FIX: Update toast message for 25m threshold and offer better guidance
                toast({
                  title: acc <= 25 ? '✅ Good accuracy achieved' : '⚠️ Low accuracy fallback',
                  description: `Location captured with ${acc.toFixed(1)}m accuracy${acc > 25 ? '. Accuracy is poor. Please manually verify or move to an open area and try again.' : '.'}`,
                  variant: acc <= 25 ? 'default' : 'warning',
                });
              } catch (error) {
                console.error('Reverse geocoding error:', error);
                toast({
                  title: 'Location captured',
                  description: `Accuracy: ${acc.toFixed(1)}m. Please enter your address manually.`,
                });
              } finally {
                setIsGettingLocation(false);
              }
            }
          } else {
            // Try again for better accuracy
            toast({
              title: `Attempt ${attempts}/${maxAttempts}`,
              description: `Current accuracy: ${accuracy.toFixed(1)}m. Trying for better precision...`,
            });
            setTimeout(tryGetLocation, 1000); // Wait 1 second between attempts
          }
        },
        (error) => {
          setIsGettingLocation(false);
          let errorMessage = 'Unable to get your location.';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable. Try moving to an area with better GPS signal.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Please try again.';
              break;
          }

          toast({
            title: 'Location error',
            description: errorMessage,
            variant: 'destructive',
          });
        },
        {
          enableHighAccuracy: true,  // Use GPS
          // FIX: Increased timeout from 15s to 30s to allow more time for a GPS fix
          timeout: 30000,            // 30 seconds per attempt
          maximumAge: 0              // Don't use cached position
        }
      );
    };

    tryGetLocation();
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setUploadedPhotos((prev) => [...prev, event.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removePhoto = (index: number) => {
    setUploadedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (data: any) => {
    mutation.mutate({ ...data, photos: uploadedPhotos });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-3xl">Post a Service Request</CardTitle>
          <CardDescription>
            Describe what you need and connect with qualified service providers in your area
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Fix leaking kitchen sink"
                        className="h-12"
                        data-testid="input-job-title"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      A clear, concise title helps providers understand your needs
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide detailed information about the work needed..."
                        className="min-h-32"
                        data-testid="input-job-description"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger className="h-12" data-testid="select-job-category">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      
<SelectContent>
  {categories?.map((cat) => (
    <SelectItem
      key={cat.id}
      value={cat.id.toString()}
      className="py-3"
    >
      <div className="flex flex-col">
        <span className="font-medium">{cat.name}</span>
        <span className="text-xs text-muted-foreground">
          {cat.description}
        </span>
      </div>
    </SelectItem>
  ))}
</SelectContent>

                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* City Selection */}
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City / Location</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select city" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {botswanaCities.map((city) => (
                          <SelectItem key={city} value={city}>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              {city}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Only service providers in this city will see your job
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Budget Range */}
              <div className="space-y-4">
                <FormLabel className="text-base flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Budget Range
                </FormLabel>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="budgetMin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum (BWP)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="500"
                            className="h-12"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="budgetMax"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum (BWP)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="1500"
                            className="h-12"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormDescription>
                  Provide an estimated price range for this service
                </FormDescription>
              </div>

              {/* Photo Upload */}
              <div className="space-y-4">
                <FormLabel className="text-base flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Photos (Optional)
                </FormLabel>
                <div className="border-2 border-dashed rounded-lg p-6 hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label
                    htmlFor="photo-upload"
                    className="flex flex-col items-center justify-center cursor-pointer"
                  >
                    <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm font-medium mb-1">Click to upload photos</p>
                    <p className="text-xs text-muted-foreground">
                      Help providers understand the job better with photos
                    </p>
                  </label>
                </div>
                
                {uploadedPhotos.length > 0 && (
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                    {uploadedPhotos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border-2"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* HIGH ACCURACY LOCATION SECTION */}
              <div className="space-y-4">
                <FormLabel className="text-base flex items-center gap-2">
                  <Navigation className="h-5 w-5" />
                  Precise Location
                </FormLabel>
                
                {locationCoords && (
                  <Alert className="bg-success/10 border-success/20">
                    <MapPin className="h-4 w-4 text-success" />
                    <AlertDescription>
                      Location captured with {locationCoords.accuracy.toFixed(0)}m accuracy
                      <br />
                      <span className="text-xs text-muted-foreground">
                        Coordinates: {locationCoords.lat.toFixed(7)}, {locationCoords.lng.toFixed(7)}
                      </span>
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="button"
                  variant="outline"
                  onClick={getCurrentLocation}
                  disabled={isGettingLocation}
                  className="w-full h-12"
                  data-testid="button-current-location"
                >
                  {isGettingLocation ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Getting precise location...
                    </>
                  ) : (
                    <>
                      <MapPin className="mr-2 h-4 w-4" />
                      Use Current Location (High Accuracy)
                    </>
                  )}
                </Button>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Detailed Address / Landmark</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter specific address, building name, or nearby landmark"
                          className="h-12"
                          data-testid="input-job-address"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Help providers find you easily with clear directions
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="allowedProviderType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider Type (Who can apply?)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select provider type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="individual">
                          Individual Service Providers Only
                        </SelectItem>
                        <SelectItem value="company">
                          Companies/Organizations Only
                        </SelectItem>
                        <SelectItem value="both">
                          Both Individual and Companies
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose who you'd like to hire for this job
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="urgency"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border-2 p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-warning" />
                        Emergency Request
                      </FormLabel>
                      <FormDescription>
                        Mark as emergency for urgent attention
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value === 'emergency'}
                        onCheckedChange={(checked) =>
                          field.onChange(checked ? 'emergency' : 'normal')
                        }
                        data-testid="switch-emergency"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preferredTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Time (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        className="h-12"
                        data-testid="input-preferred-time"
                        {...field}
                        value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''}
                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Start Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          className="h-12"
                          {...field}
                          value={field.value ? new Date(field.value).toISOString().slice(0, 10) : ''}
                          onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Expiry Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          className="h-12"
                          {...field}
                          value={field.value ? new Date(field.value).toISOString().slice(0, 10) : ''}
                          onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormDescription>
                        Job will be automatically hidden after this date
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-12"
                  onClick={() => setLocation('/jobs')}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-12"
                  disabled={mutation.isPending}
                  data-testid="button-submit-job"
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    'Post Job'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
