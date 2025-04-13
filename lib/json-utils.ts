// lib/json-utils.ts

/**
 * Converts a JSON string to an array. If the input is null, undefined, or invalid JSON,
 * returns an empty array.
 */
export function jsonToArray<T>(jsonString: string | null | undefined): T[] {
    if (!jsonString) return [];
    
    try {
      const parsed = JSON.parse(jsonString);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Error parsing JSON string:', error);
      return [];
    }
  }
  
  /**
   * Converts an array to a JSON string. If the input is null or undefined,
   * returns a JSON string representation of an empty array.
   */
  export function arrayToJson<T>(array: T[] | null | undefined): string {
    if (!array) return '[]';
    return JSON.stringify(array);
  }
  
  /**
   * Type to add images property to a product retrieved from the database
   */
  export type ProductWithImages<T extends { imagesJson?: string | null }> = Omit<T, 'imagesJson'> & {
    images: string[];
  };
  
  /**
   * Transforms a product by converting imagesJson to an images array
   */
  export function addImagesToProduct<T extends { imagesJson?: string | null }>(
    product: T
  ): ProductWithImages<T> {
    const { imagesJson, ...rest } = product;
    return {
      ...rest,
      images: jsonToArray<string>(imagesJson),
    } as ProductWithImages<T>;
  }
  
  /**
   * Transforms an array of products by converting imagesJson to an images array for each
   */
  export function addImagesToProducts<T extends { imagesJson?: string | null }>(
    products: T[]
  ): ProductWithImages<T>[] {
    return products.map(addImagesToProduct);
  }