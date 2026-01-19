import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface Category {
  id: number;
  name: string;
  description?: string;
  icon?: string;
}

interface CategorySelectorProps {
  selectedCategories: number[];
  onCategoriesChange: (categories: number[]) => void;
  required?: boolean;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategories,
  onCategoriesChange,
  required = false,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const response = await apiRequest('GET', '/api/categories');
        const data = await response.json();
        setCategories(data);
        setError(null);
      } catch (err: any) {
        setError('Failed to load categories');
        console.error('Error fetching categories:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleCategoryToggle = (categoryId: number) => {
    if (selectedCategories.includes(categoryId)) {
      onCategoriesChange(selectedCategories.filter(id => id !== categoryId));
    } else {
      onCategoriesChange([...selectedCategories, categoryId]);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Service Categories</CardTitle>
          <CardDescription>Select the categories you provide services for</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Categories</CardTitle>
        <CardDescription>
          Select the categories you provide services for{required && <span className="text-red-500"> *</span>}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {selectedCategories.length > 0 && required && (
          <Alert>
            <AlertDescription>
              You've selected {selectedCategories.length} categor{selectedCategories.length === 1 ? 'y' : 'ies'}
            </AlertDescription>
          </Alert>
        )}

        <div className="max-h-[500px] overflow-y-auto border rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map(category => (
              <div key={category.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                <Checkbox
                  id={`category-${category.id}`}
                  checked={selectedCategories.includes(category.id)}
                  onCheckedChange={() => handleCategoryToggle(category.id)}
                />
                <Label
                  htmlFor={`category-${category.id}`}
                  className="flex-1 cursor-pointer font-normal"
                >
                  <div className="font-medium text-sm md:text-base">{category.name}</div>
                  {category.description && (
                    <div className="text-xs md:text-sm text-muted-foreground">{category.description}</div>
                  )}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {categories.length === 0 && !error && (
          <p className="text-sm text-muted-foreground">No categories available</p>
        )}

        {required && selectedCategories.length === 0 && (
          <Alert variant="destructive">
            <AlertDescription>Please select at least one category</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
