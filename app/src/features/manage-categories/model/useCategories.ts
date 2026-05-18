import { useEffect, useState } from 'react';

import type { Category, CategoryKind } from '@entities/category';
import { useGoogleAuth } from '@features/google-auth';
import { localStorageService } from '@shared/lib/storage/local-storage.service';

import { createCategory, readCategories } from '../lib/manage-categories.service';

export function useCategories(kind: CategoryKind) {
  const googleAuth = useGoogleAuth();
  const spreadsheetId = localStorageService.get('spreadsheetId');
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadCategories() {
      setIsLoading(true);
      setError(null);

      try {
        const loadedCategories = await readCategories({
          accessToken: googleAuth.accessToken,
          spreadsheetId,
        });

        if (isActive) {
          setCategories(loadedCategories);
        }
      } catch (caughtError) {
        if (isActive) {
          setError(
            caughtError instanceof Error ? caughtError.message : 'Could not load categories.',
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadCategories();

    return () => {
      isActive = false;
    };
  }, [googleAuth.accessToken, spreadsheetId]);

  async function createAndSelectCategory(name: string) {
    setIsCreating(true);
    setError(null);

    try {
      const category = await createCategory({
        accessToken: googleAuth.accessToken,
        existingCategories: categories,
        kind,
        name,
        spreadsheetId,
      });

      setCategories((currentCategories) =>
        currentCategories.some((currentCategory) => currentCategory.id === category.id)
          ? currentCategories
          : [...currentCategories, category],
      );

      return category;
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not create category.');
      return null;
    } finally {
      setIsCreating(false);
    }
  }

  return {
    categories,
    createAndSelectCategory,
    error,
    isCreating,
    isLoading,
  };
}
