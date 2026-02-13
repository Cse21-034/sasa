import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Tag, Calendar, Loader2, Upload, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth-context';
import { Settings } from 'lucide-react';
import { Link } from 'wouter';
import { uploadToCloudinary } from '@/lib/cloudinary';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function SupplierDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<any>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discountPercentage: '',
    validFrom: '',
    validUntil: '',
    termsAndConditions: '',
  });

  const { data: promotions, isLoading } = useQuery({
    queryKey: ['supplierPromotions'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/supplier/promotions');
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/supplier/promotions', data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Promotion created successfully!' });
      queryClient.invalidateQueries({ queryKey: ['supplierPromotions'] });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create promotion',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest('PATCH', `/api/supplier/promotions/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Promotion updated successfully!' });
      queryClient.invalidateQueries({ queryKey: ['supplierPromotions'] });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update promotion',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/supplier/promotions/${id}`, {});
    },
    onSuccess: () => {
      toast({ title: 'Promotion deleted successfully!' });
      queryClient.invalidateQueries({ queryKey: ['supplierPromotions'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete promotion',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploadingImages(true);
    try {
      const uploadPromises = Array.from(files).map((file) => {
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: 'File too large',
            description: `${file.name} exceeds 5MB limit`,
            variant: 'destructive',
          });
          return Promise.reject(new Error(`${file.name} exceeds 5MB limit`));
        }
        return uploadToCloudinary(file, {
          folder: `supplier-promotions/${user?.id}`,
          width: 800,
          height: 600,
          crop: 'fill',
          quality: 'auto',
          format: 'auto',
        });
      });

      const results = await Promise.all(uploadPromises);
      const newImages = results.map((result) => result.url);
      
      setUploadedImages((prev) => [...prev, ...newImages]);
      toast({
        title: 'Images uploaded',
        description: `${newImages.length} image(s) uploaded successfully.`,
      });
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      discountPercentage: '',
      validFrom: '',
      validUntil: '',
      termsAndConditions: '',
    });
    setUploadedImages([]);
    setEditingPromotion(null);
    setShowPromotionDialog(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      discountPercentage: formData.discountPercentage ? parseInt(formData.discountPercentage) : undefined,
      images: uploadedImages,
    };

    if (editingPromotion) {
      updateMutation.mutate({ id: editingPromotion.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (promotion: any) => {
    setEditingPromotion(promotion);
    setFormData({
      title: promotion.title,
      description: promotion.description,
      discountPercentage: promotion.discountPercentage?.toString() || '',
      validFrom: new Date(promotion.validFrom).toISOString().slice(0, 16),
      validUntil: new Date(promotion.validUntil).toISOString().slice(0, 16),
      termsAndConditions: promotion.termsAndConditions || '',
    });
    setUploadedImages(promotion.images || []);
    setShowPromotionDialog(true);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Supplier Dashboard</h1>
            <p className="text-muted-foreground">Manage your promotions and specials</p>
          </div>
          <Link href="/supplier/settings">
            <Button variant="outline" className="gap-2">
              <Settings className="h-4 w-4" />
              Profile Settings
            </Button>
          </Link>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Promotions</CardTitle>
              <CardDescription>Create and manage special offers for your customers</CardDescription>
            </div>
            <Button onClick={() => setShowPromotionDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Promotion
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : promotions && promotions.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {promotions.map((promo: any) => (
                <Card key={promo.id} className="border hover-elevate">
                  <CardContent className="p-6">
                    {promo.images && promo.images.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        {promo.images.slice(0, 3).map((img: string, idx: number) => (
                          <img
                            key={idx}
                            src={img}
                            alt={`Promotion ${idx + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    )}

                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-bold">{promo.title}</h3>
                      {promo.discountPercentage && (
                        <Badge className="bg-destructive text-destructive-foreground">
                          {promo.discountPercentage}% OFF
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {promo.description}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {new Date(promo.validFrom).toLocaleDateString()} - {new Date(promo.validUntil).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(promo)} className="flex-1">
                        <Edit className="h-3 w-3 mr-2" />
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="flex-1">
                            <Trash2 className="h-3 w-3 mr-2" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Promotion?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove this promotion. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(promo.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    <Badge variant={promo.isActive ? 'default' : 'secondary'} className="mt-2">
                      {promo.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No promotions yet</p>
              <Button onClick={() => setShowPromotionDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Promotion
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Promotion Dialog */}
      <Dialog open={showPromotionDialog} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPromotion ? 'Edit Promotion' : 'Create New Promotion'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Promotion Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Summer Sale - 20% Off All Items"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your promotion in detail..."
                className="min-h-24"
                required
              />
            </div>

            <div>
              <Label htmlFor="discountPercentage">Discount Percentage (Optional)</Label>
              <Input
                id="discountPercentage"
                type="number"
                min="0"
                max="100"
                value={formData.discountPercentage}
                onChange={(e) => setFormData({ ...formData, discountPercentage: e.target.value })}
                placeholder="e.g., 20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="validFrom">Valid From *</Label>
                <Input
                  id="validFrom"
                  type="datetime-local"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="validUntil">Valid Until *</Label>
                <Input
                  id="validUntil"
                  type="datetime-local"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="images">Promotion Images (Optional)</Label>
              <div className="border-2 border-dashed rounded-lg p-6 hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="images"
                />
                <label htmlFor="images" className="flex flex-col items-center cursor-pointer">
                  <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm font-medium mb-1">Click to upload images</p>
                  <p className="text-xs text-muted-foreground">Max 5MB per image</p>
                </label>
              </div>

              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mt-4">
                  {uploadedImages.map((img, index) => (
                    <div key={index} className="relative group">
                      <img src={img} alt={`Upload ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="terms">Terms & Conditions (Optional)</Label>
              <Textarea
                id="terms"
                value={formData.termsAndConditions}
                onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
                placeholder="Enter any terms and conditions..."
                className="min-h-20"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingPromotion ? 'Update Promotion' : 'Create Promotion'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
