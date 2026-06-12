import React, { useEffect, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Check, ChevronsUpDown, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  const [open, setOpen] = useState(false);

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

  const toggle = (id: number) => {
    if (selectedCategories.includes(id)) {
      onCategoriesChange(selectedCategories.filter(c => c !== id));
    } else {
      onCategoriesChange([...selectedCategories, id]);
    }
  };

  const remove = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onCategoriesChange(selectedCategories.filter(c => c !== id));
  };

  const selectedNames = categories.filter(c => selectedCategories.includes(c.id));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium leading-none">
          Service Categories
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
        {selectedCategories.length > 0 && (
          <span className="text-xs text-muted-foreground">{selectedCategories.length} selected</span>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal h-11"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading categories…
              </span>
            ) : selectedCategories.length === 0 ? (
              <span className="text-muted-foreground">Select categories…</span>
            ) : (
              <span className="text-foreground">
                {selectedCategories.length === 1
                  ? selectedNames[0]?.name
                  : `${selectedCategories.length} categories selected`}
              </span>
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search categories…" className="h-9" />
            <CommandList>
              <CommandEmpty>No categories found.</CommandEmpty>
              <CommandGroup>
                {categories.map(category => (
                  <CommandItem
                    key={category.id}
                    value={category.name}
                    onSelect={() => toggle(category.id)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4 shrink-0',
                        selectedCategories.includes(category.id) ? 'opacity-100 text-primary' : 'opacity-0'
                      )}
                    />
                    <span className="text-sm">{category.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected chips */}
      {selectedNames.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {selectedNames.map(cat => (
            <Badge
              key={cat.id}
              variant="secondary"
              className="gap-1 pr-1 pl-2 text-xs font-medium"
            >
              {cat.name}
              <button
                type="button"
                onClick={(e) => remove(cat.id, e)}
                className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5 transition-colors"
                aria-label={`Remove ${cat.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {required && selectedCategories.length === 0 && !isLoading && (
        <p className="text-xs text-destructive">Please select at least one category</p>
      )}
    </div>
  );
};
