// remove undefined values from an object
export const cleanObject = (obj: any): any => {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
  
    if (Array.isArray(obj)) {
      return obj.map(cleanObject).filter(item => item !== undefined);
    }
  
    const cleaned: any = {};
    Object.entries(obj).forEach(([key, value]) => {
      const cleanedValue = cleanObject(value); // Recursive call
      if (cleanedValue !== undefined) {
        cleaned[key] = cleanedValue;
      }
    });
    
    return Object.keys(cleaned).length > 0 ? cleaned : undefined;
  };